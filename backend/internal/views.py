import json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist
from django.forms.models import model_to_dict
from .models import Usuario, Club, Cancha, Equipo, Torneo, InscripcionTorneo, FechaTorneo, Partido, Set

def parse_body(request):
    try:
        return json.loads(request.body)
    except json.JSONDecodeError:
        return {}

@method_decorator(csrf_exempt, name='dispatch')
class BaseCrudView(View):
    model = None
    
    def _get_id_from_params(self, request):
        # Priority order: 'id', then specific identifiers from spec ('club_id', 'court_id', 'team_id', 'tournament_id')
        obj_id = request.GET.get('id')
        if obj_id:
            return obj_id
            
        specific_params = ['club_id', 'court_id', 'team_id', 'tournament_id']
        for param in specific_params:
            val = request.GET.get(param)
            if val:
                return val
        return None

    def get(self, request):
        obj_id = self._get_id_from_params(request)
        if obj_id:
            try:
                obj = self.model.objects.get(id=obj_id)
                data = model_to_dict(obj)
                if 'password' in data:
                    del data['password']
                return JsonResponse({'data': data}, status=200)
            except self.model.DoesNotExist:
                return JsonResponse({'error': 'Not found'}, status=404)
        
        qs = self.model.objects.all()
        
        # Simple dynamic filtering based on query params
        for key, value in request.GET.items():
            if hasattr(self.model, key):
                qs = qs.filter(**{key: value})
                
        data = list(qs.values())
        for item in data:
            if 'password' in item:
                del item['password']
                
        return JsonResponse({'data': data}, status=200)

    def post(self, request):
        data = parse_body(request)
        try:
            obj = self.model.objects.create(**data)
            if isinstance(obj, Usuario) and 'password' in data:
                obj.set_password(data['password'])
                obj.save()
                
            resp_data = model_to_dict(obj)
            if 'password' in resp_data: del resp_data['password']
            return JsonResponse({'data': resp_data}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def put(self, request):
        obj_id = self._get_id_from_params(request)
        if not obj_id:
            return JsonResponse({'error': 'Missing id parameter in Query'}, status=400)
        data = parse_body(request)
        try:
            self.model.objects.filter(id=obj_id).update(**data)
            obj = self.model.objects.get(id=obj_id)
            if isinstance(obj, Usuario) and 'password' in data:
                obj.set_password(data['password'])
                obj.save()
                
            resp_data = model_to_dict(obj)
            if 'password' in resp_data: del resp_data['password']
            return JsonResponse({'data': resp_data}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request):
        obj_id = self._get_id_from_params(request)
        if not obj_id:
            return JsonResponse({'error': 'Missing id parameter in Query'}, status=400)
        try:
            obj = self.model.objects.get(id=obj_id)
            obj.delete()
            return JsonResponse({'message': 'Deleted successfully'}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)

class UsuarioView(BaseCrudView): model = Usuario
class ClubView(BaseCrudView): model = Club
class CanchaView(BaseCrudView): model = Cancha
class EquipoView(BaseCrudView): model = Equipo
class TorneoView(BaseCrudView): model = Torneo
class InscripcionTorneoView(BaseCrudView): model = InscripcionTorneo
class FechaTorneoView(BaseCrudView): model = FechaTorneo
class PartidoView(BaseCrudView): model = Partido

@method_decorator(csrf_exempt, name='dispatch')
class PartidoReprogramarView(View):
    def post(self, request):
        data = parse_body(request)
        match_id = data.get('match_id')
        try:
            partido = Partido.objects.get(id=match_id)
            if 'court_id' in data: partido.court_id = data['court_id']
            if 'match_datetime' in data: partido.match_datetime = data['match_datetime']
            if 'referee_id' in data: partido.referee_id = data['referee_id']
            partido.save()
            return JsonResponse({'data': model_to_dict(partido)}, status=200)
        except Partido.DoesNotExist:
            return JsonResponse({'error': 'Match not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class PartidoFinalizarView(View):
    def post(self, request):
        data = parse_body(request)
        match_id = data.get('match_id')
        scores = data.get('scores', []) # list of dicts: [{'set_number': 1, 'local_points': 25, 'visitor_points': 20}]
        score_summary = data.get('score_summary')
        
        try:
            partido = Partido.objects.get(id=match_id)
            partido.status = 'FINISHED'
            if score_summary:
                partido.score_summary = score_summary
            partido.save()
            
            for score in scores:
                Set.objects.update_or_create(
                    match=partido, 
                    set_number=score['set_number'],
                    defaults={
                        'local_points': score.get('local_points', 0),
                        'visitor_points': score.get('visitor_points', 0)
                    }
                )
                
            return JsonResponse({'message': 'Match finished and scores registered successfully'}, status=200)
        except Partido.DoesNotExist:
            return JsonResponse({'error': 'Match not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
