"""Appends to the hash-chained audit log (models.AuditEntry) on every save of an audited record, whatever path made
it: sync, API, admin or seed data. Kinds match the phone's record types."""
import json

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.forms.models import model_to_dict
from django.utils import timezone

from . import models
from .rules.audit import next_entry, verify_chain

KINDS = {models.Consent: "consent", models.ScreeningResult: "screening_result", models.Case: "case",
         models.CaseEvent: "case_event", models.CampRequest: "camp_request"}
FIELDS = ("seq", "at", "kind", "record_id", "data", "prev", "hash")


def record_data(instance):
    """Own columns only (no timestamps, no many-to-many), sorted, as JSON text."""
    fields = [f.name for f in instance._meta.concrete_fields if f.editable]
    return json.dumps(model_to_dict(instance, fields=fields), sort_keys=True, ensure_ascii=False, default=str)


@receiver(post_save)
def append(sender, instance, **kwargs):
    kind = KINDS.get(sender)
    if kind is None:
        return
    data = record_data(instance)
    rid = str(instance.pk)
    same = models.AuditEntry.objects.filter(kind=kind, record_id=rid).order_by("-seq").values_list("data", flat=True)
    if same[:1] and same[0] == data:  # an idempotent re-sync of unchanged data adds nothing
        return
    last = models.AuditEntry.objects.order_by("-seq").values(*FIELDS).first()
    # ponytail: seq = last + 1 runs inside the caller's transaction; two simultaneous writers would collide on the
    # primary key and one request fails (no fork in the chain). Fine on the one-laptop SQLite server.
    models.AuditEntry.objects.create(**next_entry(last, timezone.now().isoformat(), kind, rid, data))


def verify():
    return verify_chain(list(models.AuditEntry.objects.order_by("seq").values(*FIELDS)))
