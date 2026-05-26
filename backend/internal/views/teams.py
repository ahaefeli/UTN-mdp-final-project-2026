from django.http import JsonResponse
from django.core.paginator import Paginator
from .base import BaseCrudView, parse_body
from core.models import Team

def serialize_team(t):
    return {'id': t.id, 'name': t.name, 'category': t.category, 'branch': t.branch, 'club_id': t.club_id, 'organization_id': t.organization_id, 'coach_id': t.coach_id, 'coach_name': f"{t.coach.first_name} {t.coach.last_name}".strip() if t.coach else None, 'tournament_id': t.tournament_id}

class TeamView(BaseCrudView):
    model = Team
    def get(self, request):
        tid = request.GET.get('team_id')
        if tid:
            try: return JsonResponse({'data': serialize_team(self.model.objects.get(id=tid, is_deleted=False))}, status=200)
            except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
        qs = self.model.objects.filter(is_deleted=False).order_by('id')
        cid = request.GET.get('club_id')
        if cid: qs = qs.filter(club_id=cid)
        page = request.GET.get('page')
        if page:
            p = Paginator(qs, 10); p_o = p.get_page(page)
            return JsonResponse({'data': [serialize_team(t) for t in p_o], 'pagination': {'total_pages': p.num_pages, 'current_page': p_o.number, 'total_items': p.count}}, status=200)
        return JsonResponse({'data': [serialize_team(t) for t in qs]}, status=200)

    def post(self, request):
        data = parse_body(request)
        if not all(k in data for k in ['club_id', 'organization_id', 'name', 'category', 'branch']): return JsonResponse({'error': 'Missing fields'}, status=400)
        try: return JsonResponse({'data': serialize_team(self.model.objects.create(**data))}, status=201)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def put(self, request):
        tid = request.GET.get('team_id')
        if not tid: return JsonResponse({'error': 'Missing team_id'}, status=400)
        data = parse_body(request)
        try:
            t = self.model.objects.get(id=tid, is_deleted=False)
            for k, v in data.items():
                if hasattr(t, k): setattr(t, k, v)
            t.save(); return JsonResponse({'data': serialize_team(t)}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request):
        tid = request.GET.get('team_id')
        if not tid: return JsonResponse({'error': 'Missing team_id'}, status=400)
        try:
            t = self.model.objects.get(id=tid); t.is_deleted = True; t.save()
            return JsonResponse({'message': 'Deleted (soft)'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
