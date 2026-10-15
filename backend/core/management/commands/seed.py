from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import (
    Organization, User, Club, Court, Tournament, Team,
    TournamentEnrollment, TournamentStage, Match, ClubRegistrationRequest
)

class Command(BaseCommand):
    help = 'Seed database with mock data for testing'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing database...')
        ClubRegistrationRequest.objects.all().delete()
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
        
        # 1. Organizacion
        org, _ = Organization.objects.get_or_create(name='VoleyHub Central')

        # 2. Administrador Central (ADMIN)
        admin = User.objects.create(
            username='admin_necochea',
            email='admin@voleyhub.com',
            first_name='Admin',
            last_name='VoleyHub',
            role='ADMIN',
            organization=org,
            phone='2262410001',
            dni='30100001',
            gender='M',
        )
        admin.set_password('123456')
        admin.save()
        self.stdout.write('Admin central creado: admin_necochea')

        # 3. Clubes
        clubs_data = [
            {
                'name': 'Club Atlético Huracán',
                'address': 'Av. 58 3860, Necochea',
                'phone': '2262423321',
                'email': 'contacto@huracannecochea.com.ar',
                'logo': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200'
            },
            {
                'name': 'Club Atlético Rivadavia',
                'address': 'Calle 64 2851, Necochea',
                'phone': '2262451298',
                'email': 'secretaria@rivadavianecochea.com',
                'logo': 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=200'
            },
            {
                'name': 'CAI de Lobería',
                'address': 'Sarmiento 150, Lobería',
                'phone': '2261442010',
                'email': 'cailoberia@outlook.com',
                'logo': 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=200'
            },
            {
                'name': 'Centro Basko Euzko Etxea',
                'address': 'Av. 58 3160, Necochea',
                'phone': '2262432244',
                'email': 'centrobasko@gmail.com',
                'logo': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200'
            },
        ]
        
        clubs = []
        club_map = {}
        courts = {}
        
        for c in clubs_data:
            club = Club.objects.create(
                organization=org,
                name=c['name'],
                address=c['address'],
                phone=c['phone'],
                email=c['email'],
                logo_url=c['logo']
            )
            clubs.append(club)
            club_map[c['name']] = club
            
            # 2 Canchas por club
            court1 = Court.objects.create(name='Cancha Central', club=club, enabled=True)
            court2 = Court.objects.create(name='Cancha Auxiliar', club=club, enabled=True)
            courts[c['name']] = [court1, court2]
            
        self.stdout.write(f'{len(clubs)} Clubes y sus respectivas canchas creados.')

        # 4. Administradores de Clubes (CLUB_ADMIN)
        club_admins_data = [
            {'username': 'claudio_huracan', 'first_name': 'Claudio', 'last_name': 'Valenzuela', 'email': 'claudio.valenzuela@huracannecochea.com', 'club': club_map['Club Atlético Huracán'], 'phone': '2262411001', 'dni': '30110001', 'gender': 'M'},
            {'username': 'roberto_rivadavia', 'first_name': 'Roberto', 'last_name': 'Martinez', 'email': 'roberto.martinez@rivadavianecochea.com', 'club': club_map['Club Atlético Rivadavia'], 'phone': '2262411002', 'dni': '30110002', 'gender': 'M'},
            {'username': 'carlos_loberia', 'first_name': 'Carlos', 'last_name': 'Perez', 'email': 'carlos.perez@cailoberia.com', 'club': club_map['CAI de Lobería'], 'phone': '2262411003', 'dni': '30110003', 'gender': 'M'},
            {'username': 'esteban_basko', 'first_name': 'Esteban', 'last_name': 'Iriarte', 'email': 'esteban.iriarte@centrobasko.com', 'club': club_map['Centro Basko Euzko Etxea'], 'phone': '2262411004', 'dni': '30110004', 'gender': 'M'},
        ]
        
        for ca in club_admins_data:
            user = User.objects.create(
                username=ca['username'],
                first_name=ca['first_name'],
                last_name=ca['last_name'],
                email=ca['email'],
                role='CLUB_ADMIN',
                organization=org,
                club=ca['club'],
                phone=ca['phone'],
                dni=ca['dni'],
                gender=ca['gender'],
            )
            user.set_password('123456')
            user.save()
            
        self.stdout.write('4 Administradores de clubes creados.')

        # 5. Entrenadores (COACH - 2 por club)
        coaches_data = [
            # Huracán
            {'username': 'marcos_blanco', 'first_name': 'Marcos', 'last_name': 'Blanco', 'email': 'mblanco@voleyhub.com', 'club': club_map['Club Atlético Huracán'], 'phone': '2262412001', 'dni': '30120001', 'gender': 'M'},
            {'username': 'agustina_silva', 'first_name': 'Agustina', 'last_name': 'Silva', 'email': 'asilva@voleyhub.com', 'club': club_map['Club Atlético Huracán'], 'phone': '2262412002', 'dni': '30120002', 'gender': 'F'},
            # Rivadavia
            {'username': 'esteban_lopez', 'first_name': 'Esteban', 'last_name': 'Lopez', 'email': 'elopez@voleyhub.com', 'club': club_map['Club Atlético Rivadavia'], 'phone': '2262412003', 'dni': '30120003', 'gender': 'M'},
            {'username': 'sofia_perez', 'first_name': 'Sofia', 'last_name': 'Perez', 'email': 'sperez@voleyhub.com', 'club': club_map['Club Atlético Rivadavia'], 'phone': '2262412004', 'dni': '30120004', 'gender': 'F'},
            # Lobería
            {'username': 'juan_martin', 'first_name': 'Juan', 'last_name': 'Martin', 'email': 'jmartin@voleyhub.com', 'club': club_map['CAI de Lobería'], 'phone': '2262412005', 'dni': '30120005', 'gender': 'M'},
            {'username': 'mariela_gomez', 'first_name': 'Mariela', 'last_name': 'Gomez', 'email': 'mgomez@voleyhub.com', 'club': club_map['CAI de Lobería'], 'phone': '2262412006', 'dni': '30120006', 'gender': 'F'},
            # Centro Basko
            {'username': 'matias_gonzalez', 'first_name': 'Matias', 'last_name': 'Gonzalez', 'email': 'mgonzalez@voleyhub.com', 'club': club_map['Centro Basko Euzko Etxea'], 'phone': '2262412007', 'dni': '30120007', 'gender': 'M'},
            {'username': 'luciana_perez', 'first_name': 'Luciana', 'last_name': 'Perez', 'email': 'lperez@voleyhub.com', 'club': club_map['Centro Basko Euzko Etxea'], 'phone': '2262412008', 'dni': '30120008', 'gender': 'F'},
        ]
        
        coaches = {}
        for co in coaches_data:
            user = User.objects.create(
                username=co['username'],
                first_name=co['first_name'],
                last_name=co['last_name'],
                email=co['email'],
                role='COACH',
                organization=org,
                club=co['club'],
                phone=co['phone'],
                dni=co['dni'],
                gender=co['gender'],
                coach_certificate='https://example.com/certs/coach.pdf'
            )
            user.set_password('123456')
            user.save()
            coaches[co['username']] = user
            
        self.stdout.write('8 Entrenadores creados.')

        # 6. Árbitros (REFEREE)
        referees_data = [
            {'username': 'marcelo_lora', 'first_name': 'Marcelo', 'last_name': 'Lora', 'email': 'mlora@voleyhub.com', 'phone': '2262413001', 'dni': '30130001', 'gender': 'M'},
            {'username': 'sergio_gimenez', 'first_name': 'Sergio', 'last_name': 'Gimenez', 'email': 'sgimenez@voleyhub.com', 'phone': '2262413002', 'dni': '30130002', 'gender': 'M'},
            {'username': 'laura_rodriguez', 'first_name': 'Laura', 'last_name': 'Rodriguez', 'email': 'lrodriguez@voleyhub.com', 'phone': '2262413003', 'dni': '30130003', 'gender': 'F'},
            {'username': 'carlos_ruiz', 'first_name': 'Carlos', 'last_name': 'Ruiz', 'email': 'cruiz@voleyhub.com', 'phone': '2262413004', 'dni': '30130004', 'gender': 'M'},
        ]
        
        referees = []
        for r in referees_data:
            user = User.objects.create(
                username=r['username'],
                first_name=r['first_name'],
                last_name=r['last_name'],
                email=r['email'],
                role='REFEREE',
                organization=org,
                phone=r['phone'],
                dni=r['dni'],
                gender=r['gender'],
            )
            user.set_password('123456')
            user.save()
            referees.append(user)
            
        self.stdout.write('4 Árbitros creados.')

        # 7. Planilleros (SCORER)
        scorers_data = [
            {'username': 'martina_sosa', 'first_name': 'Martina', 'last_name': 'Sosa', 'email': 'msosa@voleyhub.com', 'phone': '2262414001', 'dni': '30140001', 'gender': 'F'},
            {'username': 'lucia_fernandez', 'first_name': 'Lucia', 'last_name': 'Fernandez', 'email': 'lfernandez@voleyhub.com', 'phone': '2262414002', 'dni': '30140002', 'gender': 'F'},
            {'username': 'camila_gomez', 'first_name': 'Camila', 'last_name': 'Gomez', 'email': 'cgomez@voleyhub.com', 'phone': '2262414003', 'dni': '30140003', 'gender': 'F'},
            {'username': 'facundo_alvarez', 'first_name': 'Facundo', 'last_name': 'Alvarez', 'email': 'falvarez@voleyhub.com', 'phone': '2262414004', 'dni': '30140004', 'gender': 'M'},
        ]
        
        scorers = []
        for s in scorers_data:
            user = User.objects.create(
                username=s['username'],
                first_name=s['first_name'],
                last_name=s['last_name'],
                email=s['email'],
                role='SCORER',
                organization=org,
                phone=s['phone'],
                dni=s['dni'],
                gender=s['gender'],
            )
            user.set_password('123456')
            user.save()
            scorers.append(user)
            
        self.stdout.write('4 Planilleros creados.')

        # 8. Jugadores (PLAYER - 12 por club: 6 Hombres, 6 Mujeres)
        male_first_names = ['Lucas', 'Mateo', 'Enzo', 'Joaquin', 'Bautista', 'Santiago', 'Felipe', 'Tomas', 'Nicolas', 'Martin', 'Lautaro', 'Valentin', 'Agustin', 'Francisco', 'Franco']
        female_first_names = ['Julieta', 'Agustina', 'Sofia', 'Valentina', 'Camila', 'Martina', 'Delfina', 'Emilia', 'Lucia', 'Catalina', 'Victoria', 'Juana', 'Zoe', 'Morena', 'Paloma']
        last_names = ['Gomez', 'Gonzalez', 'Rodriguez', 'Fernandez', 'Lopez', 'Diaz', 'Martinez', 'Perez', 'Romero', 'Sanchez', 'Alvarez', 'Ruiz', 'Torres', 'Ramirez', 'Flores', 'Acosta']

        club_players = {}
        player_counter = 1
        
        for club in clubs:
            club_players[club.name] = {'M': [], 'F': []}
            
            # 6 Hombres
            for idx in range(6):
                fname = male_first_names[(player_counter * 3) % len(male_first_names)]
                lname = last_names[(player_counter * 7) % len(last_names)]
                username = f"jugador_{fname.lower()}_{lname.lower()}_{player_counter}"
                p = User.objects.create(
                    username=username,
                    first_name=fname,
                    last_name=lname,
                    email=f"{username}@voleyhub.com",
                    role='PLAYER',
                    organization=org,
                    club=club,
                    gender='M',
                    is_federated=True,
                    dni=f"200000{player_counter:02d}",
                    phone=f"+54922621000{player_counter:02d}",
                    medical_certificate='https://example.com/certs/med.pdf'
                )
                p.set_password('123456')
                p.save()
                club_players[club.name]['M'].append(p)
                player_counter += 1
                
            # 6 Mujeres
            for idx in range(6):
                fname = female_first_names[(player_counter * 3) % len(female_first_names)]
                lname = last_names[(player_counter * 7) % len(last_names)]
                username = f"jugadora_{fname.lower()}_{lname.lower()}_{player_counter}"
                p = User.objects.create(
                    username=username,
                    first_name=fname,
                    last_name=lname,
                    email=f"{username}@voleyhub.com",
                    role='PLAYER',
                    organization=org,
                    club=club,
                    gender='F',
                    is_federated=True,
                    dni=f"200000{player_counter:02d}",
                    phone=f"+54922621000{player_counter:02d}",
                    medical_certificate='https://example.com/certs/med.pdf'
                )
                p.set_password('123456')
                p.save()
                club_players[club.name]['F'].append(p)
                player_counter += 1
                
        self.stdout.write('48 Jugadores (24 masculinos y 24 femeninos) creados.')

        # 9. Torneos
        t_ap_masc = Tournament.objects.create(
            organization=org,
            name='Torneo Apertura Masculino 2026',
            year=2026,
            start_date=timezone.now().date() - timezone.timedelta(days=15),
            end_date=timezone.now().date() + timezone.timedelta(days=60),
            category='PRIMERA',
            branch='MALE',
            status='IN_PROGRESS'
        )
        
        t_ap_fem = Tournament.objects.create(
            organization=org,
            name='Torneo Apertura Femenino 2026',
            year=2026,
            start_date=timezone.now().date() - timezone.timedelta(days=15),
            end_date=timezone.now().date() + timezone.timedelta(days=60),
            category='PRIMERA',
            branch='FEMALE',
            status='IN_PROGRESS'
        )

        t_sub21 = Tournament.objects.create(
            organization=org,
            name='Torneo Juvenil Sub-21 2026',
            year=2026,
            start_date=timezone.now().date() + timezone.timedelta(days=10),
            end_date=timezone.now().date() + timezone.timedelta(days=90),
            category='SUB_21',
            branch='MALE',
            status='PREPARATION'
        )
        
        self.stdout.write('3 Torneos creados (Masculino Primera, Femenino Primera, Sub-21 Masculino).')

        # 10. Equipos e inscripciones
        teams = {}
        
        # Huracán
        teams['huracan_m'] = Team.objects.create(club=club_map['Club Atlético Huracán'], name='Huracán Primera Masculino', category='PRIMERA', branch='MALE', coach=coaches['marcos_blanco'])
        teams['huracan_m'].players.set(club_players['Club Atlético Huracán']['M'])
        teams['huracan_f'] = Team.objects.create(club=club_map['Club Atlético Huracán'], name='Huracán Primera Femenino', category='PRIMERA', branch='FEMALE', coach=coaches['agustina_silva'])
        teams['huracan_f'].players.set(club_players['Club Atlético Huracán']['F'])
        teams['huracan_u21'] = Team.objects.create(club=club_map['Club Atlético Huracán'], name='Huracán Sub-21 Masculino', category='SUB_21', branch='MALE', coach=coaches['marcos_blanco'])
        teams['huracan_u21'].players.set(club_players['Club Atlético Huracán']['M'])

        # Rivadavia
        teams['rivadavia_m'] = Team.objects.create(club=club_map['Club Atlético Rivadavia'], name='Rivadavia Primera Masculino', category='PRIMERA', branch='MALE', coach=coaches['esteban_lopez'])
        teams['rivadavia_m'].players.set(club_players['Club Atlético Rivadavia']['M'])
        teams['rivadavia_f'] = Team.objects.create(club=club_map['Club Atlético Rivadavia'], name='Rivadavia Primera Femenino', category='PRIMERA', branch='FEMALE', coach=coaches['sofia_perez'])
        teams['rivadavia_f'].players.set(club_players['Club Atlético Rivadavia']['F'])

        # Lobería
        teams['loberia_m'] = Team.objects.create(club=club_map['CAI de Lobería'], name='CAI Lobería Masculino', category='PRIMERA', branch='MALE', coach=coaches['juan_martin'])
        teams['loberia_m'].players.set(club_players['CAI de Lobería']['M'])
        teams['loberia_f'] = Team.objects.create(club=club_map['CAI de Lobería'], name='CAI Lobería Femenino', category='PRIMERA', branch='FEMALE', coach=coaches['mariela_gomez'])
        teams['loberia_f'].players.set(club_players['CAI de Lobería']['F'])

        # Centro Basko
        teams['basko_m'] = Team.objects.create(club=club_map['Centro Basko Euzko Etxea'], name='Centro Basko Masculino', category='PRIMERA', branch='MALE', coach=coaches['matias_gonzalez'])
        teams['basko_m'].players.set(club_players['Centro Basko Euzko Etxea']['M'])
        teams['basko_f'] = Team.objects.create(club=club_map['Centro Basko Euzko Etxea'], name='Centro Basko Femenino', category='PRIMERA', branch='FEMALE', coach=coaches['luciana_perez'])
        teams['basko_f'].players.set(club_players['Centro Basko Euzko Etxea']['F'])

        # Inscripciones
        # Masculino Primera
        for key in ['huracan_m', 'rivadavia_m', 'loberia_m', 'basko_m']:
            TournamentEnrollment.objects.create(tournament=t_ap_masc, team=teams[key])
        
        # Femenino Primera
        for key in ['huracan_f', 'rivadavia_f', 'loberia_f', 'basko_f']:
            TournamentEnrollment.objects.create(tournament=t_ap_fem, team=teams[key])

        # U21 Masculino
        TournamentEnrollment.objects.create(tournament=t_sub21, team=teams['huracan_u21'])
        
        self.stdout.write('Equipos creados, rosters asignados e inscripciones a torneos completadas.')

        # 11. Jornadas (Stages) y Partidos (Matches)
        # --- Torneo Apertura Masculino ---
        # Fecha 1 (Terminada)
        stage_m1 = TournamentStage.objects.create(tournament=t_ap_masc, name='Fecha 1', date=timezone.now().date() - timezone.timedelta(days=7))
        
        def volleyball_sets(rows):
            return {
                "sets": [
                    {
                        "set_number": index,
                        "local_score": local,
                        "visitor_score": visitor,
                        "local_points": local,
                        "visitor_points": visitor,
                    }
                    for index, (local, visitor) in enumerate(rows, start=1)
                ]
            }

        sets_3_0 = volleyball_sets([(25, 20), (25, 23), (25, 15)])
        sets_2_3 = volleyball_sets([(25, 22), (21, 25), (25, 18), (19, 25), (13, 15)])
        sets_1_1 = volleyball_sets([(25, 22), (20, 25)])

        # Huracán Masculino vs Rivadavia Masculino
        Match.objects.create(
            tournament_stage=stage_m1,
            local_team=teams['huracan_m'],
            visitor_team=teams['rivadavia_m'],
            court=courts['Club Atlético Huracán'][0], # Cancha Central Huracán
            match_datetime=timezone.now() - timezone.timedelta(days=7),
            referee=referees[0], # marcelo_lora
            scorer=scorers[0], # martina_sosa
            status='FINISHED',
            score_summary='3-0',
            sets_data=sets_3_0
        )

        # CAI Lobería Masculino vs Centro Basko Masculino
        Match.objects.create(
            tournament_stage=stage_m1,
            local_team=teams['loberia_m'],
            visitor_team=teams['basko_m'],
            court=courts['CAI de Lobería'][0], # Cancha Central Loberia
            match_datetime=timezone.now() - timezone.timedelta(days=7),
            referee=referees[1], # sergio_gimenez
            scorer=scorers[1], # lucia_fernandez
            status='FINISHED',
            score_summary='2-3',
            sets_data=sets_2_3
        )

        # Fecha 2 (Futura/En Curso)
        stage_m2 = TournamentStage.objects.create(tournament=t_ap_masc, name='Fecha 2', date=timezone.now().date() + timezone.timedelta(days=2))

        # Huracán vs Lobería (PREPARATION)
        Match.objects.create(
            tournament_stage=stage_m2,
            local_team=teams['huracan_m'],
            visitor_team=teams['loberia_m'],
            court=courts['Club Atlético Huracán'][1], # Cancha Auxiliar
            match_datetime=timezone.now() + timezone.timedelta(days=2),
            referee=referees[0],
            scorer=scorers[0],
            status='PREPARATION'
        )

        # Rivadavia vs Centro Basko (IN_PROGRESS)
        Match.objects.create(
            tournament_stage=stage_m2,
            local_team=teams['rivadavia_m'],
            visitor_team=teams['basko_m'],
            court=courts['Club Atlético Rivadavia'][0],
            match_datetime=timezone.now(),
            referee=referees[2], # laura_rodriguez
            scorer=scorers[2], # camila_gomez
            status='IN_PROGRESS',
            score_summary='1-1',
            sets_data=sets_1_1
        )

        # --- Torneo Apertura Femenino ---
        # Fecha 1 (Terminada)
        stage_f1 = TournamentStage.objects.create(tournament=t_ap_fem, name='Fecha 1', date=timezone.now().date() - timezone.timedelta(days=5))

        sets_1_3 = volleyball_sets([(18, 25), (25, 22), (20, 25), (22, 25)])

        # Huracán Femenino vs Rivadavia Femenino
        Match.objects.create(
            tournament_stage=stage_f1,
            local_team=teams['huracan_f'],
            visitor_team=teams['rivadavia_f'],
            court=courts['Club Atlético Huracán'][0],
            match_datetime=timezone.now() - timezone.timedelta(days=5),
            referee=referees[2],
            scorer=scorers[2],
            status='FINISHED',
            score_summary='1-3',
            sets_data=sets_1_3
        )

        # CAI Lobería Femenino vs Centro Basko Femenino
        Match.objects.create(
            tournament_stage=stage_f1,
            local_team=teams['loberia_f'],
            visitor_team=teams['basko_f'],
            court=courts['CAI de Lobería'][0],
            match_datetime=timezone.now() - timezone.timedelta(days=5),
            referee=referees[3], # carlos_ruiz
            scorer=scorers[3], # facundo_alvarez
            status='FINISHED',
            score_summary='3-0',
            sets_data=sets_3_0
        )

        # Fecha 2 (Futura)
        stage_f2 = TournamentStage.objects.create(tournament=t_ap_fem, name='Fecha 2', date=timezone.now().date() + timezone.timedelta(days=3))

        # Huracán F vs Lobería F (PREPARATION)
        Match.objects.create(
            tournament_stage=stage_f2,
            local_team=teams['huracan_f'],
            visitor_team=teams['loberia_f'],
            court=courts['Club Atlético Huracán'][0],
            match_datetime=timezone.now() + timezone.timedelta(days=3),
            referee=referees[1],
            scorer=scorers[1],
            status='PREPARATION'
        )
        
        self.stdout.write('Partidos y jornadas (finalizados, en progreso y futuros) creados.')

        # 12. Solicitudes de Registro de Clubes
        ClubRegistrationRequest.objects.create(
            organization=org,
            role='CLUB_ADMIN',
            club_name='Club Defensores de Belgrano',
            club_address='Calle 6 1020, Necochea',
            club_phone='2262459911',
            club_email='contacto@defensoresbelgrano.com',
            club_logo_url='https://images.unsplash.com/photo-1461896836934-ffe607ba6851?w=200',
            admin_first_name='Claudio',
            admin_last_name='Valenzuela',
            admin_username='claudio_defensores',
            admin_email='claudio@defensoresbelgrano.com',
            admin_dni='12345678',
            password=make_password('123456'),
            status='PENDING',
            expires_at=timezone.now() + timezone.timedelta(days=7),
            token='token_defensores_pending_123'
        )

        ClubRegistrationRequest.objects.create(
            organization=org,
            role='CLUB_ADMIN',
            club_name='Club Sudamérica Vóley',
            club_address='Av. 75 4402, Necochea',
            club_phone='2262498877',
            club_email='info@sudamericavoley.com',
            club_logo_url='https://images.unsplash.com/photo-1517649763962-0c623066027b?w=200',
            admin_first_name='Roberto',
            admin_last_name='Martinez',
            admin_username='roberto_sudamerica',
            admin_email='roberto@sudamericavoley.com',
            admin_dni='87654321',
            password=make_password('123456'),
            status='APPROVED',
            expires_at=timezone.now() - timezone.timedelta(days=1),
            token='token_sudamerica_approved_456'
        )

        self.stdout.write('2 Solicitudes de registro creadas (Defensores de Belgrano - Pendiente, Sudamérica - Aprobada).')
        self.stdout.write(self.style.SUCCESS('Successfully seeded the database with complete realistic data.'))