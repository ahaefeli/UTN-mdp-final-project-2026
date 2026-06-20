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
from core.models import User

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
            return JsonResponse({'error': 'Authorization header missing'}, status=401)
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return JsonResponse({'error': 'Invalid authorization header format'}, status=401)
        
        token = parts[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            if not user_id:
                return JsonResponse({'error': 'Invalid token payload'}, status=401)
            
            user = User.objects.get(id=user_id, is_deleted=False)
            request.user = user
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token has expired'}, status=401)
        except (jwt.InvalidTokenError, User.DoesNotExist):
            return JsonResponse({'error': 'Invalid token or user does not exist'}, status=401)
            
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
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({'error': 'Email and password are required'}, status=400)
        
        # Django's default authenticate() expects 'username' and 'password'.
        # Since we accept email, we first find the corresponding user's username.
        try:
            user_obj = User.objects.get(email=email, is_deleted=False)
            username = user_obj.username
        except User.DoesNotExist:
            username = email  # fallback to email as username directly
            
        user = authenticate(request, username=username, password=password)
        
        if user is None:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
        # Create manually signed JWT token
        payload = {
            'user_id': str(user.id),
            'email': user.email,
            'role': user.role,
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
                'name': f"{user.first_name} {user.last_name}".strip()
            }
        }, status=200)
