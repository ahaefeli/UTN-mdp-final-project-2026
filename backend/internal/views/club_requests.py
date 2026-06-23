import json
import datetime
import logging
from django.http import JsonResponse
from django.views import View
from django.utils import timezone
from django.db import transaction
from django.core.paginator import Paginator
from django.utils.decorators import method_decorator
from django.conf import settings
from django.contrib.auth.base_user import BaseUserManager
from django.core.mail import send_mail

from core.auth import jwt_required
from core.models import User, Club, ClubRegistrationRequest
from core.utils.signing import generate_registration_token

logger = logging.getLogger(__name__)

# Compatibility fallback for BaseUserManager.make_random_password (removed in Django 5.0+)
if not hasattr(BaseUserManager, 'make_random_password'):
    from django.utils.crypto import get_random_string
    BaseUserManager.make_random_password = lambda self, length=10: get_random_string(length)



def serialize_club_request(req):
    return {
        "id": str(req.id),
        "organization_id": req.organization_id,
        "token": req.token,
        "club_name": req.club_name,
        "club_address": req.club_address,
        "club_phone": req.club_phone,
        "club_email": req.club_email,
        "admin_first_name": req.admin_first_name,
        "admin_last_name": req.admin_last_name,
        "admin_email": req.admin_email,
        "club_logo_url": req.club_logo_url,
        "status": req.status,
        "created_at": req.created_at.isoformat() if req.created_at else None,
        "expires_at": req.expires_at.isoformat() if req.expires_at else None,
    }

def check_admin_permission(request):
    if not hasattr(request, 'user') or request.user.role != 'ADMIN':
        return JsonResponse({'error': 'Forbidden: ADMIN role required'}, status=403)
    if not request.user.organization:
        return JsonResponse({'error': 'Forbidden: User has no organization'}, status=403)
    return None

@method_decorator(jwt_required, name='dispatch')
class GenerateLinkView(View):
    def post(self, request):
        permission_error = check_admin_permission(request)
        if permission_error:
            return permission_error

        import uuid
        req_id = uuid.uuid4()
        token = str(req_id)
        expires_at = timezone.now() + datetime.timedelta(hours=48)

        try:
            req_obj = ClubRegistrationRequest.objects.create(
                id=req_id,
                organization=request.user.organization,
                token=token,
                expires_at=expires_at,
                status='PENDING'
            )
        except Exception as e:
            return JsonResponse({'error': f'Database error: {str(e)}'}, status=400)

        frontend_base = getattr(settings, 'FRONTEND_BASE_URL', '')
        registration_link = f"/public-register?token={token}"
        if frontend_base:
            registration_link = f"{frontend_base.rstrip('/')}/public-register?token={token}"

        return JsonResponse({
            'token': token,
            'registration_link': registration_link,
            'data': serialize_club_request(req_obj)
        }, status=201)

@method_decorator(jwt_required, name='dispatch')
class ClubRequestListView(View):
    def get(self, request):
        permission_error = check_admin_permission(request)
        if permission_error:
            return permission_error

        qs = ClubRegistrationRequest.objects.filter(
            organization=request.user.organization,
            status='PENDING'
        ).exclude(club_name__isnull=True).exclude(club_name='').order_by('-created_at')

        page = request.GET.get('page', 1)
        paginator = Paginator(qs, 10)
        try:
            page_obj = paginator.get_page(page)
        except Exception:
            return JsonResponse({'error': 'Invalid page number'}, status=400)

        return JsonResponse({
            'data': [serialize_club_request(r) for r in page_obj],
            'pagination': {
                'total_pages': paginator.num_pages,
                'current_page': page_obj.number,
                'total_items': paginator.count
            }
        }, status=200)

@method_decorator(jwt_required, name='dispatch')
class ClubRequestDetailView(View):
    def get(self, request, pk):
        permission_error = check_admin_permission(request)
        if permission_error:
            return permission_error

        try:
            req_obj = ClubRegistrationRequest.objects.get(pk=pk, organization=request.user.organization)
        except ClubRegistrationRequest.DoesNotExist:
            return JsonResponse({'error': 'Club registration request not found'}, status=404)

        return JsonResponse({
            'club_name': req_obj.club_name,
            'club_address': req_obj.club_address,
            'club_phone': req_obj.club_phone,
            'club_email': req_obj.club_email,
            'admin_first_name': req_obj.admin_first_name,
            'admin_last_name': req_obj.admin_last_name,
            'admin_email': req_obj.admin_email,
            'club_logo_url': req_obj.club_logo_url,
            'status': req_obj.status,
            'created_at': req_obj.created_at.isoformat() if req_obj.created_at else None,
            'expires_at': req_obj.expires_at.isoformat() if req_obj.expires_at else None,
        }, status=200)

@method_decorator(jwt_required, name='dispatch')
class ReviewClubRequestView(View):
    def post(self, request, pk):
        permission_error = check_admin_permission(request)
        if permission_error:
            return permission_error

        try:
            req_obj = ClubRegistrationRequest.objects.get(pk=pk, organization=request.user.organization)
        except ClubRegistrationRequest.DoesNotExist:
            return JsonResponse({'error': 'Club registration request not found'}, status=404)

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)

        action = data.get('action')
        if action not in ['APPROVE', 'REJECT']:
            return JsonResponse({'error': 'Invalid action. Must be APPROVE or REJECT'}, status=400)

        if req_obj.status != 'PENDING':
            return JsonResponse({'error': f'Request has already been processed with status: {req_obj.status}'}, status=400)

        try:
            if action == 'REJECT':
                req_obj.status = 'REJECTED'
                req_obj.save()
                return JsonResponse({
                    'message': 'Club registration request rejected.',
                    'data': serialize_club_request(req_obj)
                }, status=200)

            elif action == 'APPROVE':
                if not req_obj.admin_email or not req_obj.club_name:
                    return JsonResponse({'error': 'La solicitud no ha sido completada por el club invitado.'}, status=400)
                temp_password = BaseUserManager().make_random_password(length=12)
                with transaction.atomic():
                    if User.objects.filter(email=req_obj.admin_email).exists() or User.objects.filter(username=req_obj.admin_email).exists():
                        return JsonResponse({'error': f"User with email/username '{req_obj.admin_email}' already exists."}, status=400)

                    club = Club.objects.create(
                        organization=request.user.organization,
                        name=req_obj.club_name,
                        address=req_obj.club_address,
                        phone=req_obj.club_phone,
                        email=req_obj.club_email,
                        logo_url=req_obj.club_logo_url
                    )

                    user = User(
                        username=req_obj.admin_email,
                        email=req_obj.admin_email,
                        first_name=req_obj.admin_first_name,
                        last_name=req_obj.admin_last_name,
                        role='CLUB_ADMIN',
                        organization=request.user.organization
                    )
                    user.set_password(temp_password)
                    user.save()

                    req_obj.status = 'APPROVED'
                    req_obj.save()

                try:
                    subject = "¡Tu Club ha sido aprobado en VoleyHub!"
                    body = (
                        f"Hola {req_obj.admin_first_name} {req_obj.admin_last_name},\n\n"
                        "¡Nos complace informarte que tu Club ha sido aprobado en VoleyHub!\n\n"
                        "A partir de este momento, puedes iniciar sesión utilizando las siguientes credenciales temporales:\n"
                        f"- Email: {req_obj.admin_email}\n"
                        f"- Contraseña temporal: {temp_password}\n\n"
                        "IMPORTANTE: Por motivos de seguridad, es obligatorio cambiar esta contraseña temporal inmediatamente después de tu primer inicio de sesión.\n\n"
                        "Atentamente,\n"
                        "El equipo de VoleyHub"
                    )
                    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@voleyhub.com')
                    send_mail(
                        subject,
                        body,
                        from_email,
                        [req_obj.admin_email],
                        fail_silently=False,
                    )
                except Exception as mail_err:
                    logger.error(f"Failed to send club approval email to {req_obj.admin_email}: {str(mail_err)}")

                return JsonResponse({
                    'message': 'Club registration request approved, club and admin user created successfully.',
                    'data': serialize_club_request(req_obj)
                }, status=200)

        except Exception as e:
            return JsonResponse({'error': f"Transaction failed: {str(e)}"}, status=400)
