"""Case state machine: applies the transition table from referrals.rules (hand-written, docs/REUSE_LOG.md Phase 2)
to the database: append-only CaseEvents and stubbed reminders on 'missed'."""
from django.db import transaction

from .models import Case, CaseEvent, ReminderLog
from .rules import LOST, TRANSITIONS, TREATMENTS, check_transition  # noqa: F401  (re-exported for callers)

# English reminder template. Telugu must be written by a human (CLAUDE.md); until then it falls back to English
# with a visible TODO_TE marker.
REMINDER_EN = (
    "Reminder: {child} ({school}) missed the ear-check camp{date}. Please contact the class teacher to book a "
    "new date. This is a screening follow-up, not a diagnosis."
)
REMINDER_TE = None  # TODO_TE: Telugu text from [TELUGU_SPEAKER]


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
    text_en = REMINDER_EN.format(
        child=case.child.display_name,
        school=case.school.name,
        date=f" on {camp.camp_date:%d %b %Y}" if camp else "",
    )
    return ReminderLog.objects.create(
        case=case,
        to_phone=case.child.guardian_phone,
        text_en=text_en,
        text_te=REMINDER_TE or f"[TODO_TE] {text_en}",
    )
