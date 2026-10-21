from django.views import View
from django.http import JsonResponse
from django.core.paginator import Paginator
from core.models import Tournament, Organization, Team, TournamentEnrollment

def serialize_tournament_public(t):
    return {
        'id': str(t.id),
        'name': t.name,
        'year': t.year,
        'start_date': t.start_date.isoformat() if t.start_date else None,
        'end_date': t.end_date.isoformat() if t.end_date else None,
        'category': t.category,
        'branch': t.branch,
        'status': t.status,
        'organization_id': t.organization.id if t.organization else None,
        'organization_name': t.organization.name if t.organization else None
    }

class PublicTournamentView(View):
    def get(self, request, *args, **kwargs):
        qs = Tournament.objects.select_related('organization').filter(is_deleted=False).order_by('-year', 'id')
        
        org_id = request.GET.get('organization_id')
        if org_id:
            qs = qs.filter(organization_id=org_id)
            
        year = request.GET.get('year')
        if year:
            qs = qs.filter(year=year)
            
        status = request.GET.get('status')
        if status:
            qs = qs.filter(status=status)
            
        page = request.GET.get('page')
        if page:
            try:
                paginator = Paginator(qs, 10)
                page_obj = paginator.get_page(page)
                return JsonResponse({
                    'data': [serialize_tournament_public(t) for t in page_obj],
                    'pagination': {
                        'total_pages': paginator.num_pages,
                        'current_page': page_obj.number,
                        'total_items': paginator.count
                    }
                }, status=200)
            except Exception as e:
                return JsonResponse({'error': 'El número de página no es válido.'}, status=400)
                
        return JsonResponse({
            'data': [serialize_tournament_public(t) for t in qs]
        }, status=200)

class PublicTeamView(View):
    def get(self, request, *args, **kwargs):
        teams = (
            Team.objects.filter(is_deleted=False, club__is_deleted=False)
            .select_related('club')
            .order_by('club__name', 'name')
        )
        enrollments = {
            item.team_id: item
            for item in TournamentEnrollment.objects.filter(
                team__in=teams,
                tournament__is_deleted=False,
            ).select_related('tournament').order_by('tournament__year')
        }
        data = []
        for team in teams:
            enrollment = enrollments.get(team.id)
            tournament = enrollment.tournament if enrollment else None
            data.append({
                'id': str(team.id),
                'name': team.name,
                'category': team.category,
                'branch': team.branch,
                'club_name': team.club.name,
                'club_logo_url': team.club.logo_url,
                'tournament_id': str(tournament.id) if tournament else None,
                'tournament_name': tournament.name if tournament else None,
            })
        return JsonResponse({'data': data}, status=200)


class PublicOrganizationView(View):
    def get(self, request, *args, **kwargs):
        orgs = Organization.objects.all().order_by('name')
        data = [{'id': str(o.id), 'name': o.name} for o in orgs]
        return JsonResponse({'data': data}, status=200)
