from django.urls import path
from . import views

urlpatterns = [
    path('usuarios/', views.UserView.as_view(), name='usuarios'),
    path('clubes/', views.ClubView.as_view(), name='clubes'),
    path('canchas/', views.CourtView.as_view(), name='canchas'),
    path('equipos/', views.TeamView.as_view(), name='equipos'),
    path('torneos/', views.TournamentView.as_view(), name='torneos'),
    path('torneos/inscripciones/', views.TournamentEnrollmentView.as_view(), name='inscripciones'),
    path('torneos/fechas/', views.TournamentStageView.as_view(), name='fechas'),
    path('torneos/partidos/', views.MatchView.as_view(), name='partidos'),
    path('torneos/partidos/reprogramar/', views.MatchRescheduleView.as_view(), name='partido_reprogramar'),
    path('torneos/partidos/finalizar/', views.MatchFinishView.as_view(), name='partido_finalizar'),
]
