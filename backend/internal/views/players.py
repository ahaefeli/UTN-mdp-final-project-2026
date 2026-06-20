from django.http import JsonResponse
from core.models import User
from .base import BaseCrudView

class PlayerView(BaseCrudView):
    model = User

    def get(self, request, obj_id=None, *args, **kwargs):
        obj_id = self._get_id_from_params(request, obj_id)
        if obj_id:
            try:
                obj = self.model.objects.get(id=obj_id, role='PLAYER')
                from django.forms.models import model_to_dict
                data = model_to_dict(obj)
                if 'id' not in data: data['id'] = str(obj.id)
                if 'password' in data: del data['password']
                return JsonResponse({'data': data}, status=200)
            except self.model.DoesNotExist:
                return JsonResponse({'error': 'Not found'}, status=404)

        qs = self.model.objects.filter(role='PLAYER')
        
        # Filtrado adicional
        team_id = request.GET.get('team_id')
        if team_id:
            qs = qs.filter(teams_playing__id=team_id).distinct()
            
        organization_id = request.GET.get('organization_id')
        if organization_id:
            qs = qs.filter(organization_id=organization_id)

        # Filtrado generico
        for k, v in request.GET.items():
            if k not in ['team_id', 'organization_id'] and hasattr(self.model, k):
                qs = qs.filter(**{k: v})

        data = list(qs.values())
        for item in data:
            if 'password' in item: del item['password']
        return JsonResponse({'data': data}, status=200)
