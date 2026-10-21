from django.http import JsonResponse
from django.core.paginator import Paginator
from .base import BaseCrudView, parse_body
from core.models import Club
from core.phone import phone_error
from core.textfold import fold

def serialize_club(club):
    return {'id': club.id, 'name': club.name, 'address': club.address, 'phone': club.phone, 'email': club.email, 'organization_id': club.organization_id}

class ClubView(BaseCrudView):
    model = Club
    def get(self, request, obj_id=None, *args, **kwargs):
        cid = obj_id or request.GET.get('club_id')
        org = request.user.organization
        if cid:
            try:
                return JsonResponse(
                    {'data': serialize_club(self.model.objects.get(id=cid, organization=org))},
                    status=200,
                )
            except self.model.DoesNotExist:
                return JsonResponse({'error': 'No encontrado.'}, status=404)
        qs = self.model.objects.filter(organization=org).order_by('name')
        search = request.GET.get('search')
        if search:
            needle = fold(search)
            ids = [club.id for club in qs if needle in fold(club.name)]
            qs = qs.filter(id__in=ids).order_by('name')
        page = request.GET.get('page')
        if page:
            p = Paginator(qs, 10); p_o = p.get_page(page)
            return JsonResponse({'data': [serialize_club(c) for c in p_o], 'pagination': {'total_pages': p.num_pages, 'current_page': p_o.number, 'total_items': p.count}}, status=200)
        return JsonResponse({'data': [serialize_club(c) for c in qs]}, status=200)

    def post(self, request, *args, **kwargs):
        data = parse_body(request)
        if 'name' not in data or 'organization_id' not in data: return JsonResponse({'error': 'Faltan datos.'}, status=400)
        invalid_phone = phone_error(data.get('phone'))
        if invalid_phone:
            return JsonResponse({'error': invalid_phone}, status=400)
        try: return JsonResponse({'data': serialize_club(self.model.objects.create(**data))}, status=201)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def put(self, request, obj_id=None, *args, **kwargs):
        cid = obj_id or request.GET.get('club_id')
        if not cid: return JsonResponse({'error': 'Falta el identificador del club.'}, status=400)
        data = parse_body(request)
        invalid_phone = phone_error(data.get('phone')) if 'phone' in data else None
        if invalid_phone:
            return JsonResponse({'error': invalid_phone}, status=400)
        try:
            c = self.model.objects.get(id=cid, organization=request.user.organization)
            for k, v in data.items():
                if hasattr(c, k): setattr(c, k, v)
            c.save(); return JsonResponse({'data': serialize_club(c)}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'No encontrado.'}, status=404)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request, obj_id=None, *args, **kwargs):
        cid = obj_id or request.GET.get('club_id')
        if not cid: return JsonResponse({'error': 'Falta el identificador del club.'}, status=400)
        try:
            self.model.objects.get(id=cid, organization=request.user.organization).delete()
            return JsonResponse({'message': 'Eliminado.'}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'No encontrado.'}, status=404)
