import json
import datetime
import logging
from django.http import JsonResponse
from django.views import View
from django.utils import timezone
from django.db import IntegrityError, transaction
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
        "role": req.role,
        "club_name": req.club_name,
        "club_address": req.club_address,
        "club_phone": req.club_phone,
        "club_email": req.club_email,
        "admin_first_name": req.admin_first_name,
        "admin_last_name": req.admin_last_name,
        "admin_email": req.admin_email,
        "admin_username": req.admin_username,
        "admin_dni": req.admin_dni,
        "club_logo_url": req.club_logo_url,
        "status": req.status,
        "created_at": req.created_at.isoformat() if req.created_at else None,
        "expires_at": req.expires_at.isoformat() if req.expires_at else None,
        "submitted_at": req.submitted_at.isoformat() if req.submitted_at else None,
        "rejection_reason": req.rejection_reason or '',
        "recipient_label": req.recipient_label or '',
    }

def duplicate_dni_response(dni):
    normalized = str(dni).strip() if dni else ''
    if not normalized:
        return None
    digits = ''.join(ch for ch in normalized if ch.isdigit())
    candidates = {normalized}
    if digits:
        candidates.add(digits)
    if User.objects.filter(dni__in=candidates).exists():
        return JsonResponse({
            'error': f'Ya existe un usuario con el DNI {normalized}. No se puede aprobar la solicitud.'
        }, status=400)
    return None


def friendly_integrity_message(exc, *, for_approval=True):
    message = str(exc).lower()
    if for_approval:
        if 'dni' in message or 'core_user_dni' in message:
            return 'Ya existe un usuario con ese DNI. No se puede aprobar la solicitud.'
        if 'username' in message:
            return 'Ya existe un usuario con ese nombre de usuario. No se puede aprobar la solicitud.'
        if 'email' in message:
            return 'Ya existe un usuario con ese email. No se puede aprobar la solicitud.'
        return 'No se pudo aprobar la solicitud porque ya existe un usuario con esos datos.'
    if 'dni' in message or 'core_user_dni' in message:
        return 'Ya existe un usuario con ese DNI.'
    if 'username' in message:
        return 'Ya existe un usuario con ese nombre de usuario.'
    if 'email' in message:
        return 'Ya existe un usuario con ese email.'
    return 'No se pudo guardar porque ya existe un usuario con esos datos.'


def check_admin_permission(request):
    if not hasattr(request, 'user') or request.user.role != 'ADMIN':
        return JsonResponse({'error': 'Solo un administrador puede hacer esto.'}, status=403)
    if not request.user.organization:
        return JsonResponse({'error': 'Tu usuario no tiene una liga asignada.'}, status=403)
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

        import json
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            data = {}
        role = data.get('role', 'CLUB_ADMIN') if data else 'CLUB_ADMIN'
        recipient_label = str((data or {}).get('recipient_label') or '').strip()[:150]

        try:
            req_obj = ClubRegistrationRequest.objects.create(
                id=req_id,
                organization=request.user.organization,
                token=token,
                role=role,
                recipient_label=recipient_label,
                expires_at=expires_at,
                status='PENDING'
            )
        except Exception:
            return JsonResponse({'error': 'No pudimos guardar la invitación.'}, status=400)

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

        role_filter = request.GET.get('role')
        if request.GET.get('unused') == '1':
            qs = ClubRegistrationRequest.objects.filter(
                organization=request.user.organization,
                status='PENDING',
                submitted_at__isnull=True,
                expires_at__gt=timezone.now(),
            ).order_by('-created_at')
            if role_filter:
                qs = qs.filter(role=role_filter)
        else:
            qs = ClubRegistrationRequest.objects.filter(
                organization=request.user.organization,
                status='PENDING'
            ).order_by('-created_at')
            if role_filter:
                qs = qs.filter(role=role_filter)
                if role_filter in ('REFEREE', 'SCORER'):
                    qs = qs.exclude(admin_email__isnull=True).exclude(admin_email='').exclude(submitted_at__isnull=True)
            else:
                qs = qs.exclude(club_name__isnull=True).exclude(club_name='')

        page = request.GET.get('page', 1)
        paginator = Paginator(qs, 10)
        try:
            page_obj = paginator.get_page(page)
        except Exception:
            return JsonResponse({'error': 'El número de página no es válido.'}, status=400)

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
            return JsonResponse({'error': 'No encontramos la solicitud.'}, status=404)

        return JsonResponse({'data': serialize_club_request(req_obj)}, status=200)

@method_decorator(jwt_required, name='dispatch')
class ReviewClubRequestView(View):
    def post(self, request, pk):
        permission_error = check_admin_permission(request)
        if permission_error:
            return permission_error

        try:
            req_obj = ClubRegistrationRequest.objects.get(pk=pk, organization=request.user.organization)
        except ClubRegistrationRequest.DoesNotExist:
            return JsonResponse({'error': 'No encontramos la solicitud.'}, status=404)

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'El pedido no es válido.'}, status=400)

        action = data.get('action')
        if action not in ['APPROVE', 'REJECT']:
            return JsonResponse({'error': 'La acción tiene que ser aprobar o rechazar.'}, status=400)

        if req_obj.status != 'PENDING':
            return JsonResponse({'error': 'Esa solicitud ya fue procesada.'}, status=400)

        try:
            if action == 'REJECT':
                reason = str(data.get('rejection_reason') or '').strip()
                if req_obj.submitted_at and not reason:
                    return JsonResponse({'error': 'El rechazo necesita un motivo.'}, status=400)
                req_obj.status = 'REJECTED'
                req_obj.rejection_reason = reason
                req_obj.save()
                return JsonResponse({
                    'message': 'Solicitud rechazada.',
                    'data': serialize_club_request(req_obj)
                }, status=200)

            elif action == 'APPROVE':
                # Flexibilización: Acepta Árbitros y Planilleros
                if getattr(req_obj, 'role', 'CLUB_ADMIN') in ['REFEREE', 'SCORER']:
                    if not req_obj.admin_email:
                        return JsonResponse({'error': 'La solicitud no ha sido completada.'}, status=400)
                        
                    with transaction.atomic():
                        username_to_check = req_obj.admin_username or req_obj.admin_email
                        if User.objects.filter(email=req_obj.admin_email).exists() or User.objects.filter(username=username_to_check).exists():
                            return JsonResponse({'error': 'Ya existe un usuario con ese email o nombre de usuario.'}, status=400)
                        dni_error = duplicate_dni_response(req_obj.admin_dni)
                        if dni_error:
                            return dni_error
                        user = User(
                            username=username_to_check,
                            email=req_obj.admin_email,
                            first_name=req_obj.admin_first_name,
                            last_name=req_obj.admin_last_name,
                            role=req_obj.role, # <--- Asignación dinámica (No harcodear REFEREE)
                            organization=request.user.organization,
                            dni=req_obj.admin_dni
                        )
                        user.password = req_obj.password
                        user.save()
                        req_obj.status = 'APPROVED'
                        req_obj.save()
                    return JsonResponse({'message': f'{req_obj.role} aprobado con éxito.', 'data': serialize_club_request(req_obj)}, status=200)
                else:
                    if not req_obj.admin_email or not req_obj.club_name:
                        return JsonResponse({'error': 'La solicitud no ha sido completada por el club invitado.'}, status=400)
                    with transaction.atomic():
                        username_to_check = req_obj.admin_username or req_obj.admin_email
                        if User.objects.filter(email=req_obj.admin_email).exists() or User.objects.filter(username=username_to_check).exists():
                            return JsonResponse({'error': 'Ya existe un usuario con ese email o nombre de usuario.'}, status=400)
                        dni_error = duplicate_dni_response(req_obj.admin_dni)
                        if dni_error:
                            return dni_error
    
                        club = Club.objects.create(
                            organization=request.user.organization,
                            name=req_obj.club_name,
                            address=req_obj.club_address,
                            phone=req_obj.club_phone,
                            email=req_obj.club_email,
                            logo_url=req_obj.club_logo_url
                        )
    
                        user = User(
                            username=username_to_check,
                            email=req_obj.admin_email,
                            first_name=req_obj.admin_first_name,
                            last_name=req_obj.admin_last_name,
                            role='CLUB_ADMIN',
                            organization=request.user.organization,
                            club=club,
                            dni=req_obj.admin_dni
                        )
                        user.password = req_obj.password
                        user.save()
    
                        req_obj.status = 'APPROVED'
                        req_obj.save()

                try:
                    subject = "¡Tu Club ha sido aprobado en VoleyHub!"
                    body = (
                        f"Hola {req_obj.admin_first_name} {req_obj.admin_last_name},\n\n"
                        "¡Nos complace informarte que tu Club ha sido aprobado en VoleyHub!\n\n"
                        "A partir de este momento, podés iniciar sesión utilizando las credenciales que ingresaste en el formulario de registro:\n"
                        f"- Usuario: {req_obj.admin_username or req_obj.admin_email}\n"
                        f"- Email: {req_obj.admin_email}\n\n"
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
                    'message': 'Solicitud aprobada. El club y el administrador quedaron creados.',
                    'data': serialize_club_request(req_obj)
                }, status=200)

        except IntegrityError as e:
            return JsonResponse({'error': friendly_integrity_message(e)}, status=400)
        except Exception:
            return JsonResponse({'error': 'No pudimos completar la revisión.'}, status=400)
