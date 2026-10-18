"""Case state machine: applies the transition table from referrals.rules (hand-written, docs/REUSE_LOG.md Phase 2)
to the database: append-only CaseEvents and stubbed reminders on 'missed'."""
import json
import re

from django.conf import settings
from django.db import transaction

from .models import Case, CaseEvent, ReminderLog
from .rules import LOST, TRANSITIONS, TREATMENTS, check_transition  # noqa: F401  (re-exported for callers)

# Reminder template, shared with the phone (config/screening.json reminders.missed_camp). Missing Telugu falls back
# to English with a visible TODO_TE marker.
_REMINDER = json.loads((settings.BASE_DIR.parent / "config" / "screening.json").read_text())["reminders"]["missed_camp"]
REMINDER_EN = _REMINDER["value"]["en"]
REMINDER_TE = None if _REMINDER["value"]["te"] == "TODO_TE" else _REMINDER["value"]["te"]
REMINDER_DATE = _REMINDER["value"]["date"]


class IllegalTransition(ValueError):
    pass


def allowed(from_status, to_status):
    return to_status in TRANSITIONS.get(from_status, set())


ERRORS = {
    "illegal": "{frm} -> {to} is not allowed",
    "needs_treatment": "treated needs one of " + str(sorted(TREATMENTS)),
    "needs_reason": LOST + " needs a reason",
}


@transaction.atomic
def transition(case, to_status, *, actor=None, treatment="", reason="", note="", at=None, event_id=None):
    """Move a case to `to_status`, append a CaseEvent, and log a stubbed reminder on 'missed'."""
    case = Case.objects.select_for_update().get(pk=case.pk)
    verdict = check_transition(case.status, to_status, treatment, reason)
    if not verdict["allowed"]:
        raise IllegalTransition(ERRORS[verdict["why"]].format(frm=case.status, to=to_status))

    event_fields = dict(
        case=case, from_status=case.status, to_status=to_status, treatment=treatment, reason=reason,
        note=note, actor=actor,
    )
    if at is not None:
        event_fields["at"] = at
    if event_id is not None:
        event_fields["id"] = event_id
    event = CaseEvent.objects.create(**event_fields)

    case.status = to_status
    if to_status == "treated":
        case.treatment = treatment
    if to_status == LOST:
        case.lost_reason = reason
    case.save(update_fields=["status", "treatment", "lost_reason", "updated_at"])

    if to_status == "missed":
        log_missed_reminder(case)
    return event


def log_missed_reminder(case):
    camp = case.camp_requests.order_by("-camp_date").first()

    def fill(template, lang, date_fmt):
        date = REMINDER_DATE[lang].format(date=f"{camp.camp_date:{date_fmt}}") if camp else ""
        # no camp date: drop the double space Telugu word order leaves behind
        return re.sub(" {2,}", " ", template.format(child=case.child.display_name, school=case.school.name, date=date))

    text_en = fill(REMINDER_EN, "en", "%d %b %Y")
    return ReminderLog.objects.create(
        case=case,
        to_phone=case.child.guardian_phone,
        text_en=text_en,
        text_te=fill(REMINDER_TE, "te", "%d-%m-%Y") if REMINDER_TE else f"[TODO_TE] {text_en}",
    )
