from django.urls import path
from .views.users import UserView
from .views.players import PlayerView
from .views.clubs import ClubView
from .views.courts import CourtView
from .views.teams import TeamView
from .views.tournaments import TournamentView, TournamentEnrollmentView, TournamentStageView
from .views.matches import MatchView, MatchRescheduleView, MatchFinishView
from .views.dashboard import AdminDashboardView

urlpatterns = [
    # Dashboard Administrador
    path('dashboard/admin/', AdminDashboardView.as_view(), name='dashboard_admin'),
    # Usuarios
    path('usuarios/', UserView.as_view(), name='usuarios'),
    path('usuarios/<uuid:obj_id>/', UserView.as_view(), name='usuario_detail'),

    # Jugadores
    path('jugadores/', PlayerView.as_view(), name='jugadores'),
    path('jugadores/<uuid:obj_id>/', PlayerView.as_view(), name='jugador_detail'),

    # Clubes
    path('clubes/', ClubView.as_view(), name='clubes'),
    path('clubes/<uuid:obj_id>/', ClubView.as_view(), name='club_detail'),

    # Canchas
    path('canchas/', CourtView.as_view(), name='canchas'),
    path('canchas/<int:obj_id>/', CourtView.as_view(), name='cancha_detail'),

    # Equipos
    path('equipos/', TeamView.as_view(), name='equipos'),
    path('equipos/<uuid:obj_id>/', TeamView.as_view(), name='equipo_detail'),

    # Torneos - Inscripciones (Static relative to torneos)
    path('torneos/inscripciones/', TournamentEnrollmentView.as_view(), name='inscripciones'),
    path('torneos/inscripciones/<uuid:tournament_id>/<uuid:team_id>/', TournamentEnrollmentView.as_view(), name='inscripcion_detail'),

    # Torneos - Fechas (Static relative to torneos)
    path('torneos/fechas/', TournamentStageView.as_view(), name='fechas'),
    path('torneos/fechas/<int:obj_id>/', TournamentStageView.as_view(), name='fecha_detail'),

    # Torneos - Partidos (Static relative to torneos)
    path('torneos/partidos/', MatchView.as_view(), name='partidos'),
    path('torneos/partidos/reprogramar/', MatchRescheduleView.as_view(), name='partido_reprogramar'),
    path('torneos/partidos/finalizar/', MatchFinishView.as_view(), name='partido_finalizar'),
    path('torneos/partidos/<uuid:obj_id>/', MatchView.as_view(), name='partido_detail'),

    # Torneos (Dynamic relative to torneos)
    path('torneos/', TournamentView.as_view(), name='torneos'),
    path('torneos/<uuid:obj_id>/', TournamentView.as_view(), name='torneo_detail'),
]
