from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.db.models import Count, Q
from core.auth import jwt_required
from core.models import Club, User, Tournament, Match, ClubRegistrationRequest

@method_decorator(jwt_required, name='dispatch')
class AdminDashboardView(View):
    def get(self, request, *args, **kwargs):
        org = request.user.organization
        if not org:
            return JsonResponse({'error': 'Forbidden: User has no organization'}, status=403)
        
        # Total de Clubes: Conteo de Club filtrado por organization=org.
        total_clubs = Club.objects.filter(organization=org).count()
        
        # Jugadores Federados: Filtrar usuarios con role='PLAYER', is_federated=True y vinculados a la organización.
        # Obtener el total unificado, y usar Count con Q(gender='M') y Q(gender='F') para la discriminación.
        federated_stats = User.objects.filter(
            role='PLAYER',
            is_federated=True,
            organization=org
        ).aggregate(
            total=Count('id'),
            masculino=Count('id', filter=Q(gender='M')),
            femenino=Count('id', filter=Q(gender='F'))
        )
        
        # Torneos en Curso: Conteo de Tournament con status='IN_PROGRESS' y organization=org.
        active_tournaments = Tournament.objects.filter(
            status='IN_PROGRESS',
            organization=org
        ).count()
        
        # Partidos sin Árbitro: Conteo de Match con referee__isnull=True que pertenezcan a torneos de la organización.
        matches_without_referee = Match.objects.filter(
            referee__isnull=True,
            tournament_stage__tournament__organization=org
        ).count()
        
        # Acciones Pendientes (Alertas): Buscar registros de ClubRegistrationRequest con status='PENDING' y organization=org.
        pending_reqs = ClubRegistrationRequest.objects.filter(
            status='PENDING',
            organization=org
        ).exclude(club_name__isnull=True).exclude(club_name__exact='')
        pending_actions = [
            {
                "id": str(r.id),
                "type": "NEW_AFFILIATION",
                "message": f"Nueva solicitud de afiliación: {r.club_name}"
            }
            for r in pending_reqs
        ]
        
        return JsonResponse({
            "total_clubs": total_clubs,
            "federated_players": {
                "total": federated_stats['total'] or 0,
                "masculino": federated_stats['masculino'] or 0,
                "femenino": federated_stats['femenino'] or 0
            },
            "active_tournaments": active_tournaments,
            "matches_without_referee": matches_without_referee,
            "pending_actions": list(pending_actions)
        }, status=200)
