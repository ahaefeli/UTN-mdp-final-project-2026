from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Organization, User, Club, Court, Tournament, Team, TournamentEnrollment, TournamentStage, Match

class Command(BaseCommand):
    help = 'Seed database with mock data for testing'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing database...')
        Match.objects.all().delete()
        TournamentStage.objects.all().delete()
        TournamentEnrollment.objects.all().delete()
        Team.objects.all().delete()
        Tournament.objects.all().delete()
        Court.objects.all().delete()
        Club.objects.all().delete()
        User.objects.all().delete()
        Organization.objects.all().delete()

        self.stdout.write('Seeding database...')
        # Organization
        org, _ = Organization.objects.get_or_create(name='VoleyHub Central')

        # Users
        admin, _ = User.objects.get_or_create(username='admin_seed', defaults={'email': 'admin@voleyhub.com', 'role': 'ADMIN', 'organization': org})
        if not admin.check_password('123456'):
            admin.set_password('123456')
            admin.save()

        player, _ = User.objects.get_or_create(username='player1', defaults={'email': 'player@voleyhub.com', 'role': 'PLAYER', 'organization': org})
        if not player.check_password('123456'):
            player.set_password('123456')
            player.save()

        coach, _ = User.objects.get_or_create(username='coach1', defaults={'email': 'coach@voleyhub.com', 'role': 'COACH', 'organization': org})
        if not coach.check_password('123456'):
            coach.set_password('123456')
            coach.save()

        referee, _ = User.objects.get_or_create(username='referee1', defaults={'email': 'referee@voleyhub.com', 'first_name': 'Neymar', 'role': 'REFEREE', 'organization': org})
        if not referee.check_password('123456'):
            referee.set_password('123456')
            referee.save()

        scorer, _ = User.objects.get_or_create(username='scorer1', defaults={'email': 'scorer@voleyhub.com', 'first_name': 'Pizzero', 'role': 'SCORER', 'organization': org})
        if not scorer.check_password('123456'):
            scorer.set_password('123456')
            scorer.save()

        # Club
        club, _ = Club.objects.get_or_create(name='Club Voleibol Mar del Plata', defaults={'organization': org, 'address': 'Calle Falsa 123', 'is_deleted': False})

        # Courts
        court1, _ = Court.objects.get_or_create(name='Cancha Central', club=club, defaults={'enabled': True, 'is_deleted': False})
        court2, _ = Court.objects.get_or_create(name='Cancha 2', club=club, defaults={'enabled': True, 'is_deleted': False})

        # Tournament
        tournament, _ = Tournament.objects.get_or_create(
            name='Torneo Apertura 2026', 
            year=2026,
            defaults={
                'organization': org,
                'start_date': timezone.now().date(),
                'category': 'PRIMERA',
                'branch': 'MALE',
                'status': 'IN_PROGRESS',
                'is_deleted': False
            }
        )

        # Teams
        team1, _ = Team.objects.get_or_create(name='Los Tigres', defaults={'club': club, 'category': 'PRIMERA', 'branch': 'MALE', 'coach': coach, 'is_deleted': False})
        team2, _ = Team.objects.get_or_create(name='Los Leones', defaults={'club': club, 'category': 'PRIMERA', 'branch': 'MALE', 'coach': coach, 'is_deleted': False})

        # Tournament Enrollment
        TournamentEnrollment.objects.get_or_create(tournament=tournament, team=team1)
        TournamentEnrollment.objects.get_or_create(tournament=tournament, team=team2)

        # Tournament Stage
        stage, _ = TournamentStage.objects.get_or_create(tournament=tournament, name='Fecha 1', defaults={'date': timezone.now().date()})

        # Match
        sets_data = {
            "sets": [
                {"set_number": 1, "local_score": 25, "visitor_score": 20},
                {"set_number": 2, "local_score": 25, "visitor_score": 23},
                {"set_number": 3, "local_score": 25, "visitor_score": 15}
            ]
        }
        Match.objects.get_or_create(
            tournament_stage=stage,
            local_team=team1,
            visitor_team=team2,
            defaults={
                'court': court1,
                'match_datetime': timezone.now(),
                'referee': referee,
                'scorer': scorer,
                'status': 'FINISHED',
                'score_summary': '3-0',
                'sets_data': sets_data,
                'is_deleted': False
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database.'))
