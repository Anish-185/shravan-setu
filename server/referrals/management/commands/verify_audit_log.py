from django.core.management.base import BaseCommand, CommandError

from referrals.audit_log import verify


class Command(BaseCommand):
    help = "Check the hash-chained audit log. Exit 1 if any entry was changed, removed or reordered."

    def handle(self, *args, **options):
        v = verify()
        if not v["ok"]:
            raise CommandError(f"Audit log BROKEN at entry {v['broken_at']} ({v['why']}) of {v['entries']}.")
        self.stdout.write(f"Audit log OK: {v['entries']} entries, head {v['head']}")
