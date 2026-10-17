import csv
import io

from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from . import models, serializers as s
from .pdf import table_pdf
from .state import IllegalTransition, transition

BANNER = "SCREENING, NOT DIAGNOSIS"

# Upsert order matters: parents before children. case_event is handled separately (it moves the state machine).
SYNC_TYPES = {
    "school": (models.School, s.SchoolSerializer),
    "classroom": (models.Classroom, s.ClassroomSerializer),
    "child": (models.Child, s.ChildSerializer),
    "consent": (models.Consent, s.ConsentSerializer),
    "screening_session": (models.ScreeningSession, s.ScreeningSessionSerializer),
    "screening_result": (models.ScreeningResult, s.ScreeningResultSerializer),
    "case": (models.Case, s.CaseSerializer),
}


class SyncView(APIView):
    """Batch upsert, idempotent by client UUID. Records are applied in the order sent; each one succeeds or fails
    on its own. Body: {"records": [{"type": ..., "id": ..., "data": {...}}]}."""

    def post(self, request):
        records = request.data.get("records")
        if not isinstance(records, list):
            return Response({"detail": "records must be a list"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"results": [self.apply(r, request.user) for r in records]})

    def apply(self, record, user):
        rtype, rid, data = record.get("type"), record.get("id"), record.get("data") or {}
        result = {"type": rtype, "id": rid}
        try:
            with transaction.atomic():
                if rtype == "case_event":
                    result["status"] = self.apply_event(rid, data, user)
                elif rtype in SYNC_TYPES:
                    result["status"] = self.upsert(rtype, rid, data, user)
                else:
                    raise ValueError(f"unknown type {rtype!r}")
        except (ValueError, IllegalTransition, models.Case.DoesNotExist) as e:
            result.update(status="error", errors=str(e))
        except ValidationError as e:
            result.update(status="error", errors=e.detail)
        return result

    def upsert(self, rtype, rid, data, user):
        model, serializer_cls = SYNC_TYPES[rtype]
        instance = model.objects.filter(pk=rid).first()
        ser = serializer_cls(instance, data={**data, "id": rid})
        ser.is_valid(raise_exception=True)
        extra = {"owner": user} if rtype == "case" and instance is None else {}
        ser.save(**extra)
        return "updated" if instance else "created"

    def apply_event(self, rid, data, user):
        if models.CaseEvent.objects.filter(pk=rid).exists():
            return "duplicate"
        case = models.Case.objects.get(pk=data.get("case"))
        expected = data.get("from_status")
        if expected and expected != case.status:
            raise IllegalTransition(f"conflict: case is {case.status}, event expects {expected}")
        at = parse_datetime(data["at"]) if data.get("at") else None
        transition(
            case, data.get("to_status", ""), actor=user, treatment=data.get("treatment", ""),
            reason=data.get("reason", ""), note=data.get("note", ""), at=at, event_id=rid,
        )
        return "created"


class CaseViewSet(viewsets.ReadOnlyModelViewSet):
    """List (?status=, ?school=, ?updated_since=ISO-8601) and detail with full status history."""

    def get_queryset(self):
        qs = models.Case.objects.select_related("child", "school").order_by("-updated_at")
        p = self.request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("school"):
            qs = qs.filter(school=p["school"])
        if p.get("updated_since"):
            since = parse_datetime(p["updated_since"])
            if since is None:
                raise ValidationError({"updated_since": "use ISO-8601"})
            qs = qs.filter(updated_at__gt=since)
        return qs

    def get_serializer_class(self):
        return s.CaseDetailSerializer if self.action == "retrieve" else s.CaseSerializer

    @action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        body = s.TransitionSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        try:
            transition(self.get_object(), actor=request.user, **body.validated_data)
        except IllegalTransition as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(s.CaseDetailSerializer(models.Case.objects.get(pk=pk)).data)


class CampRequestViewSet(mixins.CreateModelMixin, viewsets.ReadOnlyModelViewSet):
    """Create a camp request from selected referred/rescheduled cases; each case moves to camp_scheduled."""

    queryset = models.CampRequest.objects.order_by("-camp_date")
    serializer_class = s.CampRequestSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        camp = serializer.save(created_by=self.request.user)
        for case in camp.cases.all():
            transition(case, "camp_scheduled", actor=self.request.user, note=f"camp request {camp.pk}")

    def export_rows(self, camp):
        columns = ["Child (pseudonym)", "ID", "Class", "Ear(s)", "Outcome", "Triage route", "Status"]
        rows = []
        for case in camp.cases.select_related("child__classroom", "screening_result").order_by("child__display_name"):
            res = case.screening_result
            ears = [e for e, o in (res.ear_outcomes if res else {}).items() if o == "REFER"]
            rows.append([
                case.child.display_name, str(case.child.pk)[:8],
                case.child.classroom.name if case.child.classroom else "",
                "+".join(ears) or "-", res.outcome if res else "-", case.triage_route or "-", case.status,
            ])
        header = [
            f"School: {camp.school.name}",
            f"Camp date: {camp.camp_date:%d %b %Y}    Facility: {camp.facility or 'not set'}",
            f"Request: {camp.pk}    Generated: {timezone.now():%Y-%m-%d %H:%M} UTC",
            "Screening and referral list only. Outcomes are screening results, not diagnoses.",
        ]
        return header, columns, rows

    @action(detail=True, methods=["get"], url_path="csv")
    def export_csv(self, request, pk=None):
        header, columns, rows = self.export_rows(self.get_object())
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow([BANNER])
        for line in header:
            w.writerow([line])
        w.writerow(columns)
        w.writerows(rows)
        resp = HttpResponse(buf.getvalue(), content_type="text/csv")
        resp["Content-Disposition"] = f'attachment; filename="camp-request-{pk}.csv"'
        return resp

    @action(detail=True, methods=["get"], url_path="pdf")
    def export_pdf(self, request, pk=None):
        resp = HttpResponse(table_pdf(BANNER, *self.export_rows(self.get_object())), content_type="application/pdf")
        resp["Content-Disposition"] = f'attachment; filename="camp-request-{pk}.pdf"'
        return resp


class ReminderLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Stubbed reminders: what WOULD be sent for missed appointments. Nothing is sent."""

    queryset = models.ReminderLog.objects.select_related("case").order_by("-created_at")
    serializer_class = s.ReminderLogSerializer
