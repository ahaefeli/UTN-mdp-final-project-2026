from django.views import View
from django.http import JsonResponse
from core.models import Match
from public.utils.standings_calculator import calculate_standings

class PublicMatchListView(View):
    def get(self, request, *args, **kwargs):
        tournament_id = request.GET.get('tournament_id')
        if not tournament_id:
            return JsonResponse({'error': 'Missing tournament_id query parameter'}, status=400)
            
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
        try:
            standings = calculate_standings(tournament_id)
            return JsonResponse(standings, safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
