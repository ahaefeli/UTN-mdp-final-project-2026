import json
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone

from core.models import User, ClubRegistrationRequest
from internal.views.club_requests import serialize_club_request

@method_decorator(csrf_exempt, name='dispatch')
class PublicClubRegistrationView(View):
    def get(self, request):
        token = request.GET.get('token')
        if not token:
            return JsonResponse({'error': 'Token query parameter is required'}, status=400)

        # 1. Find request in database by token (which is the request's UUID string)
        try:
            req_obj = ClubRegistrationRequest.objects.get(token=token)
        except ClubRegistrationRequest.DoesNotExist:
            return JsonResponse({'error': 'The link is invalid or has expired'}, status=400)

        # 2. Verify request is PENDING and not expired in DB
        if req_obj.expires_at < timezone.now():
            return JsonResponse({'error': 'The link has expired'}, status=400)

        if req_obj.status != 'PENDING':
            return JsonResponse({'error': f'The link is invalid or has expired (Status: {req_obj.status})'}, status=400)

        # 3. Return valid response with stored data
        return JsonResponse({
            'message': 'Token is valid',
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
                return JsonResponse({'error': 'Invalid JSON body'}, status=400)

        token = data.get('token')
        if not token:
            return JsonResponse({'error': 'Token is required'}, status=400)

        # 1. Find request in database by token
        try:
            req_obj = ClubRegistrationRequest.objects.get(token=token)
        except ClubRegistrationRequest.DoesNotExist:
            return JsonResponse({'error': 'The link is invalid or has expired'}, status=400)

        # 2. Verify request is PENDING and not expired in DB
        if req_obj.expires_at < timezone.now():
            return JsonResponse({'error': 'The link has expired'}, status=400)

        if req_obj.status != 'PENDING':
            return JsonResponse({'error': f'The link is invalid or has expired (Status: {req_obj.status})'}, status=400)

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
            return JsonResponse({'error': 'Admin email is required'}, status=400)

        # 4. Verify admin email/username doesn't exist previously in User table
        if User.objects.filter(email=admin_email).exists() or User.objects.filter(username=admin_email).exists():
            return JsonResponse({'error': f"A user with email '{admin_email}' already exists in the system"}, status=400)
        if admin_username and (User.objects.filter(username=admin_username).exists() or User.objects.filter(email=admin_username).exists()):
            return JsonResponse({'error': f"A user with username '{admin_username}' already exists in the system"}, status=400)

        # Upload logo to GCS if provided
        club_logo_url = req_obj.club_logo_url
        if logo_file:
            try:
                from core.utils.storage import upload_to_gcs
                club_logo_url = upload_to_gcs(logo_file, logo_file.name, 'club_logo')
            except Exception as upload_err:
                return JsonResponse({'error': f'Failed to upload club logo: {str(upload_err)}'}, status=400)

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
            
        req_obj.save()

        return JsonResponse({
            'message': 'Registration information saved successfully. Pending review by organization administrator.',
            'data': serialize_club_request(req_obj)
        }, status=200)
