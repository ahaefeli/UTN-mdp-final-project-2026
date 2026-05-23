from django.urls import path
from . import views

urlpatterns = [
    path('usuarios/', views.UsuarioView.as_view(), name='usuarios'),
    path('clubes/', views.ClubView.as_view(), name='clubes'),
    path('canchas/', views.CanchaView.as_view(), name='canchas'),
    path('equipos/', views.EquipoView.as_view(), name='equipos'),
    path('torneos/', views.TorneoView.as_view(), name='torneos'),
    path('torneos/inscripciones/', views.InscripcionTorneoView.as_view(), name='inscripciones'),
    path('torneos/fechas/', views.FechaTorneoView.as_view(), name='fechas'),
    path('torneos/partidos/', views.PartidoView.as_view(), name='partidos'),
    path('torneos/partidos/reprogramar/', views.PartidoReprogramarView.as_view(), name='partido_reprogramar'),
    path('torneos/partidos/finalizar/', views.PartidoFinalizarView.as_view(), name='partido_finalizar'),
]
