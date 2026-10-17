from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("schools", views.SchoolViewSet, basename="school")
router.register("cases", views.CaseViewSet, basename="case")
router.register("camp-requests", views.CampRequestViewSet, basename="camprequest")
router.register("reminders", views.ReminderLogViewSet, basename="reminder")

urlpatterns = [
    path("token/", obtain_auth_token),
    path("sync/", views.SyncView.as_view()),
] + router.urls
