import pytest
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from referrals import models


@pytest.fixture
def user(db):
    return get_user_model().objects.create(username="teacher")


@pytest.fixture
def api(user):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Token {Token.objects.create(user=user).key}")
    return client


@pytest.fixture
def school(db):
    return models.School.objects.create(name="Test School (FAKE)")


@pytest.fixture
def make_case(school, user):
    def make(status_path=(), name="Student T1", ears=None):
        from referrals.state import transition

        child = models.Child.objects.create(school=school, display_name=name, age_band="6-8")
        consent = models.Consent.objects.create(child=child, given_by="parent", method="written")
        session = models.ScreeningSession.objects.create(
            child=child, consent=consent, device_model="TEST", earphone_model="TEST", volume_confirmed=True,
            app_version="t", config_version="t",
        )
        result = models.ScreeningResult.objects.create(
            session=session, outcome="REFER", ear_outcomes=ears or {"left": "REFER", "right": "PASS"},
        )
        case = models.Case.objects.create(child=child, school=school, screening_result=result, triage_route="PHC")
        for step in status_path:
            transition(case, step, actor=user, treatment="wax_removed" if step == "treated" else "",
                       reason="moved" if step == "closed_lost_to_followup" else "")
        case.refresh_from_db()
        return case

    return make
