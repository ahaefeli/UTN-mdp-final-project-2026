from django.http import JsonResponse
from django.core.paginator import Paginator
from django.forms.models import model_to_dict
from .base import BaseCrudView, parse_body
from core.models import User

def serialize_user(user):
    data = model_to_dict(user)
    if 'password' in data: del data['password']
    data.update({'name': f"{user.first_name} {user.last_name}".strip(), 'enable': user.is_active, 'dni': user.dni})
    return data

class UserView(BaseCrudView):
    model = User
    def get(self, request):
        user_id = request.GET.get('user_id')
        if user_id:
            try: return JsonResponse({'data': serialize_user(self.model.objects.get(id=user_id))}, status=200)
            except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
        qs = self.model.objects.all().order_by('id')
        page = request.GET.get('page')
        if page:
            paginator = Paginator(qs, 10); p_obj = paginator.get_page(page)
            return JsonResponse({'data': [serialize_user(u) for u in p_obj], 'pagination': {'total_pages': paginator.num_pages, 'current_page': p_obj.number, 'total_items': paginator.count}}, status=200)
        return JsonResponse({'data': [serialize_user(u) for u in qs]}, status=200)

    def post(self, request):
        data = parse_body(request)
        for f in ['role', 'user', 'password', 'organization_id', 'dni']:
            if f not in data: return JsonResponse({'error': f'Missing: {f}'}, status=400)
        try:
            user_val, pwd, name = data.pop('user'), data.pop('password'), data.pop('name', '')
            f_name = name.split(' ')[0] if name else ''
            l_name = ' '.join(name.split(' ')[1:]) if ' ' in name else ''
            user = User.objects.create(username=user_val, first_name=f_name, last_name=l_name, **data)
            user.set_password(pwd); user.save()
            return JsonResponse({'data': serialize_user(user)}, status=201)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def put(self, request):
        user_id = request.GET.get('user_id')
        if not user_id: return JsonResponse({'error': 'Missing user_id'}, status=400)
        data = parse_body(request)
        try:
            u = User.objects.get(id=user_id)
            if 'enable' in data:
                if (data.get('requester_role') or getattr(request.user, 'role', None)) != 'ADMIN':
                    return JsonResponse({'error': 'Admin only'}, status=403)
                u.is_active = data.pop('enable')
            if 'name' in data:
                n = data.pop('name'); u.first_name = n.split(' ')[0]; u.last_name = ' '.join(n.split(' ')[1:]) if ' ' in n else ''
            if 'password' in data: u.set_password(data.pop('password'))
            if 'user' in data: u.username = data.pop('user')
            for k, v in data.items():
                if hasattr(u, k): setattr(u, k, v)
            u.save(); return JsonResponse({'data': serialize_user(u)}, status=200)
        except User.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
        except Exception as e: return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request):
        uid = request.GET.get('user_id')
        if not uid: return JsonResponse({'error': 'Missing user_id'}, status=400)
        try: self.model.objects.get(id=uid).delete(); return JsonResponse({'message': 'Deleted'}, status=200)
        except self.model.DoesNotExist: return JsonResponse({'error': 'Not found'}, status=404)
