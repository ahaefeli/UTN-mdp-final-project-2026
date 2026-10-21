from django.http import JsonResponse
from datetime import datetime
from django.core.paginator import Paginator
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.db import IntegrityError, transaction
from django.views import View
from public.utils.standings_calculator import calculate_standings
from core.auth import jwt_required
from .base import BaseCrudView, parse_body
from core.models import Tournament, TournamentEnrollment, TournamentStage, Team, Match

def stage_dates_error(raw_dates):
    seen = set()
    today = timezone.localdate()
    for raw in raw_dates:
        try:
            stage_date = datetime.strptime(raw, '%Y-%m-%d').date() if isinstance(raw, str) else raw
        except (TypeError, ValueError):
            return 'La fecha no es válida.'
        if stage_date < today:
            return 'No se puede usar una fecha que ya pasó.'
        if stage_date in seen:
            return 'No puede haber dos fechas el mismo día.'
        seen.add(stage_date)
    return None


def serialize_tournament(t):
    return {
        'id': t.id,
        'name': t.name,
        'year': t.year,
        'start_date': t.start_date.isoformat() if t.start_date else None,
        'end_date': t.end_date.isoformat() if t.end_date else None,
        'category': t.category,
        'branch': t.branch,
        'status': t.status,
        'is_deleted': t.is_deleted,
    }

def serialize_enrollment(e):
    club_name = e.team.club.name if e.team.club_id else ''
    return {'id': e.id, 'tournament_id': e.tournament_id, 'tournament_name': e.tournament.name, 'team_id': e.team_id, 'team_name': e.team.name, 'club_name': club_name, 'category': e.team.category, 'branch': e.team.branch}

def serialize_stage(s):
    return {'id': s.id, 'tournament_id': s.tournament_id, 'tournament_name': s.tournament.name, 'date': s.date.isoformat(), 'name': s.name}

def serialize_match_detail(m):
    return {'id': m.id, 'local_team': m.local_team.name, 'visitor_team': m.visitor_team.name, 'score_local': m.score_local, 'score_visitor': m.score_visitor, 'match_datetime': m.match_datetime.isoformat() if m.match_datetime else None, 'status': m.status, 'tournament_stage_id': m.tournament_stage_id}

@method_decorator(jwt_required, name='dispatch')
class TournamentView(BaseCrudView):
    model = Tournament
    def get(self, request, obj_id=None, *args, **kwargs):
        tid = obj_id or request.GET.get('tournament_id')
        if tid:
            try:
                tournament = self.model.objects.get(id=tid, organization=request.user.organization)
                return JsonResponse({'data': serialize_tournament(tournament)}, status=200)
            except self.model.DoesNotExist:
                return JsonResponse({'error': 'Torneo no encontrado'}, status=404)
        qs = self.model.objects.filter(organization=request.user.organization).order_by('-year', 'id')
        if request.GET.get('archived') == '1':
            qs = qs.filter(is_deleted=True)
        else:
            qs = qs.filter(is_deleted=False)
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
        if not all(k in data for k in ['name', 'year', 'category', 'branch', 'organization_id']): return JsonResponse({'error': 'Faltan datos del torneo.'}, status=400)
        
        organization_id = data.get('organization_id')
        category = data.get('category')
        branch = data.get('branch')
        active_exists = Tournament.objects.filter(
            organization_id=organization_id,
            category=category,
            branch=branch,
            status__in=['PREPARATION', 'IN_PROGRESS'],
            is_deleted=False,
        ).exists()

        start_raw = data.get('start_date')
        if start_raw:
            try:
                start_date = datetime.strptime(start_raw, '%Y-%m-%d').date() if isinstance(start_raw, str) else start_raw
            except (TypeError, ValueError):
                return JsonResponse({'error': 'La fecha de inicio no es válida.'}, status=400)
            if start_date < timezone.localdate():
                return JsonResponse({'error': 'La fecha de inicio no puede ser anterior a hoy.'}, status=400)

        stages = data.get('stages') or []
        bad_dates = stage_dates_error([s.get('date') for s in stages])
        if bad_dates:
            return JsonResponse({'error': bad_dates}, status=400)

        try:
            with transaction.atomic():
                stages = data.pop('stages', [])
                data.pop('status', None)
                data['status'] = 'PENDING' if active_exists else 'PREPARATION'
                t = self.model.objects.create(**data)
                for s in stages:
                    TournamentStage.objects.create(tournament=t, name=s['name'], date=s['date'])
                return JsonResponse({'data': serialize_tournament(t)}, status=201)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def put(self, request, obj_id=None, *args, **kwargs):
        tid = obj_id or request.GET.get('tournament_id')
        if not tid: return JsonResponse({'error': 'Falta el identificador del torneo.'}, status=400)
        data = parse_body(request)
        try:
            o = self.model.objects.get(id=tid, organization=request.user.organization)
            original_status = o.status
            if 'is_deleted' in data:
                o.is_deleted = bool(data.pop('is_deleted'))
                if o.is_deleted:
                    o.deleted_at = timezone.now()
                    o.deleted_by = request.user
                else:
                    o.deleted_at = None
                    o.deleted_by = None
            
            for k, v in data.items():
                if hasattr(o, k) and k not in ('id', 'organization', 'organization_id', 'deleted_by', 'deleted_at'):
                    setattr(o, k, v)
                
            if original_status == 'FINISHED' and o.status != 'FINISHED':
                return JsonResponse({'error': 'No se puede reabrir un torneo ya finalizado.'}, status=400)
            if original_status == 'CANCELLED' and o.status != 'CANCELLED':
                return JsonResponse({'error': 'No se puede reabrir un torneo cancelado.'}, status=400)
            if original_status != o.status and o.status == 'IN_PROGRESS':
                team_count = TournamentEnrollment.objects.filter(tournament=o).count()
                has_stage = TournamentStage.objects.filter(tournament=o).exists()
                has_matches = Match.objects.filter(tournament_stage__tournament=o).exists()
                missing = []
                if team_count < 2:
                    missing.append('al menos 2 equipos inscriptos')
                if not has_stage:
                    missing.append('una fecha')
                if not has_matches:
                    missing.append('un partido')
                if missing:
                    return JsonResponse({
                        'error': 'Para pasar a en disputa faltan: ' + ', '.join(missing) + '.',
                    }, status=400)
            if not o.is_deleted and o.status in ('PREPARATION', 'IN_PROGRESS') and Tournament.objects.filter(
                organization=o.organization,
                category=o.category,
                branch=o.branch,
                status__in=['PREPARATION', 'IN_PROGRESS'],
                is_deleted=False,
            ).exclude(id=o.id).exists():
                return JsonResponse({'error': 'Ya existe un torneo vigente (en preparación o en disputa) para esta categoría y rama.'}, status=400)
                
            if original_status != o.status:
                if o.status == 'CANCELLED':
                    Match.objects.filter(tournament_stage__tournament=o).exclude(status__in=['FINISHED', 'CANCELLED']).update(status='CANCELLED')
                elif o.status == 'FINISHED':
                    Match.objects.filter(tournament_stage__tournament=o).exclude(status__in=['FINISHED', 'CANCELLED']).update(status='FINISHED')
                    
            o.save(); return JsonResponse({'data': serialize_tournament(o)}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'No encontrado.'}, status=404)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request, obj_id=None, *args, **kwargs):
        tid = obj_id or request.GET.get('tournament_id')
        if not tid: return JsonResponse({'error': 'Falta el identificador del torneo.'}, status=400)
        try:
            tournament = self.model.objects.get(id=tid, organization=request.user.organization)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Torneo no encontrado'}, status=404)
        has_results = Match.objects.filter(
            tournament_stage__tournament=tournament,
            status='FINISHED',
        ).exists()
        if has_results:
            return JsonResponse({
                'error': 'Este torneo tiene resultados. Archivalo para sacarlo de las listas sin perder la tabla.',
            }, status=400)
        tournament.delete()
        return JsonResponse({'message': 'Eliminado'}, status=200)

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
                return JsonResponse({'error': 'No encontrado.'}, status=404)
        if tid: return JsonResponse({'data': [serialize_enrollment(e) for e in self.model.objects.filter(tournament_id=tid)]}, status=200)
        if tmid: return JsonResponse({'data': [serialize_enrollment(e) for e in self.model.objects.filter(team_id=tmid)]}, status=200)
        return JsonResponse({'error': 'Falta el identificador.'}, status=400)

    def post(self, request, *args, **kwargs):
        data = parse_body(request); tid, tmid = data.get('tournament_id'), data.get('team_id')
        if not tid or not tmid: return JsonResponse({'error': 'Faltan identificadores.'}, status=400)
        try:
            t, tm = Tournament.objects.get(id=tid), Team.objects.get(id=tmid)
            if tm.category != t.category or tm.branch != t.branch: return JsonResponse({'error': 'El equipo no coincide con la categoría y la rama del torneo.'}, status=400)
            if self.model.objects.filter(tournament=t, team=tm).exists(): return JsonResponse({'error': 'Ese equipo ya está inscripto.'}, status=400)
            return JsonResponse({'data': serialize_enrollment(self.model.objects.create(tournament=t, team=tm))}, status=201)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request, tournament_id=None, team_id=None, *args, **kwargs):
        tid = tournament_id or request.GET.get('tournament_id')
        tmid = team_id or request.GET.get('team_id')
        try: self.model.objects.get(tournament_id=tid, team_id=tmid).delete(); return JsonResponse({'message': 'Equipo dado de baja.'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'No encontrado.'}, status=404)

class TournamentStageView(BaseCrudView):
    model = TournamentStage
    def get(self, request, obj_id=None, *args, **kwargs):
        tid = obj_id or request.GET.get('tournament_id')
        if not tid: return JsonResponse({'error': 'Falta el identificador del torneo.'}, status=400)
        return JsonResponse({'data': [serialize_stage(s) for s in self.model.objects.filter(tournament_id=tid).order_by('date')]}, status=200)

    def post(self, request, *args, **kwargs):
        data = parse_body(request)
        if not all(k in data for k in ['tournament_id', 'date', 'name']): return JsonResponse({'error': 'Faltan la fecha y el nombre.'}, status=400)
        
        try:
            stage_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except (TypeError, ValueError):
            return JsonResponse({'error': 'La fecha no es válida.'}, status=400)
        if stage_date < timezone.localdate():
            return JsonResponse({'error': 'No se puede agregar una fecha que ya pasó.'}, status=400)
        if self.model.objects.filter(tournament_id=data['tournament_id'], date=stage_date).exists():
            return JsonResponse({'error': 'Ya hay una fecha en ese día.'}, status=400)
        data['date'] = stage_date
        
        try: return JsonResponse({'data': serialize_stage(self.model.objects.create(**data))}, status=201)
        except IntegrityError:
            return JsonResponse({'error': 'Ya hay una fecha en ese día.'}, status=400)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request, obj_id=None, *args, **kwargs):
        sid = obj_id or request.GET.get('id') or request.GET.get('date_id')
        try:
            s = self.model.objects.get(id=sid)
            if s.tournament.organization_id != request.user.organization_id:
                return JsonResponse({'error': 'No autorizado'}, status=403)
            Match.objects.filter(tournament_stage=s).delete()
            s.delete()
            return JsonResponse({'message': 'Eliminada'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'No encontrado.'}, status=404)

@method_decorator(jwt_required, name='dispatch')
class InternalStandingsView(View):
    def get(self, request, tournament_id, *args, **kwargs):
        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except Tournament.DoesNotExist:
            return JsonResponse({'error': 'Torneo no encontrado'}, status=404)
        
        if tournament.organization_id != request.user.organization_id:
            return JsonResponse({'error': 'No autorizado'}, status=403)
            
        try:
            standings = calculate_standings(str(tournament_id))
            return JsonResponse(standings, safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
