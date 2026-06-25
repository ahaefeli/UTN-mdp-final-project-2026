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
        
        # 1. Organization
        org, _ = Organization.objects.get_or_create(name='VoleyHub Central')

        # 2. Usuarios Base (Admin y Jugador)
        admin, _ = User.objects.get_or_create(username='admin_seed', defaults={'email': 'admin@voleyhub.com', 'role': 'ADMIN', 'organization': org})
        if not admin.check_password('123456'):
            admin.set_password('123456')
            admin.save()

        # Generamos jugadores con nombres realistas
        players_data = ['Facundo Dominguez', 'Tomás Alvarez', 'Julieta Romero', 'Agustina Silva', 'Mariano Gomez', 'Luciana Perez']
        for i, name in enumerate(players_data):
            p_username = f'player_{name.split()[0].lower()}'
            p, _ = User.objects.get_or_create(username=p_username, defaults={'email': f'player{i}@voleyhub.com', 'first_name': name, 'role': 'PLAYER', 'organization': org})
            if not p.check_password('123456'):
                p.set_password('123456')
                p.save()

        # 3. Creación masiva de Árbitros, Planilleros y Entrenadores usando listas
        referees_data = ['Marcelo Lora', 'Sergio Gimenez', 'Laura Rodriguez', 'Carlos Ruiz']
        scorers_data = ['Martina Sosa', 'Lucía Fernández', 'Camila Gómez']
        coaches_data = ['Marcos Blanco', 'Esteban Lopez', 'Juan Martin', 'Matias Gonzalez']
        
        referees = []
        for i, name in enumerate(referees_data):
            ref, _ = User.objects.get_or_create(username=f'referee{i}', defaults={'email': f'ref{i}@voleyhub.com', 'first_name': name, 'role': 'REFEREE', 'organization': org})
            ref.set_password('123456')
            ref.save()
            referees.append(ref)

        scorers = []
        for i, name in enumerate(scorers_data):
            scorer, _ = User.objects.get_or_create(username=f'scorer{i}', defaults={'email': f'scorer{i}@voleyhub.com', 'first_name': name, 'role': 'SCORER', 'organization': org})
            scorer.set_password('123456')
            scorer.save()
            scorers.append(scorer)

        coaches = []
        for i, name in enumerate(coaches_data):
            coach, _ = User.objects.get_or_create(username=f'coach{i}', defaults={'email': f'coach{i}@voleyhub.com', 'first_name': name, 'role': 'COACH', 'organization': org})
            coach.set_password('123456')
            coach.save()
            coaches.append(coach)

        # 4. Creación de Clubes y Canchas
        clubs_info = [
            {'name': 'Club Atlético Huracán', 'address': 'Av. 58 3860, Necochea'},
            {'name': 'Club Atlético Rivadavia', 'address': 'Calle 64 2851, Necochea'},
            {'name': 'CAI de Lobería', 'address': 'Sarmiento 150, Lobería'},
            {'name': 'Centro Basko Euzko Etxea', 'address': 'Av. 58 3160, Necochea'},
        ]
        
        clubs = []
        courts = []
        for c_data in clubs_info:
            club, _ = Club.objects.get_or_create(name=c_data['name'], defaults={'organization': org, 'address': c_data['address'], 'is_deleted': False})
            clubs.append(club)
            
            # Le creamos 2 canchas a cada club automáticamente
            court1, _ = Court.objects.get_or_create(name='Cancha Central', club=club, defaults={'enabled': True, 'is_deleted': False})
            court2, _ = Court.objects.get_or_create(name='Cancha Auxiliar', club=club, defaults={'enabled': True, 'is_deleted': False})
            courts.extend([court1, court2])

        # 5. Creación del Torneo
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

        # 6. Creación de Equipos y sus Inscripciones
        teams_info = [
            {'name': 'Huracán Primera', 'club': clubs[0], 'coach': coaches[0]},
            {'name': 'Huracán Sub-21', 'club': clubs[0], 'coach': coaches[0]},
            {'name': 'Rivadavia A', 'club': clubs[1], 'coach': coaches[1]},
            {'name': 'Rivadavia B', 'club': clubs[1], 'coach': coaches[1]},
            {'name': 'CAI Lobería Vóley', 'club': clubs[2], 'coach': coaches[2]},
            {'name': 'Centro Basko Primera', 'club': clubs[3], 'coach': coaches[3]},
        ]
        
        teams = []
        for t_data in teams_info:
            team, _ = Team.objects.get_or_create(name=t_data['name'], defaults={'club': t_data['club'], 'category': 'PRIMERA', 'branch': 'MALE', 'coach': t_data['coach'], 'is_deleted': False})
            teams.append(team)
            TournamentEnrollment.objects.get_or_create(tournament=tournament, team=team)

        # 7. Creación de Fechas (Tournament Stage)
        stage1, _ = TournamentStage.objects.get_or_create(tournament=tournament, name='Fecha 1', defaults={'date': timezone.now().date()})

        # 8. Creación de Partidos (Matches) para la Fecha 1
        matches_data = [
            {'local': teams[0], 'visitor': teams[2], 'court': courts[0], 'referee': referees[0], 'scorer': scorers[0], 'score': '3-0'},
            {'local': teams[4], 'visitor': teams[5], 'court': courts[4], 'referee': referees[1], 'scorer': scorers[1], 'score': '3-1'},
            {'local': teams[1], 'visitor': teams[3], 'court': courts[2], 'referee': referees[2], 'scorer': scorers[2], 'score': '2-3'},
        ]

        sets_mock = {
            "sets": [
                {"set_number": 1, "local_score": 25, "visitor_score": 20},
                {"set_number": 2, "local_score": 25, "visitor_score": 23},
                {"set_number": 3, "local_score": 25, "visitor_score": 15}
            ]
        }

        for m_data in matches_data:
            Match.objects.get_or_create(
                tournament_stage=stage1,
                local_team=m_data['local'],
                visitor_team=m_data['visitor'],
                defaults={
                    'court': m_data['court'],
                    'match_datetime': timezone.now(),
                    'referee': m_data['referee'],
                    'scorer': m_data['scorer'],
                    'status': 'FINISHED',
                    'score_summary': m_data['score'],
                    'sets_data': sets_mock,
                    'is_deleted': False
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database with expanded data.'))