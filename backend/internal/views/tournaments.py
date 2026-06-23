from django.http import JsonResponse
from django.core.paginator import Paginator
from django.utils.decorators import method_decorator
from django.db import transaction
from core.auth import jwt_required
from .base import BaseCrudView, parse_body
from core.models import Tournament, TournamentEnrollment, TournamentStage, Team, Match

def serialize_tournament(t):
    return {'id': t.id, 'name': t.name, 'year': t.year, 'start_date': t.start_date.isoformat() if t.start_date else None, 'end_date': t.end_date.isoformat() if t.end_date else None, 'category': t.category, 'branch': t.branch, 'status': t.status}

def serialize_enrollment(e):
    return {'id': e.id, 'tournament_id': e.tournament_id, 'tournament_name': e.tournament.name, 'team_id': e.team_id, 'team_name': e.team.name, 'category': e.team.category, 'branch': e.team.branch}

def serialize_stage(s):
    return {'id': s.id, 'tournament_id': s.tournament_id, 'tournament_name': s.tournament.name, 'date': s.date.isoformat(), 'name': s.name}

class TournamentView(BaseCrudView):
    model = Tournament
    def get(self, request, obj_id=None, *args, **kwargs):
        tid = obj_id or request.GET.get('tournament_id')
        if tid:
            try: return JsonResponse({'data': serialize_tournament(self.model.objects.get(id=tid, organization=request.user.organization))}, status=200)
            except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
        qs = self.model.objects.filter(organization=request.user.organization).order_by('-year', 'id')
        y, s = request.GET.get('year'), request.GET.get('status')
        if y: qs = qs.filter(year=y)
        if s: qs = qs.filter(status=s)
        page = request.GET.get('page')
        if page:
            p = Paginator(qs, 10); p_o = p.get_page(page)
            return JsonResponse({'data': [serialize_tournament(t) for t in p_o], 'pagination': {'total_pages': p.num_pages, 'current_page': p_o.number, 'total_items': p.count}}, status=200)
        return JsonResponse({'data': [serialize_tournament(t) for t in qs]}, status=200)

    def post(self, request, *args, **kwargs):
        data = parse_body(request)
        if not all(k in data for k in ['name', 'year', 'category', 'branch', 'organization_id']): return JsonResponse({'error': 'Missing fields'}, status=400)
        
        organization_id = data.get('organization_id')
        category = data.get('category')
        branch = data.get('branch')
        if Tournament.objects.filter(
            organization_id=organization_id,
            category=category,
            branch=branch,
            status__in=['PREPARATION', 'IN_PROGRESS']
        ).exists():
            return JsonResponse({'error': 'Ya existe un torneo activo (en preparación o en progreso) para esta categoría y rama. Debes finalizarlo antes de crear uno nuevo.'}, status=400)

        try:
            with transaction.atomic():
                stages = data.pop('stages', [])
                data['status'] = 'PREPARATION'
                t = self.model.objects.create(**data)
                for s in stages:
                    TournamentStage.objects.create(tournament=t, name=s['name'], date=s['date'])
                return JsonResponse({'data': serialize_tournament(t)}, status=201)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def put(self, request, obj_id=None, *args, **kwargs):
        tid = obj_id or request.GET.get('tournament_id')
        if not tid: return JsonResponse({'error': 'Missing tournament_id'}, status=400)
        data = parse_body(request)
        try:
            o = self.model.objects.get(id=tid, organization=request.user.organization)
            for k, v in data.items():
                if hasattr(o, k): setattr(o, k, v)
            o.save(); return JsonResponse({'data': serialize_tournament(o)}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request, obj_id=None, *args, **kwargs):
        tid = obj_id or request.GET.get('tournament_id')
        if not tid: return JsonResponse({'error': 'Missing tournament_id'}, status=400)
        try: self.model.objects.get(id=tid, organization=request.user.organization).delete(); return JsonResponse({'message': 'Deleted'}, status=200)
        except Exception: return JsonResponse({'error': 'Cannot delete tournament with associated data'}, status=400)

@method_decorator(jwt_required, name='dispatch')
class TournamentEnrollmentView(BaseCrudView):
    model = TournamentEnrollment
    def get(self, request, tournament_id=None, team_id=None, *args, **kwargs):
        tid = tournament_id or request.GET.get('tournament_id')
        tmid = team_id or request.GET.get('team_id')
        if tid and tmid:
            try:
                enroll = self.model.objects.get(tournament_id=tid, team_id=tmid)
                return JsonResponse({'data': serialize_enrollment(enroll)}, status=200)
            except self.model.DoesNotExist:
                return JsonResponse({'error': 'Not found'}, status=404)
        if tid: return JsonResponse({'data': [serialize_enrollment(e) for e in self.model.objects.filter(tournament_id=tid)]}, status=200)
        if tmid: return JsonResponse({'data': [serialize_enrollment(e) for e in self.model.objects.filter(team_id=tmid)]}, status=200)
        return JsonResponse({'error': 'Missing id'}, status=400)

    def post(self, request, *args, **kwargs):
        data = parse_body(request); tid, tmid = data.get('tournament_id'), data.get('team_id')
        if not tid or not tmid: return JsonResponse({'error': 'Missing ids'}, status=400)
        try:
            t, tm = Tournament.objects.get(id=tid), Team.objects.get(id=tmid)
            if tm.category != t.category or tm.branch != t.branch: return JsonResponse({'error': 'Mismatch category/branch'}, status=400)
            if self.model.objects.filter(tournament=t, team=tm).exists(): return JsonResponse({'error': 'Already enrolled'}, status=400)
            return JsonResponse({'data': serialize_enrollment(self.model.objects.create(tournament=t, team=tm))}, status=201)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request, tournament_id=None, team_id=None, *args, **kwargs):
        tid = tournament_id or request.GET.get('tournament_id')
        tmid = team_id or request.GET.get('team_id')
        try: self.model.objects.get(tournament_id=tid, team_id=tmid).delete(); return JsonResponse({'message': 'Unenrolled'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)

class TournamentStageView(BaseCrudView):
    model = TournamentStage
    def get(self, request, obj_id=None, *args, **kwargs):
        tid = obj_id or request.GET.get('tournament_id')
        if not tid: return JsonResponse({'error': 'Missing tournament_id'}, status=400)
        return JsonResponse({'data': [serialize_stage(s) for s in self.model.objects.filter(tournament_id=tid).order_by('date')]}, status=200)

    def post(self, request, *args, **kwargs):
        data = parse_body(request)
        if not all(k in data for k in ['tournament_id', 'date', 'name']): return JsonResponse({'error': 'Missing fields'}, status=400)
        try: return JsonResponse({'data': serialize_stage(self.model.objects.create(**data))}, status=201)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request, obj_id=None, *args, **kwargs):
        sid = obj_id or request.GET.get('id') or request.GET.get('date_id')
        try:
            s = self.model.objects.get(id=sid)
            if Match.objects.filter(tournament_stage=s).exists(): return JsonResponse({'error': 'Has matches'}, status=400)
            s.delete(); return JsonResponse({'message': 'Deleted'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
