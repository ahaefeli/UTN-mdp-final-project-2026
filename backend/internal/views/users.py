from django.http import JsonResponse
from django.core.paginator import Paginator
from django.forms.models import model_to_dict
from django.db.models import Q
from .base import BaseCrudView, parse_body
from core.models import User

def serialize_user(user):
    data = model_to_dict(user)
    if 'password' in data: del data['password']
    
    club_id = str(user.club.id) if user.club else None
    club_name = user.club.name if user.club else None
    team_id = None
    team_info = None  # Nueva variable
    if user.role == 'COACH':
        team = user.coached_teams.first()
        if team:
            team_id = str(team.id)
            if not club_id and team.club:
                club_id = str(team.club.id)
                club_name = team.club.name
                
    elif user.role == 'PLAYER':
        # Consulta explícita y directa para evitar caché inverso
        from core.models import Team
        team = Team.objects.filter(players=user, is_deleted=False).first()
        
        if team:
            team_id = str(team.id)
            # Empaquetar Info del Equipo
            team_info = {
                'id': str(team.id),
                'name': team.name,
                'category': team.category,
                'branch': team.branch
            }
            if not club_id and team.club:
                club_id = str(team.club.id)
                club_name = team.club.name
            
    data.update({
        'id': str(user.id),
        'name': f"{user.first_name} {user.last_name}".strip(),
        'enable': user.is_active,
        'dni': user.dni,
        'medical_certificate': user.medical_certificate,
        'coach_certificate': user.coach_certificate,
        'club_id': club_id,
        'club_name': club_name,
        'team_id': team_id,
        'team_info': team_info
    })
    return data

class UserView(BaseCrudView):
    model = User
    def get(self, request, obj_id=None, *args, **kwargs):
        user_id = obj_id or request.GET.get('user_id')
        if user_id:
            try:
                u = self.model.objects.get(id=user_id)
                if request.user.role == 'CLUB_ADMIN':
                    if u.club != request.user.club or u.role not in ['CLUB_ADMIN']:
                        return JsonResponse({'error': 'Forbidden'}, status=403)
                return JsonResponse({'data': serialize_user(u)}, status=200)
            except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
        
        qs = self.model.objects.filter(
            organization=request.user.organization
        )
        if request.user.role == 'CLUB_ADMIN':
            qs = qs.filter(club=request.user.club, role__in=['COACH', 'PLAYER'])
        elif request.user.role == 'COACH':
            qs = qs.filter(club=request.user.club, role='PLAYER')
        else:
            qs = qs.exclude(role='ADMIN')
            
        qs = qs.order_by('id')
        
        role_filter = request.GET.get('role')
        if role_filter:
            qs = qs.filter(role=role_filter)
            
        if 'jugadores' in request.path:
            qs = qs.filter(role='PLAYER')
        
        # También permitir filtrar por team_id si viene en los query parameters
        team_id = request.GET.get('team_id')
        if team_id:
            qs = qs.filter(teams_playing__id=team_id)
            
        search = request.GET.get('search')
        if search:
            qs = qs.filter(Q(first_name__icontains=search) | Q(last_name__icontains=search) | Q(dni__icontains=search))
            
        club_id = request.GET.get('club_id')
        if club_id:
            qs = qs.filter(Q(club_id=club_id) | Q(teams_playing__club_id=club_id) | Q(coached_teams__club_id=club_id)).distinct()

        page = request.GET.get('page')
        if page:
            paginator = Paginator(qs, 10); p_obj = paginator.get_page(page)
            return JsonResponse({'data': [serialize_user(u) for u in p_obj], 'pagination': {'total_pages': paginator.num_pages, 'current_page': p_obj.number, 'total_items': paginator.count}}, status=200)
        return JsonResponse({'data': [serialize_user(u) for u in qs]}, status=200)

    def post(self, request, *args, **kwargs):
        data = parse_body(request)
        if request.user.role == 'CLUB_ADMIN':
            data['club_id'] = str(request.user.club_id) if request.user.club_id else None
            data['organization_id'] = str(request.user.organization_id)
            if data.get('role') not in ['COACH', 'PLAYER']:
                return JsonResponse({'error': 'No tienes permisos para crear este tipo de usuario'}, status=403)
                
        elif request.user.role == 'COACH':
            data['club_id'] = str(request.user.club_id) if request.user.club_id else None
            data['organization_id'] = str(request.user.organization_id)
            if data.get('role') != 'PLAYER':
                return JsonResponse({'error': 'No tienes permisos para crear este tipo de usuario'}, status=403)
                
        for f in ['role', 'user', 'password', 'organization_id', 'dni']:
            if f not in data: return JsonResponse({'error': f'Missing: {f}'}, status=400)
        try:
            user_val, pwd, name = data.pop('user'), data.pop('password'), data.pop('name', '')
            f_name = name.split(' ')[0] if name else ''
            l_name = ' '.join(name.split(' ')[1:]) if ' ' in name else ''
            user = User.objects.create(username=user_val, first_name=f_name, last_name=l_name, **data)
            user.set_password(pwd); user.save()
            return JsonResponse({'data': serialize_user(user)}, status=201)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def put(self, request, obj_id=None, *args, **kwargs):
        user_id = obj_id or request.GET.get('user_id')
        if not user_id: return JsonResponse({'error': 'Missing user_id'}, status=400)
        
        is_multipart = request.content_type and request.content_type.startswith('multipart/form-data')
        if is_multipart:
            from django.http.multipartparser import MultiPartParser
            data, files = MultiPartParser(request.META, request, request.upload_handlers).parse()
            data = data.dict()
        else:
            data = parse_body(request)
            files = {}
            
        try:
            u = User.objects.get(id=user_id)
            if request.user.role == 'CLUB_ADMIN':
                if u.club_id != request.user.club_id:
                    return JsonResponse({'error': 'Forbidden'}, status=403)
                if u.role == 'PLAYER':
                    return JsonResponse({'error': 'Los clubes no pueden editar ni eliminar jugadores directamente'}, status=403)
                if 'role' in data and data['role'] in ['ADMIN', 'CLUB_ADMIN']:
                    return JsonResponse({'error': 'Forbidden: Privilege elevation blocked'}, status=403)
                data.pop('club_id', None)
                data.pop('club', None)
                
            if 'enable' in data:
                if (data.get('requester_role') or getattr(request.user, 'role', None)) != 'ADMIN':
                    return JsonResponse({'error': 'Admin only'}, status=403)
                u.is_active = data.pop('enable') in [True, 'true', 'True', '1']
            if 'name' in data:
                n = data.pop('name'); u.first_name = n.split(' ')[0]; u.last_name = ' '.join(n.split(' ')[1:]) if ' ' in n else ''
            if 'password' in data: u.set_password(data.pop('password'))
            if 'user' in data: u.username = data.pop('user')
            
            for k, v in data.items():
                if hasattr(u, k): setattr(u, k, v)
                
            from core.utils.storage import upload_to_gcs
            if 'medical_certificate' in files:
                url = upload_to_gcs(files['medical_certificate'], files['medical_certificate'].name, "medical_certificate")
                u.medical_certificate = url
            if 'coach_certificate' in files:
                url = upload_to_gcs(files['coach_certificate'], files['coach_certificate'].name, "coach_certificate")
                u.coach_certificate = url
                
            u.save(); return JsonResponse({'data': serialize_user(u)}, status=200)
        except User.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request, obj_id=None, *args, **kwargs):
        uid = obj_id or request.GET.get('user_id')
        if not uid: return JsonResponse({'error': 'Missing user_id'}, status=400)
        try:
            u = self.model.objects.get(id=uid)
            if request.user.role == 'CLUB_ADMIN':
                if u.club_id != request.user.club_id:
                    return JsonResponse({'error': 'Forbidden'}, status=403)
                if u.role == 'PLAYER':
                    return JsonResponse({'error': 'Los clubes no pueden editar ni eliminar jugadores directamente'}, status=403)
            u.delete()
            return JsonResponse({'message': 'Deleted'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
