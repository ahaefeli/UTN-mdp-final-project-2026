from django.http import JsonResponse
from core.models import User
from .base import BaseCrudView


class PlayerView(BaseCrudView):
    model = User

    def _scoped_players(self, request):
        qs = self.model.objects.filter(role='PLAYER')
        role = getattr(request.user, 'role', None)
        if role in ('COACH', 'CLUB_ADMIN'):
            if not request.user.club_id:
                return qs.none()
            return qs.filter(club_id=request.user.club_id)
        if role == 'ADMIN':
            if not request.user.organization_id:
                return qs.none()
            return qs.filter(organization_id=request.user.organization_id)
        return qs.none()

    def get(self, request, obj_id=None, *args, **kwargs):
        obj_id = self._get_id_from_params(request, obj_id)
        qs = self._scoped_players(request)

        if obj_id:
            try:
                obj = qs.get(id=obj_id)
                from .users import serialize_user
                return JsonResponse({'data': serialize_user(obj)}, status=200)
            except self.model.DoesNotExist:
                return JsonResponse({'error': 'No encontrado.'}, status=404)

        team_id = request.GET.get('team_id')
        if team_id:
            qs = qs.filter(teams_playing__id=team_id).distinct()

        for k, v in request.GET.items():
            if k not in ['team_id', 'organization_id', 'club', 'club_id'] and hasattr(self.model, k):
                qs = qs.filter(**{k: v})

        from .users import serialize_user
        data = [serialize_user(u) for u in qs]
        return JsonResponse({'data': data}, status=200)
