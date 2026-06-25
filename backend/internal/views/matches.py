from django.http import JsonResponse
from django.db import models
from django.views import View
from django.core.paginator import Paginator
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .base import BaseCrudView, parse_body
from core.models import Match
from core.auth import jwt_required

def validate_match_collisions(match_datetime, referee_id, local_team_id, visitor_team_id, court_id, exclude_id=None):
    from datetime import timedelta
    from django.db.models import Q
    from core.models import Match
    if not match_datetime:
        return None
    qs = Match.objects.filter(match_datetime=match_datetime, status__in=['PREPARATION', 'SCHEDULED', 'IN_PROGRESS'])
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    if referee_id and qs.filter(referee_id=referee_id).exists():
        return 'El árbitro ya tiene un partido asignado a esta misma hora.'
    if local_team_id and qs.filter(Q(local_team_id=local_team_id) | Q(visitor_team_id=local_team_id)).exists():
        return 'El equipo local ya tiene otro partido programado a esta misma hora.'
        
    if visitor_team_id and qs.filter(Q(local_team_id=visitor_team_id) | Q(visitor_team_id=visitor_team_id)).exists():
        return 'El equipo visitante ya tiene otro partido programado a esta misma hora.'
    if court_id:
        start_window = match_datetime - timedelta(hours=1)
        end_window = match_datetime + timedelta(hours=1)
        court_qs = Match.objects.filter(
            court_id=court_id, 
            match_datetime__gt=start_window, 
            match_datetime__lt=end_window,
            status__in=['PREPARATION', 'SCHEDULED', 'IN_PROGRESS']
        )
        if exclude_id:
            court_qs = court_qs.exclude(id=exclude_id)
        if court_qs.exists():
            return 'La cancha ya tiene un partido asignado con menos de 1 hora de diferencia.'
    return None

def serialize_match_detail(m):
    from core.utils.match_status import evaluate_and_update_match_status
    evaluate_and_update_match_status(m)
    m.refresh_from_db()
    d = {'id': m.id, 'tournament_stage_id': m.tournament_stage_id, 'local_team_id': m.local_team_id, 'local_team_name': m.local_team.name, 'visitor_team_id': m.visitor_team_id, 'visitor_team_name': m.visitor_team.name, 'court_id': m.court_id, 'court_name': m.court.name if m.court else None, 'match_datetime': m.match_datetime.isoformat() if m.match_datetime else None, 'referee_id': m.referee_id, 'referee_name': f"{m.referee.first_name} {m.referee.last_name}".strip() if m.referee else None, 'scorer_id': m.scorer_id, 'scorer_name': f"{m.scorer.first_name} {m.scorer.last_name}".strip() if m.scorer else None, 'status': m.status, 'score_summary': m.score_summary, 'sets_data': m.sets_data if m.sets_data else {'sets': []}}
    d['tournament_name'] = m.tournament_stage.tournament.name if m.tournament_stage and m.tournament_stage.tournament else None
    d['category'] = m.tournament_stage.tournament.category if m.tournament_stage and m.tournament_stage.tournament else None
    d['branch'] = m.tournament_stage.tournament.branch if m.tournament_stage and m.tournament_stage.tournament else None
    d['matchday_name'] = m.tournament_stage.name if m.tournament_stage else None
    return d

@method_decorator(jwt_required, name='dispatch')
class MatchView(BaseCrudView):
    model = Match
    def get(self, request, obj_id=None, *args, **kwargs):
        mid = obj_id or request.GET.get('match_id')
        did = request.GET.get('date_id')
        if mid:
            try:
                match = self.model.objects.get(id=mid, tournament_stage__tournament__organization=request.user.organization)
                return JsonResponse({'data': serialize_match_detail(match)}, status=200)
            except self.model.DoesNotExist:
                return JsonResponse({'error': 'Partido no encontrado'}, status=404)
        if did:
            matches = self.model.objects.filter(tournament_stage_id=did, tournament_stage__tournament__organization=request.user.organization).order_by('match_datetime')
            return JsonResponse({'data': [serialize_match_detail(m) for m in matches]}, status=200)
        qs = self.model.objects.all().order_by('-match_datetime', 'id')
        # Enforce organization isolation
        qs = qs.filter(tournament_stage__tournament__organization=request.user.organization)
        cid, tid, s = request.GET.get('club_id'), request.GET.get('team_id'), request.GET.get('status')
        tour_id = request.GET.get('tournament_id')
        if tour_id:
            from core.models import Tournament
            if not Tournament.objects.filter(id=tour_id, organization=request.user.organization).exists():
                return JsonResponse({'error': 'No autorizado'}, status=403)
            qs = qs.filter(tournament_stage__tournament_id=tour_id)
        if cid:
            qs = qs.filter(models.Q(local_team__club_id=cid) | models.Q(visitor_team__club_id=cid))
        if tid:
            qs = qs.filter(models.Q(local_team_id=tid) | models.Q(visitor_team_id=tid))
        if s:
            qs = qs.filter(status=s)
        
        if request.user.role == 'CLUB_ADMIN':
            from django.db.models import Q
            qs = qs.filter(Q(local_team__club=request.user.club) | Q(visitor_team__club=request.user.club))
        elif request.user.role == 'COACH':
            from django.db.models import Q
            qs = qs.filter(Q(local_team__coach=request.user) | Q(visitor_team__coach=request.user))
        elif request.user.role == 'PLAYER':
            from django.db.models import Q
            qs = qs.filter(Q(local_team__players=request.user) | Q(visitor_team__players=request.user)).distinct()
        elif request.user.role == 'REFEREE':
            qs = qs.filter(referee=request.user)
        elif request.user.role == 'SCORER':
            qs = qs.filter(scorer=request.user)
            
        if request.GET.get('upcoming') == 'true':
            from django.utils import timezone
            from django.db.models import Q
            # Aceptar partidos futuros O partidos cuya fecha y hora esté 'A Confirmar'
            qs = qs.filter(Q(match_datetime__gte=timezone.now()) | Q(match_datetime__isnull=True))
        if request.GET.get('recent') == 'true':
            qs = qs.filter(status__in=['FINISHED', 'CANCELLED'])
        page = request.GET.get('page')
        if page:
            p = Paginator(qs, 10); p_o = p.get_page(page)
            return JsonResponse({'data': [serialize_match_detail(m) for m in p_o], 'pagination': {'total_pages': p.num_pages, 'current_page': p_o.number, 'total_items': p.count}}, status=200)
        return JsonResponse({'data': [serialize_match_detail(m) for m in qs]}, status=200)

    def post(self, request, *args, **kwargs):
        data = parse_body(request)
        if 'referee_id' in data and data['referee_id'] == "":
            data['referee_id'] = None
        if 'scorer_id' in data and data['scorer_id'] == "":
            data['scorer_id'] = None
        if data.get('local_team_id') == data.get('visitor_team_id'): return JsonResponse({'error': 'Same team'}, status=400)
        try:
            court_id = data.get('court_id')
            match_datetime_str = data.get('match_datetime')
            
            match_datetime = None
            if match_datetime_str:
                from django.utils.dateparse import parse_datetime
                match_datetime = parse_datetime(match_datetime_str)

            collision_error = validate_match_collisions(
                match_datetime=match_datetime,
                referee_id=data.get('referee_id'),
                local_team_id=data.get('local_team_id'),
                visitor_team_id=data.get('visitor_team_id'),
                court_id=data.get('court_id')
            )
            if collision_error:
                return JsonResponse({'error': collision_error}, status=400)
            
            data['status'] = 'PREPARATION'
            m = self.model.objects.create(**data)
            m.refresh_from_db()
            return JsonResponse({'data': serialize_match_detail(m)}, status=201)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def put(self, request, obj_id=None, *args, **kwargs):
        mid = obj_id or request.GET.get('match_id')
        if not mid: return JsonResponse({'error': 'Missing match_id'}, status=400)
        data = parse_body(request)
        if 'referee_id' in data and data['referee_id'] == "":
            data['referee_id'] = None
        if 'scorer_id' in data and data['scorer_id'] == "":
            data['scorer_id'] = None
        try:
            o = self.model.objects.get(id=mid)
            if o.status == 'FINISHED': return JsonResponse({'error': 'No se puede editar un partido finalizado.'}, status=400)
            if data.get('status') == 'FINISHED' and getattr(request.user, 'role', None) != 'REFEREE': return JsonResponse({'error': 'Solo el árbitro puede finalizar un partido.'}, status=403)
            if 'status' in data:
                valid_admin_statuses = ['SUSPENDED', 'CANCELLED', 'PREPARATION', 'IN_PROGRESS']
                if data['status'] in valid_admin_statuses:
                    o.status = data['status']
                # Ignore invalid status if provided
                del data['status']
                
            match_datetime_str = data.get('match_datetime')
            match_datetime = o.match_datetime
            if match_datetime_str:
                from django.utils.dateparse import parse_datetime
                match_datetime = parse_datetime(match_datetime_str)
            elif match_datetime_str == "":
                match_datetime = None
            
            collision_error = validate_match_collisions(
                match_datetime=match_datetime,
                referee_id=data.get('referee_id', o.referee_id_id if hasattr(o, 'referee_id_id') else o.referee_id),
                local_team_id=data.get('local_team_id', o.local_team_id_id if hasattr(o, 'local_team_id_id') else o.local_team_id),
                visitor_team_id=data.get('visitor_team_id', o.visitor_team_id_id if hasattr(o, 'visitor_team_id_id') else o.visitor_team_id),
                court_id=data.get('court_id', o.court_id_id if hasattr(o, 'court_id_id') else o.court_id),
                exclude_id=mid
            )
            if collision_error:
                return JsonResponse({'error': collision_error}, status=400)

            for k, v in data.items():
                if hasattr(o, k): setattr(o, k, v)
            o.save()
            o.refresh_from_db()
            return JsonResponse({'data': serialize_match_detail(o)}, status=200)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request, obj_id=None, *args, **kwargs):
        mid = obj_id or request.GET.get('match_id')
        try: self.model.objects.get(id=mid).delete(); return JsonResponse({'message': 'Deleted'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)

@method_decorator(jwt_required, name='dispatch')
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

@method_decorator(jwt_required, name='dispatch')
class MatchFinishView(View):
    def post(self, request):
        data = parse_body(request); mid = data.get('match_id'); score_detail = data.get('score_detail') or data.get('scores', [])
        try:
            m = Match.objects.get(id=mid); m.status = 'FINISHED'; parts = []
            for s in score_detail:
                lp, vp = s.get('local_points', 0), s.get('visitor_points', 0); parts.append(f"{lp}-{vp}")
                # TODO: Hay que reemplazar esto por el JSON field sets_data
                # GameSet.objects.update_or_create(match=m, set_number=s['set_number'], defaults={'local_points': lp, 'visitor_points': vp})
            if parts: m.score_summary = ", ".join(parts)
            m.save(); return JsonResponse({'data': serialize_match_detail(m)}, status=200)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)
