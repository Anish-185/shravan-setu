"""Demo data: one FAKE school, 30 FAKE students, cases in mixed statuses. No real people.

Outcomes here are hand-picked for the demo, not statistics. Never quote counts from this data.
"""
import datetime
import random

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from rest_framework.authtoken.models import Token

from referrals import models
from referrals.state import LOST, transition

SCHOOL_NAME = "Demo Government School, Hyderabad"  # same as the phone's pre-filled name (screener/src/school.tsx)
FREQS = ["1000", "2000", "4000"]
# (outcome, case path) per REFER child. Paths walk the real state machine.
REFER_PATHS = [
    ["referred"],
    ["referred", "camp_scheduled"],
    ["referred", "camp_scheduled", "missed"],
    ["referred", "camp_scheduled", "missed", "rescheduled"],
    ["referred", "camp_scheduled", "seen"],
    ["referred", "camp_scheduled", "seen", "treated"],
    ["referred", "camp_scheduled", "seen", "treated", "closed"],
    ["referred", LOST],
]
N_RETEST = 4


class Command(BaseCommand):
    help = "Create one fake school with 30 fake students and cases in mixed statuses (demo only)."

    @transaction.atomic
    def handle(self, **opts):
        if models.School.objects.filter(name=SCHOOL_NAME).exists():
            raise CommandError(f"'{SCHOOL_NAME}' already exists. Delete db.sqlite3 and migrate to reseed.")
        rng = random.Random(2026)
        call_command("load_facilities", stdout=self.stdout)
        phc = models.Facility.objects.filter(type="PHC").order_by("code").first()
        deic = models.Facility.objects.filter(type="DEIC").order_by("code").first()

        user, _ = get_user_model().objects.get_or_create(username="demo_teacher")
        user.set_unusable_password()
        user.save()
        token, _ = Token.objects.get_or_create(user=user)

        school = models.School.objects.create(name=SCHOOL_NAME, mandal="SAMPLE-MANDAL-1", district="SAMPLE-DISTRICT")
        classes = [models.Classroom.objects.create(school=school, name=n) for n in ("Class 3 (FAKE)", "Class 5 (FAKE)")]

        children = []
        for prefix, room, band in (("A", classes[0], "6-8"), ("B", classes[1], "9-11")):
            for i in range(1, 16):
                children.append(models.Child.objects.create(
                    school=school, classroom=room, display_name=f"Student {prefix}{i}", age_band=band,
                    sex=rng.choice(["", "F", "M"]),
                    guardian_phone="0000000000" if i % 5 == 0 else "",  # obviously fake placeholder
                ))

        outcomes = ["REFER"] * len(REFER_PATHS) + ["RETEST"] * N_RETEST
        outcomes += ["PASS"] * (len(children) - len(outcomes))
        rng.shuffle(outcomes)

        refer_paths = iter(REFER_PATHS)
        camp = None
        for child, outcome in zip(children, outcomes):
            result = self.screen(child, outcome, rng)
            if outcome != "REFER":
                continue
            path = next(refer_paths)
            route = rng.choice(["PHC", "DEIC"])
            case = models.Case.objects.create(
                child=child, school=school, owner=user, screening_result=result, triage_route=route,
                facility=phc if route == "PHC" else deic, triage_rule="demo seed (rule engine arrives in Phase 3)",
            )
            for step in path:
                if step == "camp_scheduled" and camp is None:
                    camp = models.CampRequest.objects.create(
                        school=school, facility=deic, camp_date=timezone.localdate() + datetime.timedelta(days=7),
                        created_by=user, note="Demo camp (FAKE)",
                    )
                if step == "camp_scheduled":
                    camp.cases.add(case)
                transition(
                    case, step, actor=user,
                    treatment="wax_removed" if step == "treated" else "",
                    reason="Family moved away (demo)" if step == LOST else "",
                )

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {SCHOOL_NAME}: {len(children)} children, {models.Case.objects.filter(school=school).count()} cases, "
            f"camp request {camp.pk if camp else '-'}."
        ))
        self.stdout.write(f"API token for demo_teacher: {token.key}")

    def screen(self, child, outcome, rng):
        consent = models.Consent.objects.create(child=child, given_by="parent", method="school_form")
        session = models.ScreeningSession.objects.create(
            child=child, consent=consent, device_model="DEMO-PHONE", earphone_model="DEMO-EARPHONES",
            volume_confirmed=True, volume_setting="DEMO", app_version="seed", config_version="seed",
        )
        ears = {"left": "PASS", "right": "PASS"}
        if outcome != "PASS":
            ears[rng.choice(["left", "right"])] = outcome
        return models.ScreeningResult.objects.create(
            session=session, ear_outcomes=ears, outcome=outcome,
            frequency_results={e: {f: ("heard" if o == "PASS" else "not heard") for f in FREQS} for e, o in ears.items()},
            reliability_score=None, reasons=["DEMO SEED DATA, not a real screening"],
        )
