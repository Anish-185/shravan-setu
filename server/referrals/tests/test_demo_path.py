"""Demo path on the server (docs/DEMO_PATH.md): what the phone syncs for 3 children (1 REFER), then the camp
request, seen -> treated -> closed, all through /api/sync/ exactly as the phone sends it. The phone side of the
same path is screener/src/__tests__/demoPath.test.ts."""
import uuid

from django.core.management import call_command

from referrals import models

U = lambda: str(uuid.uuid4())  # noqa: E731


def child_records(school, name, outcome):
    ids = {k: U() for k in ("child", "consent", "session", "result")}
    recs = [
        {"type": "child", "id": ids["child"], "data": {"school": str(school.pk), "display_name": name, "age_band": "9-11"}},
        {"type": "consent", "id": ids["consent"], "data": {"child": ids["child"], "given_by": "parent", "method": "written"}},
        {"type": "screening_session", "id": ids["session"], "data": {
            "child": ids["child"], "consent": ids["consent"], "device_model": "2201117TI", "earphone_model": "wired",
            "volume_confirmed": True, "app_version": "test", "config_version": "0.1.0", "calibrated": False}},
        {"type": "screening_result", "id": ids["result"], "data": {
            "session": ids["session"], "outcome": outcome,
            "ear_outcomes": {"left": "REFER" if outcome == "REFER" else "PASS", "right": "PASS"}}},
    ]
    return recs, ids


def event(case, frm, to, **extra):
    return {"type": "case_event", "id": U(), "data": {"case": case, "from_status": frm, "to_status": to, **extra}}


def test_demo_path_end_to_end(api, school):
    call_command("load_facilities")
    phc = models.Facility.objects.get(code="SAMPLE-PHC-1")
    records, refer = [], None
    for name, outcome in (("Student D1", "PASS"), ("Student D2", "REFER"), ("Student D3", "PASS")):
        recs, ids = child_records(school, name, outcome)
        records += recs
        if outcome == "REFER":
            refer = ids
    case, camp = U(), U()
    records += [
        {"type": "case", "id": case, "data": {
            "child": refer["child"], "school": str(school.pk), "screening_result": refer["result"],
            "triage_answers": {"ear_pain": True}, "triage_route": "PHC", "triage_rule": "likely_treatable_cause",
            "facility": str(phc.pk)}},
        event(case, "screened", "referred"),
        {"type": "camp_request", "id": camp, "data": {
            "school": str(school.pk), "camp_date": "2026-10-24", "cases": [case], "facility": str(phc.pk)}},
        event(case, "referred", "camp_scheduled", note=f"camp request {camp}"),
        event(case, "camp_scheduled", "seen"),
        event(case, "seen", "treated", treatment="wax_removed"),
        event(case, "treated", "closed"),
    ]
    res = api.post("/api/sync/", {"records": records}, format="json").json()["results"]
    assert [r for r in res if r["status"] == "error"] == []
    c = models.Case.objects.get(pk=case)
    assert (c.status, c.treatment, c.triage_route, c.facility.code) == ("closed", "wax_removed", "PHC", "SAMPLE-PHC-1")
    assert list(c.events.values_list("to_status", flat=True)) == ["referred", "camp_scheduled", "seen", "treated", "closed"]
    assert models.ScreeningResult.objects.filter(session__child__school=school).count() == 3
    pdf = api.get(f"/api/camp-requests/{camp}/pdf/")
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF")
    # the phone retries a sync whose answer got lost: nothing changes
    again = api.post("/api/sync/", {"records": records}, format="json").json()["results"]
    assert [r for r in again if r["status"] == "error"] == [] and models.Case.objects.get(pk=case).status == "closed"


def test_demo_missed_branch_logs_stubbed_reminder(api, school):
    recs, ids = child_records(school, "Student D4", "REFER")
    case, camp = U(), U()
    recs += [
        {"type": "case", "id": case, "data": {"child": ids["child"], "school": str(school.pk), "screening_result": ids["result"]}},
        event(case, "screened", "referred"),
        {"type": "camp_request", "id": camp, "data": {"school": str(school.pk), "camp_date": "2026-10-24", "cases": [case]}},
        event(case, "referred", "camp_scheduled"),
        event(case, "camp_scheduled", "missed"),
    ]
    res = api.post("/api/sync/", {"records": recs}, format="json").json()["results"]
    assert [r for r in res if r["status"] == "error"] == []
    rem = models.ReminderLog.objects.get(case=case)
    assert "missed the ear-check camp on 24 Oct 2026" in rem.text_en and rem.text_te.startswith("[TODO_TE]")
