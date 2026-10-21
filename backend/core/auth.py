import json
import datetime
import jwt
from functools import wraps
from django.conf import settings
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from core.models import User, ClubRegistrationRequest
from core.user_membership import resolve_user_membership

def find_login_user(identifier):
    """Busca un usuario activo por email, DNI o nombre de usuario."""
    identifier = (identifier or '').strip()
    if not identifier:
        return None

    by_email = User.objects.filter(email__iexact=identifier, is_deleted=False).first()
    if by_email:
        return by_email

    dni_candidates = {identifier}
    digits = ''.join(ch for ch in identifier if ch.isdigit())
    if digits:
        dni_candidates.add(digits)
    by_dni = User.objects.filter(dni__in=dni_candidates, is_deleted=False).first()
    if by_dni:
        return by_dni

    return User.objects.filter(username__iexact=identifier, is_deleted=False).first()


def registration_login_message(identifier):
    """Aviso si el documento, email o usuario pertenece a una solicitud y no a una cuenta."""
    identifier = (identifier or '').strip()
    if not identifier:
        return None
    digits = ''.join(ch for ch in identifier if ch.isdigit())
    query = Q(admin_email__iexact=identifier) | Q(admin_username__iexact=identifier)
    if digits:
        query |= Q(admin_dni=digits) | Q(admin_dni=identifier)
    request_row = (
        ClubRegistrationRequest.objects.filter(query)
        .exclude(submitted_at__isnull=True)
        .order_by('-created_at')
        .first()
    )
    if request_row is None:
        return None
    if request_row.status == 'REJECTED':
        reason = (request_row.rejection_reason or '').strip()
        if reason:
            return f'Tu solicitud fue rechazada: {reason}'
        return 'Tu solicitud fue rechazada.'
    if request_row.status == 'PENDING':
        return 'Tu solicitud todavía está pendiente de revisión.'
    return None


def jwt_required(view_func):
    """
    Decorator to protect views with JWT authentication.
    Intercepts the request, reads "Authorization: Bearer <token>" header,
    decodes the JWT, and assigns the user to request.user.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return JsonResponse({'error': 'Falta iniciar sesión.'}, status=401)
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return JsonResponse({'error': 'La sesión no es válida.'}, status=401)
        
        token = parts[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            if not user_id:
                return JsonResponse({'error': 'La sesión no es válida.'}, status=401)
            
            user = User.objects.get(id=user_id, is_deleted=False)
            request.user = user
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'La sesión venció.'}, status=401)
        except (jwt.InvalidTokenError, User.DoesNotExist):
            return JsonResponse({'error': 'La sesión no es válida.'}, status=401)
            
        return view_func(request, *args, **kwargs)
    
    # Automatically mark the wrapped view as csrf_exempt
    _wrapped_view.csrf_exempt = True
    return _wrapped_view

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(View):
    """
    Manual JWT Login View.
    Receives email and password, validates with authenticate(),
    and returns a signed JWT.
    """
    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'El pedido no es válido.'}, status=400)
        
        identifier = (data.get('email') or '').strip()
        password = data.get('password')
        
        if not identifier or not password:
            return JsonResponse({
                'error': 'El documento, email o usuario y la contraseña son obligatorios.',
            }, status=400)
        
        user_obj = find_login_user(identifier)
        username = user_obj.username if user_obj else identifier
        user = authenticate(request, username=username, password=password)
        
        if user is None or getattr(user, 'is_deleted', False):
            if user_obj is None:
                notice = registration_login_message(identifier)
                if notice:
                    return JsonResponse({'error': notice}, status=401)
            return JsonResponse({'error': 'Credenciales inválidas'}, status=401)

        membership = resolve_user_membership(user)
            
        # Create manually signed JWT token
        payload = {
            'user_id': str(user.id),
            'email': user.email,
            'role': user.role,
            'club_id': membership['club_id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
            'iat': datetime.datetime.utcnow()
        }
        
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        if isinstance(token, bytes):
            token = token.decode('utf-8')
            
        return JsonResponse({
            'token': token,
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'club_id': membership['club_id'],
                'club_name': membership['club_name'],
                'club_logo_url': membership['club_logo_url'],
                'name': f"{user.first_name} {user.last_name}".strip()
            }
        }, status=200)
