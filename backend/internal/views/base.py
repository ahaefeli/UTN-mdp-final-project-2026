import json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict
from core.auth import jwt_required

def parse_body(request):
    try: return json.loads(request.body)
    except json.JSONDecodeError: return {}

@method_decorator(jwt_required, name='dispatch')
class BaseCrudView(View):
    model = None
    def _get_id_from_params(self, request, obj_id=None):
        obj_id = obj_id or getattr(self, 'kwargs', {}).get('obj_id')
        if obj_id: return obj_id
        for p in ['club_id', 'court_id', 'team_id', 'tournament_id', 'user_id', 'match_id']:
            val = getattr(self, 'kwargs', {}).get(p)
            if val: return val
        return None

    def get(self, request, obj_id=None, *args, **kwargs):
        obj_id = self._get_id_from_params(request, obj_id)
        if obj_id:
            try:
                obj = self.model.objects.get(id=obj_id)
                data = model_to_dict(obj)
                if 'id' not in data: data['id'] = str(obj.id)
                if 'password' in data: del data['password']
                return JsonResponse({'data': data}, status=200)
            except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
        qs = self.model.objects.all()
        for k, v in request.GET.items():
            if hasattr(self.model, k): qs = qs.filter(**{k: v})
        data = list(qs.values())
        for item in data:
            if 'password' in item: del item['password']
        return JsonResponse({'data': data}, status=200)

    def post(self, request, *args, **kwargs):
        from core.models import User
        data = parse_body(request)
        try:
            obj = self.model.objects.create(**data)
            if isinstance(obj, User) and 'password' in data:
                obj.set_password(data['password']); obj.save()
            resp_data = model_to_dict(obj)
            if 'id' not in resp_data: resp_data['id'] = str(obj.id)
            if 'password' in resp_data: del resp_data['password']
            return JsonResponse({'data': resp_data}, status=201)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def put(self, request, obj_id=None, *args, **kwargs):
        from core.models import User
        obj_id = self._get_id_from_params(request, obj_id)
        if not obj_id: return JsonResponse({'error': 'Missing id parameter'}, status=400)
        data = parse_body(request)
        try:
            self.model.objects.filter(id=obj_id).update(**data)
            obj = self.model.objects.get(id=obj_id)
            if isinstance(obj, User) and 'password' in data:
                obj.set_password(data['password']); obj.save()
            resp_data = model_to_dict(obj)
            if 'id' not in resp_data: resp_data['id'] = str(obj.id)
            if 'password' in resp_data: del resp_data['password']
            return JsonResponse({'data': resp_data}, status=200)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request, obj_id=None, *args, **kwargs):
        obj_id = self._get_id_from_params(request, obj_id)
        if not obj_id: return JsonResponse({'error': 'Missing id parameter'}, status=400)
        try:
            obj = self.model.objects.get(id=obj_id); obj.delete()
            return JsonResponse({'message': 'Deleted successfully'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
