from django.urls import path
from .views.public_views import PublicTournamentView, PublicOrganizationView
from .views.matches import PublicMatchListView, PublicStandingsView

urlpatterns = [
    path('torneos/', PublicTournamentView.as_view(), name='public_tournaments'),
    path('organizaciones/', PublicOrganizationView.as_view(), name='public_organizations'),
    path('partidos/', PublicMatchListView.as_view(), name='public_matches'),
    path('torneos/<uuid:tournament_id>/posiciones/', PublicStandingsView.as_view(), name='public_standings'),
]
