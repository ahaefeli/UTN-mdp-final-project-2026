from django.urls import path
from .views.users import UserView
from .views.clubs import ClubView
from .views.courts import CourtView
from .views.teams import TeamView
from .views.tournaments import TournamentView, TournamentEnrollmentView, TournamentStageView
from .views.matches import MatchView, MatchRescheduleView, MatchFinishView

urlpatterns = [
    path('usuarios/', UserView.as_view(), name='usuarios'),
    path('clubes/', ClubView.as_view(), name='clubes'),
    path('canchas/', CourtView.as_view(), name='canchas'),
    path('equipos/', TeamView.as_view(), name='equipos'),
    path('torneos/', TournamentView.as_view(), name='torneos'),
    path('torneos/inscripciones/', TournamentEnrollmentView.as_view(), name='inscripciones'),
    path('torneos/fechas/', TournamentStageView.as_view(), name='fechas'),
    path('torneos/partidos/', MatchView.as_view(), name='partidos'),
    path('torneos/partidos/reprogramar/', MatchRescheduleView.as_view(), name='partido_reprogramar'),
    path('torneos/partidos/finalizar/', MatchFinishView.as_view(), name='partido_finalizar'),
]
