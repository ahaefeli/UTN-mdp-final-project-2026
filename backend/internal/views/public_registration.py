import json
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone

from core.models import User, ClubRegistrationRequest
from core.identity import dni_error, normalize_dni, password_error, username_error
from core.phone import phone_error
from internal.views.club_requests import serialize_club_request

LINK_ALREADY_USED = 'Este enlace ya fue utilizado.'


def _dni_values(dni):
    raw = str(dni).strip() if dni else ''
    if not raw:
        return []
    digits = ''.join(ch for ch in raw if ch.isdigit())
    values = [raw]
    if digits and digits not in values:
        values.append(digits)
    return values


def _load_registration(token):
    if not token:
        return None, JsonResponse({'error': 'Falta el enlace de invitación.'}, status=400)
    try:
        return ClubRegistrationRequest.objects.get(token=token), None
    except ClubRegistrationRequest.DoesNotExist:
        return None, JsonResponse({'error': 'El enlace no es válido.'}, status=400)


def _reject_if_unusable(req_obj):
    if req_obj.submitted_at is not None:
        return JsonResponse({'error': LINK_ALREADY_USED}, status=400)
    if req_obj.expires_at < timezone.now():
        return JsonResponse({'error': 'El enlace venció.'}, status=400)
    if req_obj.status != 'PENDING':
        return JsonResponse({'error': 'Este enlace ya no está disponible.'}, status=400)
    return None


@method_decorator(csrf_exempt, name='dispatch')
class PublicClubRegistrationView(View):
    def get(self, request):
        req_obj, error = _load_registration(request.GET.get('token'))
        if error:
            return error

        rejected = _reject_if_unusable(req_obj)
        if rejected:
            return rejected

        return JsonResponse({
            'message': 'El enlace es válido.',
            'data': serialize_club_request(req_obj)
        }, status=200)

    def post(self, request):
        is_multipart = request.content_type and request.content_type.startswith('multipart/form-data')
        
        logo_file = None
        if is_multipart:
            data = request.POST.dict()
            logo_file = request.FILES.get('logo')
        else:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({'error': 'El pedido no es válido.'}, status=400)

        req_obj, error = _load_registration(data.get('token'))
        if error:
            if not data.get('token'):
                return JsonResponse({'error': 'Falta el enlace de invitación.'}, status=400)
            return error

        rejected = _reject_if_unusable(req_obj)
        if rejected:
            return rejected

        # 3. Extract data defensively
        club_name = data.get('club_name') or data.get('name') or data.get('club', {}).get('name')
        club_address = data.get('club_address') or data.get('address') or data.get('club', {}).get('address')
        club_phone = data.get('club_phone') or data.get('phone') or data.get('club', {}).get('phone')
        club_email = data.get('club_email') or data.get('email') or data.get('club', {}).get('email')

        admin_first_name = data.get('admin_first_name') or data.get('first_name') or data.get('admin', {}).get('first_name')
        admin_last_name = data.get('admin_last_name') or data.get('last_name') or data.get('admin', {}).get('last_name')
        admin_email = data.get('admin_email') or data.get('admin', {}).get('email')
        admin_username = data.get('admin_username') or data.get('username') or data.get('admin', {}).get('username')
        admin_dni = data.get('admin_dni') or data.get('dni') or data.get('admin', {}).get('dni')

        # Validate that the admin email is provided
        if not admin_email:
            return JsonResponse({'error': 'El email es obligatorio.'}, status=400)

        invalid_phone = phone_error(club_phone)
        if invalid_phone:
            return JsonResponse({'error': invalid_phone}, status=400)

        # 4. Verify admin email/username doesn't exist previously in User table
        if User.objects.filter(email=admin_email).exists() or User.objects.filter(username=admin_email).exists():
            return JsonResponse({'error': 'Ya existe un usuario con ese email.'}, status=400)
        if admin_username and (User.objects.filter(username=admin_username).exists() or User.objects.filter(email=admin_username).exists()):
            return JsonResponse({'error': 'Ya existe un usuario con ese nombre de usuario.'}, status=400)
        invalid_dni = dni_error(admin_dni)
        if invalid_dni:
            return JsonResponse({'error': invalid_dni}, status=400)
        admin_dni = normalize_dni(admin_dni)
        invalid_user = username_error(admin_username)
        if invalid_user:
            return JsonResponse({'error': invalid_user}, status=400)
        if _dni_values(admin_dni) and User.objects.filter(dni__in=_dni_values(admin_dni)).exists():
            return JsonResponse({'error': 'Ya existe un usuario con ese DNI.'}, status=400)
        invalid_password = password_error(data.get('password'))
        if invalid_password:
            return JsonResponse({'error': invalid_password}, status=400)

        # Upload logo to GCS if provided
        club_logo_url = req_obj.club_logo_url
        if logo_file:
            try:
                from core.utils.storage import upload_to_gcs
                club_logo_url = upload_to_gcs(logo_file, logo_file.name, 'club_logo', logo=True)
            except ValueError as upload_err:
                return JsonResponse({'error': str(upload_err)}, status=400)
            except Exception:
                return JsonResponse({'error': 'No pudimos guardar el escudo. Probá con otra imagen.'}, status=400)

        # 5. Update ClubRegistrationRequest with form data
        req_obj.club_name = club_name or req_obj.club_name
        req_obj.club_address = club_address or req_obj.club_address
        req_obj.club_phone = club_phone or req_obj.club_phone
        req_obj.club_email = club_email or req_obj.club_email
        req_obj.admin_first_name = admin_first_name or req_obj.admin_first_name
        req_obj.admin_last_name = admin_last_name or req_obj.admin_last_name
        req_obj.admin_email = admin_email or req_obj.admin_email
        req_obj.admin_username = admin_username or req_obj.admin_username
        req_obj.admin_dni = admin_dni or req_obj.admin_dni
        req_obj.club_logo_url = club_logo_url
        
        password_raw = data.get('password')
        if password_raw:
            from django.contrib.auth.hashers import make_password
            req_obj.password = make_password(password_raw)

        req_obj.submitted_at = timezone.now()
        req_obj.save()

        return JsonResponse({
            'message': 'Los datos quedaron guardados. La liga tiene que revisar la solicitud.',
            'data': serialize_club_request(req_obj)
        }, status=200)
