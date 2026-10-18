"""Referral tracker models. Screening and referral records, never diagnoses.

Every record has a client-generated UUID primary key so that /sync/ is idempotent.
Case status only changes through referrals.state.transition(), which appends a CaseEvent.
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class Base(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class School(Base):
    name = models.CharField(max_length=200)
    mandal = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.name


class Classroom(Base):
    # Our own classroom, not apigateway.Classroom: that one is owned by the original app's Firebase-based Educator.
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="classrooms")
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.school} / {self.name}"


class Child(Base):
    AGE_BANDS = [("6-8", "6-8"), ("9-11", "9-11"), ("12-14", "12-14"), ("15-18", "15-18")]
    SEX = [("", "Not recorded"), ("F", "Female"), ("M", "Male"), ("O", "Other")]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="children")
    classroom = models.ForeignKey(Classroom, on_delete=models.SET_NULL, null=True, blank=True, related_name="children")
    display_name = models.CharField(max_length=100, help_text="Pseudonymous, e.g. 'Student A1'.")
    age_band = models.CharField(max_length=5, choices=AGE_BANDS)
    sex = models.CharField(max_length=1, choices=SEX, blank=True)
    guardian_phone = models.CharField(max_length=20, blank=True, help_text="Optional.")

    def __str__(self):
        return self.display_name


class Consent(Base):
    METHODS = [("written", "Written form"), ("verbal", "Verbal, witnessed"), ("school_form", "School consent form")]

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="consents")
    given_by = models.CharField(max_length=50, help_text="Role, e.g. 'parent', 'guardian'. No names needed.")
    method = models.CharField(max_length=20, choices=METHODS)
    given_at = models.DateTimeField(default=timezone.now)


class ScreeningSession(Base):
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="sessions")
    consent = models.ForeignKey(Consent, on_delete=models.PROTECT, related_name="sessions")
    started_at = models.DateTimeField(default=timezone.now)
    device_model = models.CharField(max_length=100)
    earphone_model = models.CharField(max_length=100)
    volume_confirmed = models.BooleanField(help_text="Tester confirmed the fixed media-volume setting.")
    volume_setting = models.CharField(max_length=50, blank=True)
    app_version = models.CharField(max_length=30)
    config_version = models.CharField(max_length=30)
    calibrated = models.BooleanField(
        default=False, help_text="False = played at the uncalibrated placeholder volume (config tone.uncalibrated_player_volume).")
    ambient_db_re_reference = models.FloatField(
        null=True, blank=True, help_text="Pre-test room noise, relative to config noise.reference_quiet_db (uncalibrated).")
    lr_check_passed = models.BooleanField(null=True, blank=True, help_text="Left/right earphone check answered correctly.")


class ScreeningResult(Base):
    OUTCOMES = [("PASS", "PASS"), ("RETEST", "RETEST"), ("REFER", "REFER")]

    session = models.OneToOneField(ScreeningSession, on_delete=models.CASCADE, related_name="result")
    ear_outcomes = models.JSONField(default=dict, help_text='e.g. {"left": "PASS", "right": "REFER"}')
    frequency_results = models.JSONField(default=dict, help_text="Per ear and frequency trial outcomes.")
    reliability_score = models.FloatField(null=True, blank=True)
    noise_events = models.JSONField(default=list)
    outcome = models.CharField(max_length=6, choices=OUTCOMES)
    reasons = models.JSONField(default=list, help_text="Human-readable reasons for the outcome.")


class Facility(Base):
    TYPES = [("PHC", "Primary Health Centre"), ("DEIC", "District Early Intervention Centre")]

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=4, choices=TYPES)
    mandal = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.name} ({self.type})"


class Case(Base):
    STATUSES = [
        ("screened", "Screened"),
        ("referred", "Referred"),
        ("camp_scheduled", "Camp scheduled"),
        ("missed", "Missed camp"),
        ("rescheduled", "Rescheduled"),
        ("seen", "Seen at camp"),
        ("treated", "Treated / onward care"),
        ("closed", "Closed"),
        ("closed_lost_to_followup", "Closed: lost to follow-up"),
    ]
    TREATMENTS = [
        ("wax_removed", "Wax removed"),
        ("infection_treated", "Infection treated"),
        ("hearing_aid", "Hearing aid"),
        ("further_audiology", "Further audiology"),
    ]
    ROUTES = [("PHC", "PHC"), ("DEIC", "DEIC")]

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="cases")
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="cases")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    screening_result = models.ForeignKey(ScreeningResult, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUSES, default="screened")
    treatment = models.CharField(max_length=20, choices=TREATMENTS, blank=True)
    lost_reason = models.CharField(max_length=200, blank=True)
    triage_route = models.CharField(max_length=4, choices=ROUTES, blank=True)
    triage_answers = models.JSONField(default=dict, blank=True)
    triage_rule = models.CharField(max_length=200, blank=True, help_text="Which triage rule fired.")
    facility = models.ForeignKey(Facility, on_delete=models.SET_NULL, null=True, blank=True)


class CaseEvent(Base):
    """Append-only status history. Rows are never updated or deleted."""

    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="events")
    from_status = models.CharField(max_length=30)
    to_status = models.CharField(max_length=30)
    treatment = models.CharField(max_length=20, blank=True)
    reason = models.CharField(max_length=200, blank=True)
    note = models.TextField(blank=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    at = models.DateTimeField(default=timezone.now, help_text="When it happened (client time for offline events).")

    class Meta:
        ordering = ["at", "created_at"]

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValueError("CaseEvent is append-only")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("CaseEvent is append-only")


class CampRequest(Base):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="camp_requests")
    facility = models.ForeignKey(Facility, on_delete=models.SET_NULL, null=True, blank=True)
    camp_date = models.DateField()
    cases = models.ManyToManyField(Case, related_name="camp_requests")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    note = models.TextField(blank=True)


class ReminderLog(Base):
    """A reminder that WOULD be sent. Nothing is sent: SMS is a stubbed, future-cost feature."""

    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="reminders")
    to_phone = models.CharField(max_length=20, blank=True)
    text_en = models.TextField()
    text_te = models.TextField()
    status = models.CharField(max_length=30, default="would_send_stubbed")
