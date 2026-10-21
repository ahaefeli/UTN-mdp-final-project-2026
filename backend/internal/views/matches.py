from django.http import JsonResponse
from django.db import models
from django.views import View
from django.core.paginator import Paginator
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .base import BaseCrudView, parse_body
from core.models import Match
from core.auth import jwt_required

def validate_match_collisions(match_datetime, referee_id, local_team_id, visitor_team_id, court_id, exclude_id=None, scorer_id=None):
    from datetime import timedelta
    from django.db.models import Q
    from core.models import Match
    if not match_datetime:
        return None
    start_window = match_datetime - timedelta(hours=1)
    end_window = match_datetime + timedelta(hours=1)
    nearby = Match.objects.filter(
        match_datetime__gt=start_window,
        match_datetime__lt=end_window,
        status__in=['PREPARATION', 'SCHEDULED', 'IN_PROGRESS'],
        is_deleted=False,
    )
    if exclude_id:
        nearby = nearby.exclude(id=exclude_id)
    if referee_id and nearby.filter(referee_id=referee_id).exists():
        return 'El árbitro ya tiene un partido asignado con menos de 1 hora de diferencia.'
    if scorer_id and nearby.filter(scorer_id=scorer_id).exists():
        return 'El planillero ya tiene un partido asignado con menos de 1 hora de diferencia.'
    if local_team_id and nearby.filter(Q(local_team_id=local_team_id) | Q(visitor_team_id=local_team_id)).exists():
        return 'El equipo local ya tiene otro partido programado con menos de 1 hora de diferencia.'
    if visitor_team_id and nearby.filter(Q(local_team_id=visitor_team_id) | Q(visitor_team_id=visitor_team_id)).exists():
        return 'El equipo visitante ya tiene otro partido programado con menos de 1 hora de diferencia.'
    if court_id and nearby.filter(court_id=court_id).exists():
        return 'La cancha ya tiene un partido asignado con menos de 1 hora de diferencia.'
    return None


def match_result_block_reason(match):
    from django.utils import timezone
    tournament = getattr(getattr(match, 'tournament_stage', None), 'tournament', None)
    if tournament and tournament.status != 'IN_PROGRESS':
        return 'No se puede iniciar ni cargar el resultado hasta que el torneo esté en disputa.'
    if match.match_datetime and match.match_datetime > timezone.now():
        return 'No se puede iniciar ni cargar el resultado de un partido que todavía no se juega.'
    return None

def serialize_match_detail(m):
    from core.utils.match_status import evaluate_and_update_match_status
    evaluate_and_update_match_status(m)
    m.refresh_from_db()
    d = {'id': m.id, 'tournament_stage_id': m.tournament_stage_id, 'local_team_id': m.local_team_id, 'local_team_name': m.local_team.name, 'visitor_team_id': m.visitor_team_id, 'visitor_team_name': m.visitor_team.name, 'court_id': m.court_id, 'court_name': m.court.name if m.court else None, 'match_datetime': m.match_datetime.isoformat() if m.match_datetime else None, 'referee_id': m.referee_id, 'referee_name': f"{m.referee.first_name} {m.referee.last_name}".strip() if m.referee else None, 'scorer_id': m.scorer_id, 'scorer_name': f"{m.scorer.first_name} {m.scorer.last_name}".strip() if m.scorer else None, 'status': m.status, 'score_summary': m.score_summary, 'sets_data': m.sets_data if m.sets_data else {'sets': []}}
    t = m.tournament_stage.tournament if (m.tournament_stage and hasattr(m.tournament_stage, 'tournament')) else None
    best_of = getattr(t, 'best_of', 5) if t else 5
    sets_to_win = (best_of // 2) + 1
    d['best_of'] = best_of
    d['sets_to_win'] = sets_to_win
    d['tournament_name'] = t.name if t else None
    d['category'] = t.category if t else None
    d['branch'] = t.branch if t else None
    d['matchday_name'] = m.tournament_stage.name if m.tournament_stage else None
    d['tournament_status'] = t.status if t else None
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
            qs = qs.exclude(status__in=['FINISHED', 'CANCELLED'])
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
        if data.get('local_team_id') == data.get('visitor_team_id'): return JsonResponse({'error': 'Los dos equipos tienen que ser distintos.'}, status=400)
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
                court_id=data.get('court_id'),
                scorer_id=data.get('scorer_id'),
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
        if not mid: return JsonResponse({'error': 'Falta el identificador del partido.'}, status=400)
        data = parse_body(request)
        if 'referee_id' in data and data['referee_id'] == "":
            data['referee_id'] = None
        if 'scorer_id' in data and data['scorer_id'] == "":
            data['scorer_id'] = None
        try:
            o = self.model.objects.get(id=mid)
            if o.status == 'FINISHED': return JsonResponse({'error': 'No se puede editar un partido finalizado.'}, status=400)
            if data.get('status') == 'FINISHED':
                return JsonResponse(
                    {'error': 'Para finalizar el partido cargá el resultado desde la planilla.'},
                    status=400,
                )
            if 'status' in data:
                valid_admin_statuses = ['SUSPENDED', 'CANCELLED', 'PREPARATION', 'IN_PROGRESS']
                if data['status'] == 'IN_PROGRESS':
                    blocked = match_result_block_reason(o)
                    if blocked:
                        return JsonResponse({'error': blocked}, status=400)
                if data['status'] in valid_admin_statuses:
                    o.status = data['status']
                del data['status']
                
            match_datetime_str = data.get('match_datetime')
            match_datetime = o.match_datetime
            if match_datetime_str:
                from django.utils.dateparse import parse_datetime
                match_datetime = parse_datetime(match_datetime_str)
                data['match_datetime'] = match_datetime
            elif match_datetime_str == "":
                match_datetime = None
                data['match_datetime'] = None
            
            collision_error = validate_match_collisions(
                match_datetime=match_datetime,
                referee_id=data.get('referee_id', o.referee_id_id if hasattr(o, 'referee_id_id') else o.referee_id),
                local_team_id=data.get('local_team_id', o.local_team_id_id if hasattr(o, 'local_team_id_id') else o.local_team_id),
                visitor_team_id=data.get('visitor_team_id', o.visitor_team_id_id if hasattr(o, 'visitor_team_id_id') else o.visitor_team_id),
                court_id=data.get('court_id', o.court_id_id if hasattr(o, 'court_id_id') else o.court_id),
                scorer_id=data.get('scorer_id', o.scorer_id),
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
        try: self.model.objects.get(id=mid).delete(); return JsonResponse({'message': 'Eliminado.'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'No encontrado.'}, status=404)

@method_decorator(jwt_required, name='dispatch')
class MatchRescheduleView(View):
    def post(self, request):
        data = parse_body(request)
        mid = data.get('match_id')
        if not mid:
            return JsonResponse({'error': 'Falta el identificador del partido.'}, status=400)
        try:
            m = Match.objects.get(
                id=mid,
                tournament_stage__tournament__organization=request.user.organization,
            )
            if m.status in ('FINISHED', 'CANCELLED'):
                return JsonResponse(
                    {'error': 'No se puede reprogramar un partido finalizado o cancelado.'},
                    status=400,
                )

            if 'court_id' in data:
                m.court_id = data['court_id'] if data['court_id'] != '' else None
            if 'referee_id' in data:
                m.referee_id = data['referee_id'] if data['referee_id'] != '' else None
            if 'match_datetime' in data:
                from django.utils.dateparse import parse_datetime
                dt_raw = data['match_datetime']
                if dt_raw == '' or dt_raw is None:
                    m.match_datetime = None
                elif isinstance(dt_raw, str):
                    parsed = parse_datetime(dt_raw)
                    if parsed is None:
                        return JsonResponse({'error': 'La fecha y hora del partido no son válidas.'}, status=400)
                    m.match_datetime = parsed
                else:
                    m.match_datetime = dt_raw

            collision_error = validate_match_collisions(
                match_datetime=m.match_datetime,
                referee_id=m.referee_id,
                local_team_id=m.local_team_id,
                visitor_team_id=m.visitor_team_id,
                court_id=m.court_id,
                scorer_id=m.scorer_id,
                exclude_id=m.id,
            )
            if collision_error:
                return JsonResponse({'error': collision_error}, status=400)

            m.save()
            return JsonResponse({'data': serialize_match_detail(m)}, status=200)
        except Match.DoesNotExist:
            return JsonResponse({'error': 'Partido no encontrado'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

def validate_volleyball_sets(score_detail, best_of=5):
    """Valida planilla al mejor de best_of (3 o 5). Devuelve (sets_normalized, error_msg)."""
    if not score_detail or not isinstance(score_detail, list):
        return None, 'Se requiere al menos un set con puntuación.'
    sets_to_win = (best_of // 2) + 1
    if len(score_detail) < sets_to_win or len(score_detail) > best_of:
        if best_of == 5:
            return None, f'Un partido al mejor de 5 se cierra con 3, 4 o 5 sets (entre {sets_to_win} y {best_of} sets).'
        return None, f'Un partido al mejor de {best_of} se cierra con entre {sets_to_win} y {best_of} sets.'

    sets_normalized = []
    local_sets = 0
    visitor_sets = 0

    for i, s in enumerate(score_detail):
        try:
            lp = int(s.get('local_points', s.get('local_score', 0)))
            vp = int(s.get('visitor_points', s.get('visitor_score', 0)))
        except (TypeError, ValueError):
            return None, f'Puntos inválidos en el set {i + 1}.'
        if lp < 0 or vp < 0:
            return None, f'Los puntos del set {i + 1} no pueden ser negativos.'
        if lp == vp:
            return None, f'El set {i + 1} no puede empatar.'
        target = 15 if i == (best_of - 1) else 25
        winner = max(lp, vp)
        loser = min(lp, vp)
        legal_overtime = winner > target and winner - loser == 2 and loser >= target - 1
        if winner < target or winner - loser < 2:
            return None, f'El set {i + 1} se juega a {target} y debe ganarse por 2 puntos.'
        if winner > target and not legal_overtime:
            return None, (
                f'El set {i + 1} ya habría terminado antes de ese marcador. '
                f'Si se pasa de {target}, tiene que ser por diferencia de 2.'
            )
        set_number = s.get('set_number', i + 1)
        try:
            set_number = int(set_number)
        except (TypeError, ValueError):
            set_number = i + 1
        sets_normalized.append({
            'set_number': set_number,
            'local_points': lp,
            'visitor_points': vp,
        })
        if lp > vp:
            local_sets += 1
        else:
            visitor_sets += 1

        # No continuar jugando sets después de que alguien ya llegó a sets_to_win
        if (local_sets >= sets_to_win or visitor_sets >= sets_to_win) and i < len(score_detail) - 1:
            return None, 'Hay sets de más: el partido ya tenía un ganador.'

    if local_sets == visitor_sets:
        return None, 'El partido no puede terminar empatado.'
    if max(local_sets, visitor_sets) != sets_to_win:
        return None, f'El ganador debe ganar exactamente {sets_to_win} sets (mejor de {best_of}).'
    if min(local_sets, visitor_sets) >= sets_to_win:
        return None, f'Resultado inválido: un equipo no puede perder {sets_to_win} o más sets.'

    return sets_normalized, None


@method_decorator(jwt_required, name='dispatch')
class MatchFinishView(View):
    ALLOWED_ROLES = {'ADMIN', 'REFEREE', 'SCORER'}

    def post(self, request):
        role = getattr(request.user, 'role', None)
        if role not in self.ALLOWED_ROLES:
            return JsonResponse(
                {'error': 'Solo administradores, árbitros o planilleros pueden publicar resultados.'},
                status=403,
            )

        data = parse_body(request)
        mid = data.get('match_id')
        score_detail = data.get('score_detail') or data.get('scores', [])

        if not mid:
            return JsonResponse({'error': 'Falta match_id.'}, status=400)

        try:
            m = Match.objects.select_related(
                'tournament_stage__tournament', 'local_team', 'visitor_team', 'court', 'referee', 'scorer'
            ).get(id=mid, tournament_stage__tournament__organization=request.user.organization)
        except Match.DoesNotExist:
            return JsonResponse({'error': 'Partido no encontrado.'}, status=404)

        if m.status == 'CANCELLED':
            return JsonResponse({'error': 'No se puede cargar resultado de un partido cancelado.'}, status=400)

        blocked = match_result_block_reason(m)
        if blocked:
            return JsonResponse({'error': blocked}, status=400)

        if role == 'REFEREE' and m.referee_id and m.referee_id != request.user.id:
            return JsonResponse({'error': 'Solo el árbitro asignado puede finalizar este partido.'}, status=403)
        if role == 'SCORER' and m.scorer_id and m.scorer_id != request.user.id:
            return JsonResponse({'error': 'Solo el planillero asignado puede finalizar este partido.'}, status=403)

        best_of = m.tournament_stage.tournament.best_of if (m.tournament_stage and m.tournament_stage.tournament) else 5
        sets_normalized, validation_error = validate_volleyball_sets(score_detail, best_of=best_of)
        if validation_error:
            return JsonResponse({'error': validation_error}, status=400)

        parts = [f"{s['local_points']}-{s['visitor_points']}" for s in sets_normalized]
        m.sets_data = {'sets': sets_normalized}
        m.score_summary = ', '.join(parts)
        m.status = 'FINISHED'
        m.save(update_fields=['sets_data', 'score_summary', 'status'])

        return JsonResponse({'data': serialize_match_detail(m)}, status=200)
