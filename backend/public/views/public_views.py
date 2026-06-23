from django.views import View
from django.http import JsonResponse
from django.core.paginator import Paginator
from core.models import Tournament, Organization

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
        qs = Tournament.objects.select_related('organization').all().order_by('-year', 'id')
        
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
                return JsonResponse({'error': f'Invalid page number: {str(e)}'}, status=400)
                
        return JsonResponse({
            'data': [serialize_tournament_public(t) for t in qs]
        }, status=200)

class PublicOrganizationView(View):
    def get(self, request, *args, **kwargs):
        orgs = Organization.objects.all().order_by('name')
        data = [{'id': str(o.id), 'name': o.name} for o in orgs]
        return JsonResponse({'data': data}, status=200)
