from django.core.exceptions import ValidationError
from django.views import View
from django.http import JsonResponse
from core.models import Match, Tournament
from public.utils.standings_calculator import calculate_standings

def _visible_tournament(tournament_id):
    try:
        return Tournament.objects.filter(id=tournament_id, is_deleted=False).exists()
    except (ValidationError, ValueError):
        return False

class PublicMatchListView(View):
    def get(self, request, *args, **kwargs):
        tournament_id = request.GET.get('tournament_id')
        if not tournament_id:
            return JsonResponse({'error': 'Falta el torneo para cargar los partidos.'}, status=400)
        if not _visible_tournament(tournament_id):
            return JsonResponse({'error': 'No pudimos cargar esta competencia.'}, status=404)
            
        matches = Match.objects.filter(
            tournament_stage__tournament_id=tournament_id
        ).select_related(
            'local_team__club',
            'visitor_team__club',
            'tournament_stage'
        ).order_by('match_datetime', 'id')
        
        data = []
        for m in matches:
            data.append({
                'id': str(m.id),
                'tournament_stage_id': m.tournament_stage_id,
                'tournament_stage_name': m.tournament_stage.name if m.tournament_stage else None,
                'local_team_id': str(m.local_team_id),
                'local_team_name': m.local_team.name,
                'local_club_logo_url': m.local_team.club.logo_url if m.local_team.club else None,
                'visitor_team_id': str(m.visitor_team_id),
                'visitor_team_name': m.visitor_team.name,
                'visitor_club_logo_url': m.visitor_team.club.logo_url if m.visitor_team.club else None,
                'match_datetime': m.match_datetime.isoformat() if m.match_datetime else None,
                'status': m.status,
                'score_summary': m.score_summary,
                'sets_data': m.sets_data
            })
            
        return JsonResponse({'data': data}, status=200)

class PublicStandingsView(View):
    def get(self, request, tournament_id, *args, **kwargs):
        if not _visible_tournament(tournament_id):
            return JsonResponse({'error': 'No pudimos cargar esta competencia.'}, status=404)
        try:
            standings = calculate_standings(tournament_id)
            return JsonResponse(standings, safe=False, status=200)
        except Exception:
            return JsonResponse({'error': 'No pudimos cargar la tabla de posiciones.'}, status=400)
