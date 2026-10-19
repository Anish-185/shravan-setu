from django.apps import AppConfig


class ReferralsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "referrals"

    def ready(self):
        from . import audit_log  # noqa: F401  (connects the audit-log signal)
