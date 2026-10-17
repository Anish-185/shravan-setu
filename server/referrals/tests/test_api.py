import csv
import datetime
import io
import uuid

import pytest
from django.core.management import call_command
from rest_framework.test import APIClient

from referrals import models

DAY = str(datetime.date.today() + datetime.timedelta(days=3))


def sync_payload(school):
    ids = {k: str(uuid.uuid4()) for k in ("classroom", "child", "consent", "session", "result", "case", "event")}
    records = [
        {"type": "classroom", "id": ids["classroom"], "data": {"school": str(school.pk), "name": "Class 4"}},
        {"type": "child", "id": ids["child"], "data": {
            "school": str(school.pk), "classroom": ids["classroom"], "display_name": "Student S1", "age_band": "9-11"}},
        {"type": "consent", "id": ids["consent"], "data": {
            "child": ids["child"], "given_by": "guardian", "method": "verbal"}},
        {"type": "screening_session", "id": ids["session"], "data": {
            "child": ids["child"], "consent": ids["consent"], "device_model": "P", "earphone_model": "E",
            "volume_confirmed": True, "app_version": "0.1", "config_version": "0.1"}},
        {"type": "screening_result", "id": ids["result"], "data": {
            "session": ids["session"], "outcome": "REFER", "ear_outcomes": {"left": "PASS", "right": "REFER"}}},
        {"type": "case", "id": ids["case"], "data": {
            "child": ids["child"], "school": str(school.pk), "screening_result": ids["result"], "triage_route": "DEIC"}},
        {"type": "case_event", "id": ids["event"], "data": {
            "case": ids["case"], "from_status": "screened", "to_status": "referred", "at": "2026-10-17T05:00:00Z"}},
    ]
    return {"records": records}, ids


def test_schools_list_for_phone_setup(api, school):
    assert [x["name"] for x in api.get("/api/schools/").json()] == ["Test School (FAKE)"]


def test_sync_session_carries_calibration_ambient_and_lr_check(api, school):
    payload, ids = sync_payload(school)
    payload["records"][3]["data"].update(calibrated=False, ambient_db_re_reference=-1.5, lr_check_passed=True)
    api.post("/api/sync/", payload, format="json")
    sess = models.ScreeningSession.objects.get(pk=ids["session"])
    assert (sess.calibrated, sess.ambient_db_re_reference, sess.lr_check_passed) == (False, -1.5, True)


# --- auth -------------------------------------------------------------------------------------------------------

@pytest.mark.parametrize("method,url", [
    ("get", "/api/cases/"), ("post", "/api/sync/"), ("get", "/api/camp-requests/"), ("post", "/api/camp-requests/"),
    ("get", "/api/reminders/"), ("get", "/api/schools/"),
    # original apigateway endpoints are protected too
    ("get", "/users/"), ("post", "/users/"), ("get", "/classrooms/"), ("get", "/useronlyresults/"),
])
def test_auth_required(db, method, url):
    assert getattr(APIClient(), method)(url, {}, format="json").status_code == 401


def test_token_endpoint_issues_token(user):
    user.set_password("pw-for-test-only")
    user.save()
    r = APIClient().post("/api/token/", {"username": "teacher", "password": "pw-for-test-only"}, format="json")
    assert r.status_code == 200 and r.json()["token"]


def test_case_detail_needs_auth_even_with_valid_id(make_case):
    case = make_case()
    assert APIClient().get(f"/api/cases/{case.pk}/").status_code == 401


# --- sync -------------------------------------------------------------------------------------------------------

def test_sync_creates_everything_and_applies_event(api, school):
    payload, ids = sync_payload(school)
    r = api.post("/api/sync/", payload, format="json")
    assert r.status_code == 200
    assert [x["status"] for x in r.json()["results"]] == ["created"] * 7
    case = models.Case.objects.get(pk=ids["case"])
    assert case.status == "referred"
    assert case.events.get().pk == uuid.UUID(ids["event"])


def test_sync_is_idempotent(api, school):
    payload, _ = sync_payload(school)
    api.post("/api/sync/", payload, format="json")
    counts = {m: m.objects.count() for m in (models.Child, models.Consent, models.ScreeningSession,
                                              models.ScreeningResult, models.Case, models.CaseEvent)}
    r = api.post("/api/sync/", payload, format="json")
    assert [x["status"] for x in r.json()["results"]] == ["updated"] * 6 + ["duplicate"]
    assert {m: m.objects.count() for m in counts} == counts
    assert models.Case.objects.get().status == "referred"


def test_sync_update_changes_fields(api, school):
    payload, ids = sync_payload(school)
    api.post("/api/sync/", payload, format="json")
    payload["records"][1]["data"]["display_name"] = "Student S1-renamed"
    api.post("/api/sync/", payload, format="json")
    assert models.Child.objects.get(pk=ids["child"]).display_name == "Student S1-renamed"


def test_sync_case_status_cannot_be_set_directly(api, school):
    payload, ids = sync_payload(school)
    payload["records"][5]["data"]["status"] = "closed"
    payload["records"] = payload["records"][:6]
    api.post("/api/sync/", payload, format="json")
    assert models.Case.objects.get(pk=ids["case"]).status == "screened"


def test_sync_reports_per_record_errors(api, school):
    payload, ids = sync_payload(school)
    api.post("/api/sync/", payload, format="json")
    new_child = str(uuid.uuid4())
    batch = {"records": [
        {"type": "consent", "id": str(uuid.uuid4()), "data": {
            "child": ids["child"], "given_by": "parent", "method": "telepathy"}},  # invalid choice
        {"type": "case_event", "id": str(uuid.uuid4()), "data": {
            "case": ids["case"], "to_status": "closed"}},  # illegal: referred -> closed
        {"type": "spaceship", "id": str(uuid.uuid4()), "data": {}},  # unknown type
        {"type": "child", "id": new_child, "data": {
            "school": str(school.pk), "display_name": "Student S2", "age_band": "6-8"}},  # valid
    ]}
    res = api.post("/api/sync/", batch, format="json").json()["results"]
    assert [x["status"] for x in res] == ["error", "error", "error", "created"]
    assert "method" in res[0]["errors"]
    assert "not allowed" in res[1]["errors"]
    assert models.Child.objects.filter(pk=new_child).exists()
    assert models.Case.objects.get(pk=ids["case"]).status == "referred"


def test_sync_dependent_records_fail_together(api, school):
    payload, ids = sync_payload(school)
    payload["records"][2]["data"]["method"] = "telepathy"  # consent fails...
    res = api.post("/api/sync/", payload, format="json").json()["results"]
    # ...so session, result, case and event that depend on it also fail, and can be retried later.
    assert [x["status"] for x in res] == ["created", "created"] + ["error"] * 5
    payload["records"][2]["data"]["method"] = "verbal"
    res = api.post("/api/sync/", payload, format="json").json()["results"]
    assert [x["status"] for x in res] == ["updated", "updated"] + ["created"] * 5


def test_sync_event_conflict_detected(api, school):
    payload, ids = sync_payload(school)
    api.post("/api/sync/", payload, format="json")
    stale = {"records": [{"type": "case_event", "id": str(uuid.uuid4()), "data": {
        "case": ids["case"], "from_status": "screened", "to_status": "referred"}}]}
    res = api.post("/api/sync/", stale, format="json").json()["results"][0]
    assert res["status"] == "error" and "conflict" in res["errors"]


def test_sync_rejects_consent_for_other_child(api, school, make_case):
    other = make_case(name="Student Other")
    payload, _ = sync_payload(school)
    payload["records"][3]["data"]["consent"] = str(other.child.consents.get().pk)
    res = api.post("/api/sync/", payload, format="json").json()["results"]
    assert res[3]["status"] == "error"


def test_sync_rejects_non_list(api):
    assert api.post("/api/sync/", {"records": "x"}, format="json").status_code == 400


# --- cases ------------------------------------------------------------------------------------------------------

def test_case_list_filters(api, make_case):
    a = make_case(["referred"], name="Student F1")
    make_case([], name="Student F2")
    r = api.get("/api/cases/?status=referred")
    assert [c["id"] for c in r.json()] == [str(a.pk)]
    assert api.get("/api/cases/?updated_since=2999-01-01T00:00:00Z").json() == []
    assert api.get("/api/cases/?updated_since=yesterday").status_code == 400


def test_case_detail_has_history(api, make_case):
    case = make_case(["referred", "camp_scheduled"])
    events = api.get(f"/api/cases/{case.pk}/").json()["events"]
    assert [e["to_status"] for e in events] == ["referred", "camp_scheduled"]


def test_transition_api(api, make_case, user):
    case = make_case(["referred", "camp_scheduled", "seen"])
    r = api.post(f"/api/cases/{case.pk}/transition/", {"to_status": "treated", "treatment": "infection_treated"},
                 format="json")
    assert r.status_code == 200 and r.json()["status"] == "treated"
    assert models.CaseEvent.objects.filter(case=case, to_status="treated").get().actor == user


def test_transition_api_rejects_illegal(api, make_case):
    case = make_case(["referred"])
    r = api.post(f"/api/cases/{case.pk}/transition/", {"to_status": "closed"}, format="json")
    assert r.status_code == 400 and "not allowed" in r.json()["detail"]
    case.refresh_from_db()
    assert case.status == "referred"


def test_missed_via_api_creates_reminder(api, make_case):
    case = make_case(["referred", "camp_scheduled"])
    api.post(f"/api/cases/{case.pk}/transition/", {"to_status": "missed"}, format="json")
    reminders = api.get("/api/reminders/").json()
    assert len(reminders) == 1 and reminders[0]["status"] == "would_send_stubbed"


# --- camp requests and exports -----------------------------------------------------------------------------------

@pytest.fixture
def camp(api, school, make_case):
    cases = [make_case(["referred"], name="Student C1", ears={"left": "REFER", "right": "REFER"}),
             make_case(["referred"], name="Student C2")]
    r = api.post("/api/camp-requests/", {"school": str(school.pk), "camp_date": DAY,
                                         "cases": [str(c.pk) for c in cases]}, format="json")
    assert r.status_code == 201, r.json()
    return r.json()["id"], cases


def test_camp_request_schedules_cases(camp):
    _, cases = camp
    for c in cases:
        c.refresh_from_db()
        assert c.status == "camp_scheduled"


def test_camp_request_rejects_wrong_status_or_school(api, school, make_case):
    not_referred = make_case([], name="Student X1")
    r = api.post("/api/camp-requests/", {"school": str(school.pk), "camp_date": DAY,
                                         "cases": [str(not_referred.pk)]}, format="json")
    assert r.status_code == 400
    other = models.School.objects.create(name="Other (FAKE)")
    referred = make_case(["referred"], name="Student X2")
    r = api.post("/api/camp-requests/", {"school": str(other.pk), "camp_date": DAY,
                                         "cases": [str(referred.pk)]}, format="json")
    assert r.status_code == 400
    assert models.CampRequest.objects.count() == 0


def test_camp_export_csv(api, camp):
    camp_id, cases = camp
    r = api.get(f"/api/camp-requests/{camp_id}/csv/")
    assert r.status_code == 200 and r["Content-Type"] == "text/csv"
    rows = list(csv.reader(io.StringIO(r.content.decode())))
    assert rows[0] == ["SCREENING, NOT DIAGNOSIS"]
    assert ["School: Test School (FAKE)"] in rows
    assert ["Child (pseudonym)", "ID", "Class", "Ear(s)", "Outcome", "Triage route", "Status"] in rows
    assert ["Student C1", str(cases[0].child.pk)[:8], "", "left+right", "REFER", "PHC", "camp_scheduled"] in rows
    assert ["Student C2", str(cases[1].child.pk)[:8], "", "left", "REFER", "PHC", "camp_scheduled"] in rows


def test_camp_export_pdf(api, camp):
    camp_id, _ = camp
    r = api.get(f"/api/camp-requests/{camp_id}/pdf/")
    assert r.status_code == 200 and r["Content-Type"] == "application/pdf"
    body = r.content
    assert body.startswith(b"%PDF-1.4") and body.rstrip().endswith(b"%%EOF")
    assert b"(SCREENING, NOT DIAGNOSIS)" in body and b"Student C1" in body


def test_seed_demo(db, capsys):
    call_command("seed_demo")
    school = models.School.objects.get(name="Demo School (FAKE)")
    assert school.children.count() == 30
    assert all(c.display_name.startswith("Student ") for c in school.children.all())
    statuses = set(models.Case.objects.values_list("status", flat=True))
    assert {"referred", "camp_scheduled", "missed", "seen", "treated", "closed", "closed_lost_to_followup"} <= statuses
    assert models.ReminderLog.objects.exists()
    assert set(models.Facility.objects.values_list("code", flat=True)) == {"SAMPLE-PHC-1", "SAMPLE-PHC-2", "SAMPLE-DEIC-1"}
