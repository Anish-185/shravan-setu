"""Server audit log: every consent, result, case, status change and camp request is chained; tampering with any
entry is detected by `manage.py verify_audit_log`."""
import pytest
from django.core.management import CommandError, call_command

from referrals import models
from referrals.audit_log import verify
from referrals.state import transition

from .test_api import sync_payload


def kinds():
    return list(models.AuditEntry.objects.values_list("kind", flat=True))


def test_referral_and_status_changes_are_chained(make_case):
    case = make_case(["referred", "camp_scheduled"])
    # consent, result, case created, then per transition: the event and the case's new status
    assert kinds() == ["consent", "screening_result", "case", "case_event", "case", "case_event", "case"]
    v = verify()
    assert (v["ok"], v["entries"]) == (True, 7)
    last = models.AuditEntry.objects.last()
    assert (last.kind, last.record_id) == ("case", str(case.pk)) and '"status": "camp_scheduled"' in last.data
    assert v["head"] == last.hash


def test_sync_is_logged_once_and_a_resync_adds_nothing(api, school):
    payload, ids = sync_payload(school)
    api.post("/api/sync/", payload, format="json")
    n = models.AuditEntry.objects.count()
    assert set(kinds()) == {"consent", "screening_result", "case", "case_event"}
    api.post("/api/sync/", payload, format="json")
    assert models.AuditEntry.objects.count() == n
    payload["records"][2]["data"]["method"] = "written"  # a real change to the consent is logged
    api.post("/api/sync/", payload, format="json")
    assert models.AuditEntry.objects.count() == n + 1 and verify()["ok"]


def test_entries_cannot_be_changed_or_deleted_through_the_model(make_case):
    make_case(["referred"])
    e = models.AuditEntry.objects.first()
    e.data = "{}"
    with pytest.raises(ValueError):
        e.save()
    with pytest.raises(ValueError):
        e.delete()


@pytest.mark.parametrize("tamper,at,why", [
    (lambda q: q.filter(seq=2).update(data='{"outcome": "PASS"}'), 2, "hash"),
    (lambda q: q.filter(seq=3).update(at="2020-01-01T00:00:00+00:00"), 3, "hash"),
    (lambda q: q.filter(seq=4).update(kind="consent"), 4, "hash"),
    (lambda q: q.filter(seq=2).delete(), 2, "seq"),
])
def test_tampering_is_detected(make_case, tamper, at, why):
    make_case(["referred", "camp_scheduled"])
    call_command("verify_audit_log")
    tamper(models.AuditEntry.objects)  # bulk queryset writes bypass the model guards, like editing the DB directly
    v = verify()
    assert (v["ok"], v["broken_at"], v["why"]) == (False, at, why)
    with pytest.raises(CommandError, match=f"BROKEN at entry {at}"):
        call_command("verify_audit_log")


def test_camp_request_is_logged(api, make_case, school):
    case = make_case(["referred"])
    r = api.post("/api/camp-requests/", {"school": str(school.pk), "camp_date": "2026-11-02", "cases": [str(case.pk)]},
                 format="json")
    assert r.status_code == 201, r.content
    assert "camp_request" in kinds() and verify()["ok"]
    transition(case, "seen")
    assert verify()["ok"]
