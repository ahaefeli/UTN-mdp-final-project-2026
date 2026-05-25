from django.http import JsonResponse
from django.db import models
from django.views import View
from django.core.paginator import Paginator
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .base import BaseCrudView, parse_body
from ..models import Match, GameSet

def serialize_match_detail(m):
    d = {'id': m.id, 'tournament_stage_id': m.tournament_stage_id, 'local_team_id': m.local_team_id, 'local_team_name': m.local_team.name, 'visitor_team_id': m.visitor_team_id, 'visitor_team_name': m.visitor_team.name, 'court_id': m.court_id, 'court_name': m.court.name if m.court else None, 'match_datetime': m.match_datetime.isoformat() if m.match_datetime else None, 'referee_id': m.referee_id, 'referee_name': f"{m.referee.first_name} {m.referee.last_name}".strip() if m.referee else None, 'scorer_id': m.scorer_id, 'scorer_name': f"{m.scorer.first_name} {m.scorer.last_name}".strip() if m.scorer else None, 'status': m.status, 'score_summary': m.score_summary, 'sets': [{'set_number': s.set_number, 'local_points': s.local_points, 'visitor_points': s.visitor_points} for s in m.sets.all().order_by('set_number')]}
    return d

class MatchView(BaseCrudView):
    model = Match
    def get(self, request):
        mid, did = request.GET.get('match_id'), request.GET.get('date_id')
        if mid:
            try: return JsonResponse({'data': serialize_match_detail(self.model.objects.get(id=mid))}, status=200)
            except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
        if did: return JsonResponse({'data': [serialize_match_detail(m) for m in self.model.objects.filter(tournament_stage_id=did).order_by('match_datetime')]}, status=200)
        qs = self.model.objects.all().order_by('-match_datetime', 'id')
        cid, tid, s = request.GET.get('club_id'), request.GET.get('team_id'), request.GET.get('status')
        if cid: qs = qs.filter(models.Q(local_team__club_id=cid) | models.Q(visitor_team__club_id=cid))
        if tid: qs = qs.filter(models.Q(local_team_id=tid) | models.Q(visitor_team_id=tid))
        if s: qs = qs.filter(status=s)
        page = request.GET.get('page')
        if page:
            p = Paginator(qs, 10); p_o = p.get_page(page)
            return JsonResponse({'data': [serialize_match_detail(m) for m in p_o], 'pagination': {'total_pages': p.num_pages, 'current_page': p_o.number, 'total_items': p.count}}, status=200)
        return JsonResponse({'data': [serialize_match_detail(m) for m in qs]}, status=200)

    def post(self, request):
        data = parse_body(request)
        if data.get('local_team_id') == data.get('visitor_team_id'): return JsonResponse({'error': 'Same team'}, status=400)
        try: data['status'] = 'PENDING'; return JsonResponse({'data': serialize_match_detail(self.model.objects.create(**data))}, status=201)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def put(self, request):
        mid = request.GET.get('match_id')
        if not mid: return JsonResponse({'error': 'Missing match_id'}, status=400)
        data = parse_body(request)
        try:
            o = self.model.objects.get(id=mid)
            for k, v in data.items():
                if hasattr(o, k): setattr(o, k, v)
            o.save(); return JsonResponse({'data': serialize_match_detail(o)}, status=200)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request):
        mid = request.GET.get('match_id')
        try: self.model.objects.get(id=mid).delete(); return JsonResponse({'message': 'Deleted'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)

@method_decorator(csrf_exempt, name='dispatch')
class MatchRescheduleView(View):
    def post(self, request):
        data = parse_body(request); mid = data.get('match_id')
        try:
            m = Match.objects.get(id=mid)
            if 'court_id' in data: m.court_id = data['court_id']
            if 'match_datetime' in data: m.match_datetime = data['match_datetime']
            if 'referee_id' in data: m.referee_id = data['referee_id']
            m.save(); return JsonResponse({'data': serialize_match_detail(m)}, status=200)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class MatchFinishView(View):
    def post(self, request):
        data = parse_body(request); mid = data.get('match_id'); score_detail = data.get('score_detail') or data.get('scores', [])
        try:
            m = Match.objects.get(id=mid); m.status = 'FINISHED'; parts = []
            for s in score_detail:
                lp, vp = s.get('local_points', 0), s.get('visitor_points', 0); parts.append(f"{lp}-{vp}")
                GameSet.objects.update_or_create(match=m, set_number=s['set_number'], defaults={'local_points': lp, 'visitor_points': vp})
            if parts: m.score_summary = ", ".join(parts)
            m.save(); return JsonResponse({'data': serialize_match_detail(m)}, status=200)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)
