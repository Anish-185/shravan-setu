import pytest

from referrals.models import Case, CaseEvent, ReminderLog
from referrals.state import LOST, TRANSITIONS, IllegalTransition, transition

ALL = [s for s, _ in Case.STATUSES]
# Shortest legal path from "screened" to each status, used to put a case into that status.
PATH = {
    "screened": [],
    "referred": ["referred"],
    "camp_scheduled": ["referred", "camp_scheduled"],
    "missed": ["referred", "camp_scheduled", "missed"],
    "rescheduled": ["referred", "camp_scheduled", "missed", "rescheduled"],
    "seen": ["referred", "camp_scheduled", "seen"],
    "treated": ["referred", "camp_scheduled", "seen", "treated"],
    "closed": ["referred", "camp_scheduled", "seen", "treated", "closed"],
    LOST: ["referred", LOST],
}
LEGAL = [(a, b) for a in ALL for b in sorted(TRANSITIONS[a])]
ILLEGAL = [(a, b) for a in ALL for b in ALL if b not in TRANSITIONS[a]]


def kwargs_for(to):
    return {"treatment": "hearing_aid"} if to == "treated" else {"reason": "no contact"} if to == LOST else {}


def test_table_covers_every_status():
    assert set(TRANSITIONS) == set(ALL) == set(PATH)


@pytest.mark.parametrize("frm,to", LEGAL)
def test_legal_transition(make_case, user, frm, to):
    case = make_case(PATH[frm])
    assert case.status == frm
    event = transition(case, to, actor=user, **kwargs_for(to))
    case.refresh_from_db()
    assert case.status == to
    assert (event.from_status, event.to_status, event.actor) == (frm, to, user)


@pytest.mark.parametrize("frm,to", ILLEGAL)
def test_illegal_transition_rejected(make_case, frm, to):
    case = make_case(PATH[frm])
    n_events = case.events.count()
    with pytest.raises(IllegalTransition):
        transition(case, to, **kwargs_for(to))
    case.refresh_from_db()
    assert case.status == frm and case.events.count() == n_events


def test_treated_needs_valid_treatment(make_case):
    case = make_case(PATH["seen"])
    for bad in ("", "cured"):
        with pytest.raises(IllegalTransition):
            transition(case, "treated", treatment=bad)
    transition(case, "treated", treatment="further_audiology")
    case.refresh_from_db()
    assert case.treatment == "further_audiology"


def test_lost_needs_reason(make_case):
    case = make_case(PATH["referred"])
    with pytest.raises(IllegalTransition):
        transition(case, LOST, reason="  ")
    transition(case, LOST, reason="family moved")
    case.refresh_from_db()
    assert case.lost_reason == "family moved"


def test_missed_logs_stubbed_reminder_in_both_languages(make_case):
    case = make_case(PATH["missed"])
    log = ReminderLog.objects.get(case=case)
    assert log.status == "would_send_stubbed"
    assert "not a diagnosis" in log.text_en and "camp." in log.text_en  # no camp booked: no date
    assert ") చెవి పరీక్ష క్యాంప్‌కు" in log.text_te and "  " not in log.text_te


def test_events_are_append_only(make_case):
    case = make_case(PATH["referred"])
    event = case.events.get()
    event.note = "edited"
    with pytest.raises(ValueError):
        event.save()
    with pytest.raises(ValueError):
        event.delete()
    assert CaseEvent.objects.filter(pk=event.pk, note="").exists()


def test_full_history_in_order(make_case):
    case = make_case(PATH["closed"])
    assert [e.to_status for e in case.events.all()] == PATH["closed"]


def test_rule_engine_treatments_and_statuses_match_the_model():
    from referrals import rules
    assert set(rules.TREATMENTS) == {k for k, _ in Case.TREATMENTS}
    assert set(rules.TRANSITIONS) == set(ALL)

