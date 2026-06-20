from django.http import JsonResponse
from django.core.paginator import Paginator
from .base import BaseCrudView, parse_body
from core.models import Court

def serialize_court(court):
    return {'id': court.id, 'name': court.name, 'enabled': court.enabled, 'club_id': court.club_id, 'club_name': court.club.name if court.club else None}

class CourtView(BaseCrudView):
    model = Court
    def get(self, request, obj_id=None, *args, **kwargs):
        cid = obj_id or request.GET.get('court_id')
        if cid:
            try: return JsonResponse({'data': serialize_court(self.model.objects.get(id=cid))}, status=200)
            except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
        cl_id = request.GET.get('club_id')
        qs = self.model.objects.filter(club_id=cl_id).order_by('id') if cl_id else self.model.objects.all().order_by('id')
        page = request.GET.get('page')
        if page:
            p = Paginator(qs, 10); p_o = p.get_page(page)
            return JsonResponse({'data': [serialize_court(c) for c in p_o], 'pagination': {'total_pages': p.num_pages, 'current_page': p_o.number, 'total_items': p.count}}, status=200)
        return JsonResponse({'data': [serialize_court(c) for c in qs]}, status=200)

    def post(self, request, *args, **kwargs):
        data = parse_body(request)
        if not all(k in data for k in ['club_id', 'name', 'enabled']): return JsonResponse({'error': 'Missing fields'}, status=400)
        try: return JsonResponse({'data': serialize_court(self.model.objects.create(**data))}, status=201)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def put(self, request, obj_id=None, *args, **kwargs):
        cid = obj_id or request.GET.get('court_id')
        if not cid: return JsonResponse({'error': 'Missing court_id'}, status=400)
        data = parse_body(request)
        try:
            c = self.model.objects.get(id=cid)
            for k, v in data.items():
                if hasattr(c, k): setattr(c, k, v)
            c.save(); return JsonResponse({'data': serialize_court(c)}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request, obj_id=None, *args, **kwargs):
        cid = obj_id or request.GET.get('court_id')
        if not cid: return JsonResponse({'error': 'Missing court_id'}, status=400)
        try: self.model.objects.get(id=cid).delete(); return JsonResponse({'message': 'Deleted'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
