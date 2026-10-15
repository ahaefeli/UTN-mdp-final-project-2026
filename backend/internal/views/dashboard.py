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
        
        from django.db.models import Count, Q
        
        # Contabilizar a TODOS los jugadores reales y dividirlos por género ('M' o 'F')
        player_stats = User.objects.filter(
            role='PLAYER',
            organization=org
        ).aggregate(
            total=Count('id'),
            masculino=Count('id', filter=Q(gender='M')),
            femenino=Count('id', filter=Q(gender='F'))
        )
        
        # Torneos en Curso: Conteo de Tournament con status__in=['PREPARATION', 'IN_PROGRESS'] y organization=org.
        active_tournaments = Tournament.objects.filter(
            status__in=['PREPARATION', 'IN_PROGRESS'],
            organization=org
        ).count()
        
        # Partidos sin Árbitro: Conteo de Match con referee__isnull=True que pertenezcan a torneos de la organización.
        matches_without_referee = Match.objects.filter(
            referee__isnull=True,
            status__in=['PREPARATION', 'IN_PROGRESS'],
            tournament_stage__tournament__organization=org
        ).count()
        
        # --- NUEVO CÁLCULO DE ACCIONES PENDIENTES CON FILTROS DE INTEGRIDAD ---
        base_pending_reqs = ClubRegistrationRequest.objects.filter(
            status='PENDING',
            organization=org
        )
        # Un club pendiente es aquel cuyo enlace ya fue llenado con el nombre del club
        affiliation_reqs = base_pending_reqs.filter(
            role='CLUB_ADMIN'
        ).exclude(club_name__isnull=True).exclude(club_name__exact='')
        pending_clubs = affiliation_reqs.count()
        # Un árbitro pendiente es aquel que ya ingresó sus datos de contacto
        pending_referees = base_pending_reqs.filter(
            role='REFEREE'
        ).exclude(admin_email__isnull=True).exclude(admin_email__exact='').count()
        # Un planillero pendiente es aquel que ya ingresó sus datos de contacto
        pending_scorers = base_pending_reqs.filter(
            role='SCORER'
        ).exclude(admin_email__isnull=True).exclude(admin_email__exact='').count()
        
        pending_actions = [
            {
                "id": str(r.id),
                "type": "NEW_AFFILIATION",
                "message": f"Nueva solicitud de afiliación: {r.club_name}"
            }
            for r in affiliation_reqs
        ]
        
        return JsonResponse({
            "total_clubs": total_clubs,
            "federated_players": {
                "total": player_stats['total'] or 0,
                "masculino": player_stats['masculino'] or 0,
                "femenino": player_stats['femenino'] or 0,
            },
            "active_tournaments": active_tournaments,
            "matches_without_referee": matches_without_referee,
            "pending_counts": {
                "clubs": pending_clubs,
                "referees": pending_referees,
                "scorers": pending_scorers,
            },
            "pending_actions": list(pending_actions)
        }, status=200)
