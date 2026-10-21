from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db import DataError, IntegrityError
from .base import BaseCrudView, parse_body
from core.models import Team
from core.textfold import fold

TEAM_NAME_ERROR = 'El nombre del equipo no puede superar los 100 caracteres.'
TEAM_DUPLICATE_ERROR = 'Ya existe un equipo con ese nombre, categoría y rama.'

def serialize_team(t):
    # Serializar los jugadores anidados requeridos por el frontend
    players_data = []
    for p in t.players.all():
        players_data.append({
            'id': str(p.id),
            'name': f"{p.first_name} {p.last_name}".strip(),
            'first_name': p.first_name,
            'last_name': p.last_name,
            'dni': p.dni,
            'username': p.username,
            'email': p.email,
            'photo_url': p.photo_url,
            'is_active': p.is_active,
            'medical_certificate': p.medical_certificate,
            'team_info': {
                'id': str(t.id),
                'name': t.name,
                'category': t.category,
                'branch': t.branch
            }
        })
    return {
        'id': str(t.id),
        'name': t.name,
        'category': t.category,
        'branch': t.branch,
        'club_id': str(t.club_id) if t.club_id else None,
        'club_name': t.club.name if t.club else None,
        'organization_id': str(t.club.organization_id) if t.club else None,
        'coach_id': str(t.coach_id) if t.coach_id else None,
        'coach_name': f"{t.coach.first_name} {t.coach.last_name}".strip() if t.coach else None,
        'tournament_id': t.tournamentenrollment_set.values_list('tournament_id', flat=True).first(),
        'players': players_data  # Arreglo de objetos inyectado
    }

class TeamView(BaseCrudView):
    model = Team
    def get(self, request, obj_id=None, *args, **kwargs):
        tid = obj_id or request.GET.get('team_id')
        if tid:
            try:
                t = self.model.objects.get(id=tid, is_deleted=False)
                if request.user.role == 'CLUB_ADMIN' and t.club != request.user.club:
                    return JsonResponse({'error': 'No tenés permiso para hacer esto.'}, status=403)
                if request.user.role == 'COACH' and t.coach_id != request.user.id:
                    return JsonResponse({'error': 'No tenés permiso para hacer esto.'}, status=403)
                return JsonResponse({'data': serialize_team(t)}, status=200)
            except self.model.DoesNotExist: return JsonResponse({'error': 'No encontrado.'}, status=404)
        
        qs = self.model.objects.filter(is_deleted=False).order_by('name')
        if request.user.role == 'CLUB_ADMIN':
            qs = qs.filter(club=request.user.club)
        elif request.user.role == 'COACH':
            qs = qs.filter(coach=request.user)
        else:
            cid = request.GET.get('club_id')
            if cid: qs = qs.filter(club_id=cid)
            
        cat = request.GET.get('category')
        if cat: qs = qs.filter(category=cat)
        br = request.GET.get('branch')
        if br: qs = qs.filter(branch=br)
        search = request.GET.get('search')
        if search:
            needle = fold(search)
            ids = [
                team.id for team in qs.select_related('club')
                if needle in fold(f'{team.name} {team.club.name if team.club else ""}')
            ]
            qs = qs.filter(id__in=ids).order_by('name')
        page = request.GET.get('page')
        if page:
            p = Paginator(qs, 10); p_o = p.get_page(page)
            return JsonResponse({'data': [serialize_team(t) for t in p_o], 'pagination': {'total_pages': p.num_pages, 'current_page': p_o.number, 'total_items': p.count}}, status=200)
        return JsonResponse({'data': [serialize_team(t) for t in qs]}, status=200)

    def post(self, request, *args, **kwargs):
        data = parse_body(request)
        if not all(k in data for k in ['club_id', 'organization_id', 'name', 'category', 'branch']): return JsonResponse({'error': 'Faltan datos.'}, status=400)
        
        if request.user.role == 'CLUB_ADMIN':
            data['club_id'] = str(request.user.club.id) if request.user.club else None
            if request.user.club:
                data['club'] = request.user.club
                
        data.pop('organization_id', None)
        name = str(data.get('name') or '').strip()
        if not name or len(name) > 100:
            return JsonResponse({'error': TEAM_NAME_ERROR}, status=400)
        data['name'] = name
        club_id = data.get('club_id') or getattr(data.get('club'), 'id', None)
        if self.model.objects.filter(
            club_id=club_id,
            name__iexact=name,
            category=data.get('category'),
            branch=data.get('branch'),
            is_deleted=False,
        ).exists():
            return JsonResponse({'error': TEAM_DUPLICATE_ERROR}, status=400)
        try:
            return JsonResponse({'data': serialize_team(self.model.objects.create(**data))}, status=201)
        except (DataError, IntegrityError):
            return JsonResponse({'error': TEAM_DUPLICATE_ERROR}, status=400)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def put(self, request, obj_id=None, *args, **kwargs):
        tid = obj_id or request.GET.get('team_id')
        if not tid: return JsonResponse({'error': 'Falta el identificador del equipo.'}, status=400)
        data = parse_body(request)
        
        if request.user.role == 'CLUB_ADMIN':
            data.pop('club_id', None)
            data.pop('club', None)
            
        data.pop('organization_id', None)
        try:
            t = self.model.objects.get(id=tid, is_deleted=False)
            if request.user.role == 'CLUB_ADMIN' and t.club != request.user.club:
                return JsonResponse({'error': 'No tenés permiso para hacer esto.'}, status=403)
            if 'players' in data:
                players_ids = data.pop('players')
                
                # ==============================================================
                # CÁLCULO DEL DELTA Y AUDITORÍA RESTRINGIDA
                # ==============================================================
                # 1. Obtener los UUIDs actuales del equipo
                current_ids = {str(cid) for cid in t.players.values_list('id', flat=True)}
                
                # 2. Obtener los UUIDs de la petición
                incoming_ids = {str(pid) for pid in players_ids}
                
                # 3. Calcular la diferencia matemática (Solo los que intentan entrar)
                new_ids = incoming_ids - current_ids
                
                if new_ids:
                    from core.models import User
                    users = User.objects.filter(id__in=new_ids)
                    
                    for u in users:
                        if not u.gender:
                            return JsonResponse({'error': f'El jugador {u.first_name} {u.last_name} no tiene su género configurado. Debe completarlo antes de unirse al equipo.'}, status=400)
                        
                        if t.branch == 'MALE' and u.gender != 'M':
                            return JsonResponse({'error': f'Violación de Regla: {u.first_name} {u.last_name} no cumple el requisito para la rama MASCULINA.'}, status=400)
                            
                        if t.branch == 'FEMALE' and u.gender != 'F':
                            return JsonResponse({'error': f'Violación de Regla: {u.first_name} {u.last_name} no cumple el requisito para la rama FEMENINA.'}, status=400)
                # ==============================================================
                
                # Ejecutar la orden de asignación
                t.players.set(players_ids)
            for k, v in data.items():
                if hasattr(t, k): setattr(t, k, v)
            if 'name' in data:
                name = str(t.name or '').strip()
                if not name or len(name) > 100:
                    return JsonResponse({'error': TEAM_NAME_ERROR}, status=400)
                t.name = name
            t.save(); return JsonResponse({'data': serialize_team(t)}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'No encontrado.'}, status=404)
        except (DataError, IntegrityError):
            return JsonResponse({'error': TEAM_DUPLICATE_ERROR}, status=400)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request, obj_id=None, *args, **kwargs):
        tid = obj_id or request.GET.get('team_id')
        if not tid: return JsonResponse({'error': 'Falta el identificador del equipo.'}, status=400)
        try:
            t = self.model.objects.get(id=tid)
            if request.user.role == 'CLUB_ADMIN' and t.club != request.user.club:
                return JsonResponse({'error': 'No tenés permiso para hacer esto.'}, status=403)
            t.is_deleted = True; t.save()
            return JsonResponse({'message': 'Eliminado.'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'No encontrado.'}, status=404)
