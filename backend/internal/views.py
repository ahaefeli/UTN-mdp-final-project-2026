import json
from django.db import models
from django.db.models import Q
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist
from django.forms.models import model_to_dict
from django.core.paginator import Paginator
from .models import User, Club, Court, Team, Tournament, TournamentEnrollment, TournamentStage, Match, GameSet

def parse_body(request):
    try:
        return json.loads(request.body)
    except json.JSONDecodeError:
        return {}

def serialize_user(user):
    data = model_to_dict(user)
    if 'password' in data:
        del data['password']
    data['name'] = f"{user.first_name} {user.last_name}".strip()
    data['enable'] = user.is_active
    data['dni'] = user.dni
    return data

def serialize_club(club):
    return {
        'id': club.id,
        'name': club.name,
        'address': club.address,
        'phone': club.phone,
        'email': club.email,
        'organization_id': club.organization_id
    }

def serialize_court(court):
    return {
        'id': court.id,
        'name': court.name,
        'enabled': court.enabled,
        'club_id': court.club_id,
        'club_name': court.club.name if court.club else None
    }

def serialize_team(team):
    return {
        'id': team.id,
        'name': team.name,
        'category': team.category,
        'branch': team.branch,
        'club_id': team.club_id,
        'organization_id': team.organization_id,
        'coach_id': team.coach_id,
        'coach_name': f"{team.coach.first_name} {team.coach.last_name}".strip() if team.coach else None,
        'tournament_id': team.tournament_id
    }

def serialize_tournament(tournament):
    return {
        'id': tournament.id,
        'name': tournament.name,
        'year': tournament.year,
        'start_date': tournament.start_date.isoformat() if tournament.start_date else None,
        'end_date': tournament.end_date.isoformat() if tournament.end_date else None,
        'category': tournament.category,
        'branch': tournament.branch,
        'status': tournament.status
    }

def serialize_enrollment(enrollment):
    return {
        'id': enrollment.id,
        'tournament_id': enrollment.tournament_id,
        'tournament_name': enrollment.tournament.name,
        'team_id': enrollment.team_id,
        'team_name': enrollment.team.name,
        'category': enrollment.team.category,
        'branch': enrollment.team.branch
    }

def serialize_stage(stage):
    return {
        'id': stage.id,
        'tournament_id': stage.tournament_id,
        'tournament_name': stage.tournament.name,
        'date': stage.date.isoformat(),
        'name': stage.name
    }

def serialize_match_detail(match):
    data = {
        'id': match.id,
        'tournament_stage_id': match.tournament_stage_id,
        'local_team_id': match.local_team_id,
        'local_team_name': match.local_team.name,
        'visitor_team_id': match.visitor_team_id,
        'visitor_team_name': match.visitor_team.name,
        'court_id': match.court_id,
        'court_name': match.court.name if match.court else None,
        'match_datetime': match.match_datetime.isoformat() if match.match_datetime else None,
        'referee_id': match.referee_id,
        'referee_name': f"{match.referee.first_name} {match.referee.last_name}".strip() if match.referee else None,
        'scorer_id': match.scorer_id,
        'scorer_name': f"{match.scorer.first_name} {match.scorer.last_name}".strip() if match.scorer else None,
        'status': match.status,
        'score_summary': match.score_summary,
        'sets': []
    }
    
    sets = match.sets.all().order_by('set_number')
    for s in sets:
        data['sets'].append({
            'set_number': s.set_number,
            'local_points': s.local_points,
            'visitor_points': s.visitor_points
        })
    return data

@method_decorator(csrf_exempt, name='dispatch')
class BaseCrudView(View):
    model = None
    
    def _get_id_from_params(self, request):
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
            if isinstance(obj, User) and 'password' in data:
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
            if isinstance(obj, User) and 'password' in data:
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

class UserView(BaseCrudView):
    model = User

    def get(self, request):
        user_id = request.GET.get('user_id')
        if user_id:
            try:
                obj = self.model.objects.get(id=user_id)
                return JsonResponse({'data': serialize_user(obj)}, status=200)
            except self.model.DoesNotExist:
                return JsonResponse({'error': 'Not found'}, status=404)
        
        qs = self.model.objects.all().order_by('id')
        page_number = request.GET.get('page')
        
        if page_number:
            paginator = Paginator(qs, 10)
            try:
                page_obj = paginator.get_page(page_number)
                data = [serialize_user(u) for u in page_obj]
                return JsonResponse({
                    'data': data,
                    'pagination': {
                        'total_pages': paginator.num_pages,
                        'current_page': page_obj.number,
                        'total_items': paginator.count
                    }
                }, status=200)
            except Exception as e:
                return JsonResponse({'error': str(e)}, status=400)
        
        data = [serialize_user(u) for u in qs]
        return JsonResponse({'data': data}, status=200)

    def post(self, request):
        data = parse_body(request)
        required = ['role', 'user', 'password', 'organization_id', 'dni']
        for field in required:
            if field not in data:
                return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
        
        try:
            username = data.pop('user')
            password = data.pop('password')
            name = data.pop('name', '')
            
            first_name = name.split(' ')[0] if name else ''
            last_name = ' '.join(name.split(' ')[1:]) if name and ' ' in name else ''
            
            user = User.objects.create(
                username=username,
                first_name=first_name,
                last_name=last_name,
                **data
            )
            user.set_password(password)
            user.save()
            
            return JsonResponse({'data': serialize_user(user)}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def put(self, request):
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({'error': 'Missing user_id parameter in Query'}, status=400)
            
        data = parse_body(request)
        try:
            user = User.objects.get(id=user_id)
            
            if 'enable' in data:
                requester_role = data.get('requester_role') or getattr(request.user, 'role', None)
                if requester_role != 'ADMIN':
                    return JsonResponse({'error': 'Only ADMIN can edit enable status'}, status=403)
                user.is_active = data.pop('enable')

            if 'name' in data:
                name = data.pop('name')
                user.first_name = name.split(' ')[0]
                user.last_name = ' '.join(name.split(' ')[1:]) if ' ' in name else ''
            
            if 'password' in data:
                user.set_password(data.pop('password'))
            
            if 'user' in data:
                user.username = data.pop('user')

            for key, value in data.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            
            user.save()
            return JsonResponse({'data': serialize_user(user)}, status=200)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request):
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({'error': 'Missing user_id parameter in Query'}, status=400)
        try:
            obj = self.model.objects.get(id=user_id)
            obj.delete()
            return JsonResponse({'message': 'Deleted successfully'}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)

class ClubView(BaseCrudView):
    model = Club

    def get(self, request):
        club_id = request.GET.get('club_id')
        if club_id:
            try:
                obj = self.model.objects.get(id=club_id)
                return JsonResponse({'data': serialize_club(obj)}, status=200)
            except self.model.DoesNotExist:
                return JsonResponse({'error': 'Not found'}, status=404)
        
        qs = self.model.objects.all().order_by('id')
        page_number = request.GET.get('page')
        
        if page_number:
            paginator = Paginator(qs, 10)
            try:
                page_obj = paginator.get_page(page_number)
                data = [serialize_club(c) for c in page_obj]
                return JsonResponse({
                    'data': data,
                    'pagination': {
                        'total_pages': paginator.num_pages,
                        'current_page': page_obj.number,
                        'total_items': paginator.count
                    }
                }, status=200)
            except Exception as e:
                return JsonResponse({'error': str(e)}, status=400)
        
        data = [serialize_club(c) for c in qs]
        return JsonResponse({'data': data}, status=200)

    def post(self, request):
        data = parse_body(request)
        if 'name' not in data or 'organization_id' not in data:
            return JsonResponse({'error': 'Missing required fields: name, organization_id'}, status=400)
        try:
            obj = self.model.objects.create(**data)
            return JsonResponse({'data': serialize_club(obj)}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def put(self, request):
        club_id = request.GET.get('club_id')
        if not club_id:
            return JsonResponse({'error': 'Missing club_id parameter in Query'}, status=400)
        data = parse_body(request)
        try:
            club = self.model.objects.get(id=club_id)
            for key, value in data.items():
                if hasattr(club, key):
                    setattr(club, key, value)
            club.save()
            return JsonResponse({'data': serialize_club(club)}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request):
        club_id = request.GET.get('club_id')
        if not club_id:
            return JsonResponse({'error': 'Missing club_id parameter in Query'}, status=400)
        try:
            obj = self.model.objects.get(id=club_id)
            obj.delete()
            return JsonResponse({'message': 'Deleted successfully'}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
class CourtView(BaseCrudView):
    model = Court

    def get(self, request):
        court_id = request.GET.get('court_id')
        if court_id:
            try:
                obj = self.model.objects.get(id=court_id)
                return JsonResponse({'data': serialize_court(obj)}, status=200)
            except self.model.DoesNotExist:
                return JsonResponse({'error': 'Not found'}, status=404)
        
        club_id = request.GET.get('club_id')
        if club_id:
            qs = self.model.objects.filter(club_id=club_id).order_by('id')
            data = [serialize_court(c) for c in qs]
            return JsonResponse({'data': data}, status=200)

        qs = self.model.objects.all().order_by('id')
        page_number = request.GET.get('page')
        
        if page_number:
            paginator = Paginator(qs, 10)
            try:
                page_obj = paginator.get_page(page_number)
                data = [serialize_court(c) for c in page_obj]
                return JsonResponse({
                    'data': data,
                    'pagination': {
                        'total_pages': paginator.num_pages,
                        'current_page': page_obj.number,
                        'total_items': paginator.count
                    }
                }, status=200)
            except Exception as e:
                return JsonResponse({'error': str(e)}, status=400)
        
        data = [serialize_court(c) for c in qs]
        return JsonResponse({'data': data}, status=200)

    def post(self, request):
        data = parse_body(request)
        if 'club_id' not in data or 'name' not in data or 'enabled' not in data:
            return JsonResponse({'error': 'Missing required fields: club_id, name, enabled'}, status=400)
        try:
            obj = self.model.objects.create(**data)
            return JsonResponse({'data': serialize_court(obj)}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def put(self, request):
        court_id = request.GET.get('court_id')
        if not court_id:
            return JsonResponse({'error': 'Missing court_id parameter in Query'}, status=400)
        data = parse_body(request)
        try:
            court = self.model.objects.get(id=court_id)
            for key, value in data.items():
                if hasattr(court, key):
                    setattr(court, key, value)
            court.save()
            return JsonResponse({'data': serialize_court(court)}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request):
        court_id = request.GET.get('court_id')
        if not court_id:
            return JsonResponse({'error': 'Missing court_id parameter in Query'}, status=400)
        try:
            obj = self.model.objects.get(id=court_id)
            obj.delete()
            return JsonResponse({'message': 'Deleted successfully'}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
class TeamView(BaseCrudView):
    model = Team

    def get(self, request):
        team_id = request.GET.get('team_id')
        if team_id:
            try:
                obj = self.model.objects.get(id=team_id, is_deleted=False)
                return JsonResponse({'data': serialize_team(obj)}, status=200)
            except self.model.DoesNotExist:
                return JsonResponse({'error': 'Not found'}, status=404)
        
        qs = self.model.objects.filter(is_deleted=False).order_by('id')
        
        club_id = request.GET.get('club_id')
        if club_id:
            qs = qs.filter(club_id=club_id)
            
        page_number = request.GET.get('page')
        if page_number:
            paginator = Paginator(qs, 10)
            try:
                page_obj = paginator.get_page(page_number)
                data = [serialize_team(t) for t in page_obj]
                return JsonResponse({
                    'data': data,
                    'pagination': {
                        'total_pages': paginator.num_pages,
                        'current_page': page_obj.number,
                        'total_items': paginator.count
                    }
                }, status=200)
            except Exception as e:
                return JsonResponse({'error': str(e)}, status=400)
        
        data = [serialize_team(t) for t in qs]
        return JsonResponse({'data': data}, status=200)

    def post(self, request):
        data = parse_body(request)
        required = ['club_id', 'organization_id', 'name', 'category', 'branch']
        for field in required:
            if field not in data:
                return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
        try:
            obj = self.model.objects.create(**data)
            return JsonResponse({'data': serialize_team(obj)}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def put(self, request):
        team_id = request.GET.get('team_id')
        if not team_id:
            return JsonResponse({'error': 'Missing team_id parameter in Query'}, status=400)
        data = parse_body(request)
        try:
            team = self.model.objects.get(id=team_id, is_deleted=False)
            for key, value in data.items():
                if hasattr(team, key):
                    setattr(team, key, value)
            team.save()
            return JsonResponse({'data': serialize_team(team)}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request):
        team_id = request.GET.get('team_id')
        if not team_id:
            return JsonResponse({'error': 'Missing team_id parameter in Query'}, status=400)
        try:
            team = self.model.objects.get(id=team_id)
            team.is_deleted = True
            team.save()
            return JsonResponse({'message': 'Deleted successfully (soft delete)'}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
class TournamentView(BaseCrudView):
    model = Tournament

    def get(self, request):
        tournament_id = request.GET.get('tournament_id')
        if tournament_id:
            try:
                obj = self.model.objects.get(id=tournament_id)
                return JsonResponse({'data': serialize_tournament(obj)}, status=200)
            except self.model.DoesNotExist:
                return JsonResponse({'error': 'Not found'}, status=404)
        
        qs = self.model.objects.all().order_by('-year', 'id')
        
        year = request.GET.get('year')
        if year:
            qs = qs.filter(year=year)
            
        status = request.GET.get('status')
        if status:
            qs = qs.filter(status=status)

        page_number = request.GET.get('page')
        if page_number:
            paginator = Paginator(qs, 10)
            try:
                page_obj = paginator.get_page(page_number)
                data = [serialize_tournament(t) for t in page_obj]
                return JsonResponse({
                    'data': data,
                    'pagination': {
                        'total_pages': paginator.num_pages,
                        'current_page': page_obj.number,
                        'total_items': paginator.count
                    }
                }, status=200)
            except Exception as e:
                return JsonResponse({'error': str(e)}, status=400)
        
        data = [serialize_tournament(t) for t in qs]
        return JsonResponse({'data': data}, status=200)

    def post(self, request):
        data = parse_body(request)
        required = ['name', 'year', 'category', 'branch']
        for field in required:
            if field not in data:
                return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
        try:
            data['status'] = 'PREPARATION'
            obj = self.model.objects.create(**data)
            return JsonResponse({'data': serialize_tournament(obj)}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def put(self, request):
        tournament_id = request.GET.get('tournament_id')
        if not tournament_id:
            return JsonResponse({'error': 'Missing tournament_id parameter in Query'}, status=400)
        data = parse_body(request)
        try:
            obj = self.model.objects.get(id=tournament_id)
            for key, value in data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)
            obj.save()
            return JsonResponse({'data': serialize_tournament(obj)}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request):
        tournament_id = request.GET.get('tournament_id')
        if not tournament_id:
            return JsonResponse({'error': 'Missing tournament_id parameter in Query'}, status=400)
        try:
            obj = self.model.objects.get(id=tournament_id)
            obj.delete()
            return JsonResponse({'message': 'Deleted successfully'}, status=200)
        except Exception as e:
            return JsonResponse({'error': 'Cannot delete tournament. It may have associated enrollments or matches.'}, status=400)
class TournamentEnrollmentView(BaseCrudView):
    model = TournamentEnrollment

    def get(self, request):
        tournament_id = request.GET.get('tournament_id')
        if tournament_id:
            qs = self.model.objects.filter(tournament_id=tournament_id)
            data = [serialize_enrollment(e) for e in qs]
            return JsonResponse({'data': data}, status=200)
            
        team_id = request.GET.get('team_id')
        if team_id:
            qs = self.model.objects.filter(team_id=team_id)
            data = [serialize_enrollment(e) for e in qs]
            return JsonResponse({'data': data}, status=200)
            
        return JsonResponse({'error': 'Missing tournament_id or team_id parameter'}, status=400)

    def post(self, request):
        data = parse_body(request)
        tournament_id = data.get('tournament_id')
        team_id = data.get('team_id')
        
        if not tournament_id or not team_id:
            return JsonResponse({'error': 'Missing tournament_id or team_id'}, status=400)
            
        try:
            tournament = Tournament.objects.get(id=tournament_id)
            team = Team.objects.get(id=team_id)
            
            # Validation: category and branch must match
            if team.category != tournament.category or team.branch != tournament.branch:
                return JsonResponse({
                    'error': 'The team category or branch does not match the tournament specifications'
                }, status=400)
            
            # Check for existing enrollment (unique_together)
            if TournamentEnrollment.objects.filter(tournament=tournament, team=team).exists():
                return JsonResponse({'error': 'This team is already enrolled in this tournament'}, status=400)
            
            obj = self.model.objects.create(tournament=tournament, team=team)
            return JsonResponse({'data': serialize_enrollment(obj)}, status=201)
        except Tournament.DoesNotExist:
            return JsonResponse({'error': 'Tournament not found'}, status=404)
        except Team.DoesNotExist:
            return JsonResponse({'error': 'Team not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request):
        tournament_id = request.GET.get('tournament_id')
        team_id = request.GET.get('team_id')
        
        if not tournament_id or not team_id:
            return JsonResponse({'error': 'Missing tournament_id or team_id in Query'}, status=400)
            
        try:
            obj = self.model.objects.get(tournament_id=tournament_id, team_id=team_id)
            obj.delete()
            return JsonResponse({'message': 'Unenrolled successfully'}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Enrollment not found'}, status=404)
class TournamentStageView(BaseCrudView):
    model = TournamentStage

    def get(self, request):
        tournament_id = request.GET.get('tournament_id')
        if not tournament_id:
            return JsonResponse({'error': 'tournament_id parameter is mandatory'}, status=400)
            
        qs = self.model.objects.filter(tournament_id=tournament_id).order_by('date')
        data = [serialize_stage(s) for s in qs]
        return JsonResponse({'data': data}, status=200)

    def post(self, request):
        data = parse_body(request)
        required = ['tournament_id', 'date', 'name']
        for field in required:
            if field not in data:
                return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
        try:
            obj = self.model.objects.create(**data)
            return JsonResponse({'data': serialize_stage(obj)}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request):
        stage_id = request.GET.get('id') or request.GET.get('date_id')
        if not stage_id:
            return JsonResponse({'error': 'Missing id or date_id parameter in Query'}, status=400)
            
        try:
            stage = self.model.objects.get(id=stage_id)
            
            # Referential Integrity Check: No matches should be associated
            if Match.objects.filter(tournament_stage=stage).exists():
                return JsonResponse({
                    'error': 'Cannot delete stage. It has associated matches.'
                }, status=400)
                
            stage.delete()
            return JsonResponse({'message': 'Deleted successfully'}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
class MatchView(BaseCrudView):
    model = Match

    def get(self, request):
        match_id = request.GET.get('match_id')
        if match_id:
            try:
                obj = self.model.objects.get(id=match_id)
                return JsonResponse({'data': serialize_match_detail(obj)}, status=200)
            except self.model.DoesNotExist:
                return JsonResponse({'error': 'Not found'}, status=404)
        
        date_id = request.GET.get('date_id')
        if date_id:
            qs = self.model.objects.filter(tournament_stage_id=date_id).order_by('match_datetime')
            data = [serialize_match_detail(m) for m in qs]
            return JsonResponse({'data': data}, status=200)

        qs = self.model.objects.all().order_by('-match_datetime', 'id')
        
        # Cross-filters
        club_id = request.GET.get('club_id')
        if club_id:
            qs = qs.filter(models.Q(local_team__club_id=club_id) | models.Q(visitor_team__club_id=club_id))
            
        team_id = request.GET.get('team_id')
        if team_id:
            qs = qs.filter(models.Q(local_team_id=team_id) | models.Q(visitor_team_id=team_id))
            
        status = request.GET.get('status')
        if status:
            qs = qs.filter(status=status)

        page_number = request.GET.get('page')
        if page_number:
            paginator = Paginator(qs, 10)
            try:
                page_obj = paginator.get_page(page_number)
                data = [serialize_match_detail(m) for m in page_obj]
                return JsonResponse({
                    'data': data,
                    'pagination': {
                        'total_pages': paginator.num_pages,
                        'current_page': page_obj.number,
                        'total_items': paginator.count
                    }
                }, status=200)
            except Exception as e:
                return JsonResponse({'error': str(e)}, status=400)
        
        data = [serialize_match_detail(m) for m in qs]
        return JsonResponse({'data': data}, status=200)

    def post(self, request):
        data = parse_body(request)
        local_team_id = data.get('local_team_id')
        visitor_team_id = data.get('visitor_team_id')
        
        if local_team_id == visitor_team_id:
            return JsonResponse({'error': 'A team cannot play against itself'}, status=400)
            
        try:
            data['status'] = 'PENDING'
            obj = self.model.objects.create(**data)
            return JsonResponse({'data': serialize_match_detail(obj)}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def put(self, request):
        match_id = request.GET.get('match_id')
        if not match_id:
            return JsonResponse({'error': 'Missing match_id parameter in Query'}, status=400)
        data = parse_body(request)
        try:
            obj = self.model.objects.get(id=match_id)
            for key, value in data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)
            obj.save()
            return JsonResponse({'data': serialize_match_detail(obj)}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def delete(self, request):
        match_id = request.GET.get('match_id')
        if not match_id:
            return JsonResponse({'error': 'Missing match_id parameter in Query'}, status=400)
        try:
            obj = self.model.objects.get(id=match_id)
            obj.delete()
            return JsonResponse({'message': 'Deleted successfully'}, status=200)
        except self.model.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)

@method_decorator(csrf_exempt, name='dispatch')
class MatchRescheduleView(View):
    def post(self, request):
        data = parse_body(request)
        match_id = data.get('match_id')
        if not match_id:
            return JsonResponse({'error': 'match_id is required in body'}, status=400)
        try:
            match = Match.objects.get(id=match_id)
            if 'court_id' in data: match.court_id = data['court_id']
            if 'match_datetime' in data: match.match_datetime = data['match_datetime']
            if 'referee_id' in data: match.referee_id = data['referee_id']
            match.save()
            return JsonResponse({'data': serialize_match_detail(match)}, status=200)
        except Match.DoesNotExist:
            return JsonResponse({'error': 'Match not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class MatchFinishView(View):
    def post(self, request):
        data = parse_body(request)
        match_id = data.get('match_id')
        score_detail = data.get('score_detail') or data.get('scores', [])
        
        if not match_id:
            return JsonResponse({'error': 'match_id is required in body'}, status=400)
        
        try:
            match = Match.objects.get(id=match_id)
            match.status = 'FINISHED'
            
            summary_parts = []
            for score in score_detail:
                l_pts = score.get('local_points', 0)
                v_pts = score.get('visitor_points', 0)
                summary_parts.append(f"{l_pts}-{v_pts}")
                
                GameSet.objects.update_or_create(
                    match=match, 
                    set_number=score['set_number'],
                    defaults={
                        'local_points': l_pts,
                        'visitor_points': v_pts
                    }
                )
            
            if summary_parts:
                match.score_summary = ", ".join(summary_parts)
            
            match.save()
            return JsonResponse({'data': serialize_match_detail(match)}, status=200)
        except Match.DoesNotExist:
            return JsonResponse({'error': 'Match not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
