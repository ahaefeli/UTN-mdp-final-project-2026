from django.http import JsonResponse
from django.core.paginator import Paginator
from django.forms.models import model_to_dict
from django.db import IntegrityError
from django.db.models import CharField, Q, Value
from django.db.models.functions import Lower, Replace
from .base import BaseCrudView, parse_body
from .club_requests import friendly_integrity_message
from core.models import User
from core.phone import phone_error
from core.identity import dni_error, normalize_dni, password_error, username_error
from core.user_membership import resolve_user_membership

def folded_name(field_name):
    expr = Lower(field_name)
    for source, target in (
        ('á', 'a'), ('é', 'e'), ('í', 'i'), ('ó', 'o'), ('ú', 'u'),
        ('ü', 'u'), ('ñ', 'n'),
    ):
        expr = Replace(expr, Value(source), Value(target), output_field=CharField())
    return expr


def fold_search(value):
    text = str(value or '').lower()
    for source, target in (
        ('á', 'a'), ('é', 'e'), ('í', 'i'), ('ó', 'o'), ('ú', 'u'),
        ('ü', 'u'), ('ñ', 'n'),
    ):
        text = text.replace(source, target)
    return text


def serialize_user(user):
    data = model_to_dict(user)
    if 'password' in data: del data['password']

    membership = resolve_user_membership(user)

    data.update({
        'id': str(user.id),
        'name': f"{user.first_name} {user.last_name}".strip(),
        'enable': user.is_active,
        'dni': user.dni,
        'medical_certificate': user.medical_certificate,
        'coach_certificate': user.coach_certificate,
        'club_id': membership['club_id'],
        'club_name': membership['club_name'],
        'photo_url': user.photo_url,
        'club_logo_url': membership['club_logo_url'],
        'team_id': membership['team_id'],
        'team_info': membership['team_info'],
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
                        return JsonResponse({'error': 'No tenés permiso para hacer esto.'}, status=403)
                return JsonResponse({'data': serialize_user(u)}, status=200)
            except self.model.DoesNotExist: return JsonResponse({'error': 'No encontrado.'}, status=404)
        
        qs = self.model.objects.filter(
            organization=request.user.organization
        )
        if request.user.role == 'CLUB_ADMIN':
            qs = qs.filter(club=request.user.club, role__in=['COACH', 'PLAYER'])
        elif request.user.role == 'COACH':
            qs = qs.filter(club=request.user.club, role='PLAYER')
        else:
            qs = qs.exclude(role='ADMIN')
            
        qs = qs.order_by('last_name', 'first_name', 'id')
        
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
            folded = fold_search(search)
            qs = qs.annotate(
                folded_first=folded_name('first_name'),
                folded_last=folded_name('last_name'),
            ).filter(
                Q(folded_first__contains=folded) |
                Q(folded_last__contains=folded) |
                Q(dni__icontains=search)
            )
            
        club_id = request.GET.get('club_id')
        if club_id:
            qs = qs.filter(Q(club_id=club_id) | Q(teams_playing__club_id=club_id) | Q(coached_teams__club_id=club_id)).distinct()

        page = request.GET.get('page')
        if page:
            allowed_page_sizes = {10, 20, 50}
            try:
                page_size = int(request.GET.get('page_size') or 10)
            except (TypeError, ValueError):
                page_size = 10
            if page_size not in allowed_page_sizes:
                page_size = 10
            paginator = Paginator(qs, page_size)
            p_obj = paginator.get_page(page)
            return JsonResponse({
                'data': [serialize_user(u) for u in p_obj],
                'pagination': {
                    'total_pages': paginator.num_pages,
                    'current_page': p_obj.number,
                    'total_items': paginator.count,
                    'page_size': page_size,
                },
            }, status=200)
        return JsonResponse({'data': [serialize_user(u) for u in qs]}, status=200)

    def post(self, request, *args, **kwargs):
        data = parse_body(request)
        if request.user.role == 'CLUB_ADMIN':
            data['club_id'] = str(request.user.club_id) if request.user.club_id else None
            data['organization_id'] = str(request.user.organization_id)
            if data.get('role') not in ['COACH', 'PLAYER']:
                return JsonResponse({'error': 'No tenés permiso para crear este tipo de usuario.'}, status=403)
                
        elif request.user.role == 'COACH':
            data['club_id'] = str(request.user.club_id) if request.user.club_id else None
            data['organization_id'] = str(request.user.organization_id)
            if data.get('role') != 'PLAYER':
                return JsonResponse({'error': 'No tenés permiso para crear este tipo de usuario.'}, status=403)
                
        for f in ['role', 'user', 'password', 'organization_id', 'dni']:
            if f not in data: return JsonResponse({'error': f'Missing: {f}'}, status=400)
        invalid_phone = phone_error(data.get('phone'))
        if invalid_phone:
            return JsonResponse({'error': invalid_phone}, status=400)
        invalid_user = username_error(data.get('user'))
        if invalid_user:
            return JsonResponse({'error': invalid_user}, status=400)
        invalid_dni = dni_error(data.get('dni'))
        if invalid_dni:
            return JsonResponse({'error': invalid_dni}, status=400)
        invalid_password = password_error(data.get('password'))
        if invalid_password:
            return JsonResponse({'error': invalid_password}, status=400)
        data['dni'] = normalize_dni(data.get('dni'))
        try:
            user_val, pwd, name = data.pop('user'), data.pop('password'), data.pop('name', '')
            f_name = name.split(' ')[0] if name else ''
            l_name = ' '.join(name.split(' ')[1:]) if ' ' in name else ''
            user = User.objects.create(username=user_val, first_name=f_name, last_name=l_name, **data)
            user.set_password(pwd); user.save()
            return JsonResponse({'data': serialize_user(user)}, status=201)
        except IntegrityError as e:
            return JsonResponse({'error': friendly_integrity_message(e, for_approval=False)}, status=400)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def put(self, request, obj_id=None, *args, **kwargs):
        user_id = obj_id or request.GET.get('user_id')
        if not user_id: return JsonResponse({'error': 'Falta el identificador del usuario.'}, status=400)
        
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
                    return JsonResponse({'error': 'No tenés permiso para hacer esto.'}, status=403)
                if u.role == 'PLAYER':
                    has_medical = 'medical_certificate' in files or 'medical_clearance' in files
                    extra_fields = {key for key in data if key != 'requester_role'}
                    if not has_medical or extra_fields:
                        return JsonResponse({'error': 'Los clubes no pueden editar ni eliminar jugadores directamente'}, status=403)
                if 'role' in data and data['role'] in ['ADMIN', 'CLUB_ADMIN']:
                    return JsonResponse({'error': 'No podés asignar un rol con más permisos.'}, status=403)
                data.pop('club_id', None)
                data.pop('club', None)
            if request.user.role == 'COACH' and request.user.id != u.id:
                if u.role != 'PLAYER' or u.club_id != request.user.club_id:
                    return JsonResponse({'error': 'No tenés permiso para hacer esto.'}, status=403)
                
            if 'enable' in data:
                if (data.get('requester_role') or getattr(request.user, 'role', None)) != 'ADMIN':
                    return JsonResponse({'error': 'Solo un administrador puede hacer esto.'}, status=403)
                u.is_active = data.pop('enable') in [True, 'true', 'True', '1']
            if 'name' in data:
                n = data.pop('name'); u.first_name = n.split(' ')[0]; u.last_name = ' '.join(n.split(' ')[1:]) if ' ' in n else ''
            if 'password' in data:
                if not data.get('password'):
                    data.pop('password')
                else:
                    invalid_password = password_error(data.get('password'))
                    if invalid_password:
                        return JsonResponse({'error': invalid_password}, status=400)
                    u.set_password(data.pop('password'))
            if 'user' in data:
                invalid_user = username_error(data.get('user'))
                if invalid_user:
                    return JsonResponse({'error': invalid_user}, status=400)
                u.username = data.pop('user')
            if 'dni' in data:
                invalid_dni = dni_error(data.get('dni'))
                if invalid_dni:
                    return JsonResponse({'error': invalid_dni}, status=400)
                data['dni'] = normalize_dni(data.get('dni'))

            invalid_phone = phone_error(data.get('phone')) if 'phone' in data else None
            if invalid_phone:
                return JsonResponse({'error': invalid_phone}, status=400)
            
            data.pop('photo_url', None)
            photo_file = files.get('photo') if files else None
            if photo_file and request.user.id != u.id:
                return JsonResponse({'error': 'Solo podés cambiar tu propia foto.'}, status=403)

            for k, v in data.items():
                if hasattr(u, k): setattr(u, k, v)
                
            from core.utils.storage import upload_to_gcs
            if photo_file:
                u.photo_url = upload_to_gcs(photo_file, photo_file.name, 'profile_image', logo=True)
            medical_file = files.get('medical_certificate') or files.get('medical_clearance')
            if medical_file:
                url = upload_to_gcs(medical_file, medical_file.name, "medical_certificate")
                u.medical_certificate = url
            if 'coach_certificate' in files:
                url = upload_to_gcs(files['coach_certificate'], files['coach_certificate'].name, "coach_certificate")
                u.coach_certificate = url
                
            u.save(); return JsonResponse({'data': serialize_user(u)}, status=200)
        except User.DoesNotExist: return JsonResponse({'error': 'No encontrado.'}, status=404)
        except IntegrityError as e:
            return JsonResponse({'error': friendly_integrity_message(e, for_approval=False)}, status=400)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request, obj_id=None, *args, **kwargs):
        uid = obj_id or request.GET.get('user_id')
        if not uid: return JsonResponse({'error': 'Falta el identificador del usuario.'}, status=400)
        try:
            u = self.model.objects.get(id=uid)
            if request.user.role == 'CLUB_ADMIN':
                if u.club_id != request.user.club_id:
                    return JsonResponse({'error': 'No tenés permiso para hacer esto.'}, status=403)
                if u.role == 'PLAYER':
                    return JsonResponse({'error': 'Los clubes no pueden editar ni eliminar jugadores directamente'}, status=403)
            u.delete()
            return JsonResponse({'message': 'Eliminado.'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'No encontrado.'}, status=404)
