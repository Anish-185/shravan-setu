from django.contrib import admin

from . import models

for m in (models.School, models.Classroom, models.Child, models.Consent, models.ScreeningSession,
          models.ScreeningResult, models.Facility, models.Case, models.CampRequest, models.ReminderLog):
    admin.site.register(m)


@admin.register(models.CaseEvent)
class CaseEventAdmin(admin.ModelAdmin):
    # Append-only: viewable, never editable or deletable.
    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
