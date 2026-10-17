import csv
from pathlib import Path

from django.core.management.base import BaseCommand

from referrals.models import Facility

SAMPLE = Path(__file__).resolve().parents[2] / "data" / "facilities_sample.csv"


class Command(BaseCommand):
    help = "Load facilities from a local CSV (code,name,type,mandal,district). Upserts by code."

    def add_arguments(self, parser):
        parser.add_argument("csv_path", nargs="?", default=str(SAMPLE))

    def handle(self, csv_path, **opts):
        with open(csv_path, newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        for row in rows:
            if row["type"] not in ("PHC", "DEIC"):
                raise ValueError(f"{row['code']}: type must be PHC or DEIC")
            Facility.objects.update_or_create(code=row["code"], defaults={k: row[k] for k in ("name", "type", "mandal", "district")})
        self.stdout.write(f"{len(rows)} facilities loaded from {csv_path}")
