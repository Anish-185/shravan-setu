from rest_framework import serializers

from . import models


def model_serializer(model_cls, read_only=()):
    meta = type("Meta", (), {"model": model_cls, "fields": "__all__", "read_only_fields": read_only})
    return type(f"{model_cls.__name__}Serializer", (serializers.ModelSerializer,), {"Meta": meta})


SchoolSerializer = model_serializer(models.School)
ClassroomSerializer = model_serializer(models.Classroom)
ChildSerializer = model_serializer(models.Child)
ConsentSerializer = model_serializer(models.Consent)
ScreeningResultSerializer = model_serializer(models.ScreeningResult)
ReminderLogSerializer = model_serializer(models.ReminderLog)
FacilitySerializer = model_serializer(models.Facility)
CaseEventSerializer = model_serializer(models.CaseEvent)


class ScreeningSessionSerializer(model_serializer(models.ScreeningSession)):
    def validate(self, attrs):
        child = attrs.get("child", getattr(self.instance, "child", None))
        consent = attrs.get("consent", getattr(self.instance, "consent", None))
        if consent and child and consent.child_id != child.pk:
            raise serializers.ValidationError("consent belongs to a different child")
        return attrs


# Status, treatment and lost_reason change only through state transitions (CaseEvents).
CaseSerializer = model_serializer(models.Case, read_only=("status", "treatment", "lost_reason", "owner"))


class CaseDetailSerializer(CaseSerializer):
    events = CaseEventSerializer(many=True, read_only=True)


class TransitionSerializer(serializers.Serializer):
    to_status = serializers.CharField()
    treatment = serializers.CharField(required=False, allow_blank=True, default="")
    reason = serializers.CharField(required=False, allow_blank=True, default="")
    note = serializers.CharField(required=False, allow_blank=True, default="")


class CampRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CampRequest
        fields = "__all__"
        read_only_fields = ("created_by",)

    def validate(self, attrs):
        cases = attrs.get("cases", [])
        if not cases:
            raise serializers.ValidationError("select at least one case")
        bad = [str(c.pk) for c in cases if c.school_id != attrs["school"].pk or c.status not in ("referred", "rescheduled")]
        if bad:
            raise serializers.ValidationError(f"cases must be referred/rescheduled and from this school: {bad}")
        return attrs
