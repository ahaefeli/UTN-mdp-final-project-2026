import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

# // Choices --------------------------------------------

class ROLE_CHOICES(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
    CLUB_ADMIN = 'CLUB_ADMIN', 'Club Admin'
    PLAYER = 'PLAYER', 'Player'
    COACH = 'COACH', 'Coach'
    REFEREE = 'REFEREE', 'Referee'
    SCORER = 'SCORER', 'Scorer'

class CATEGORY_CHOICES(models.TextChoices):
    SUB_14 = 'SUB_14', 'Sub 14'
    SUB_16 = 'SUB_16', 'Sub 16'
    SUB_18 = 'SUB_18', 'Sub 18'
    SUB_21 = 'SUB_21', 'Sub 21'
    PRIMERA = 'PRIMERA', 'Primera'
    MAXI = 'MAXI', 'Maxi'

class BRANCH_CHOICES(models.TextChoices):
    MALE = 'MALE', 'Male'
    FEMALE = 'FEMALE', 'Female'

class STATUS_CHOICES(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PREPARATION = 'PREPARATION', 'Preparation'
    CANCELLED = 'CANCELLED', 'Cancelled'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    FINISHED = 'FINISHED', 'Finished'

# // Models --------------------------------------------

class Organization(models.Model):
    """ Tenant - Cada tenant representa una ciudad/Liga """
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name

class User(AbstractUser):
    """ Usuario de una organización: Puede ser ADMIN, PLAYER, COACH, REFEREE, SCORER """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20, null=True, blank=True)
    dni = models.CharField(max_length=20, unique=True, null=True, blank=True)
    medical_certificate = models.URLField(null=True, blank=True)
    coach_certificate = models.URLField(null=True, blank=True)
    
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey('User', on_delete=models.CASCADE, null=True, blank=True, related_name='deleted_users')
    deleted_at = models.DateTimeField(null=True, blank=True)

    gender = models.CharField(max_length=1, choices=[('M', 'Masculino'), ('F', 'Femenino')], null=True, blank=True)
    is_federated = models.BooleanField(default=False)
    club = models.ForeignKey('Club', on_delete=models.SET_NULL, null=True, blank=True)

class Club(models.Model):
    """ Club de un tenant - Puede haber varios clubes dentro de una liga """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    logo_url = models.URLField(max_length=500, null=True, blank=True)
    
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='deleted_clubs')
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class Court(models.Model):
    """ Cancha de un club: Puede estar desactivao (Cancha en reparación, etc.)"""
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    enabled = models.BooleanField(default=True)
    
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='deleted_courts')
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class Tournament(models.Model):
    """ Torneo: Establece una serie de partidos, con configuración determinada (incluyendo fechas) """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    
    name = models.CharField(max_length=100)
    year = models.IntegerField()
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    branch = models.CharField(max_length=10, choices=BRANCH_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PREPARATION')
    best_of = models.PositiveSmallIntegerField(
        default=5,
        choices=[(3, 'Mejor de 3 sets'), (5, 'Mejor de 5 sets')]
    )
    
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='deleted_tournaments')
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.year}"

class Team(models.Model):
    """ Equipo de un club; Puede haber varios equipos de un mismo club;
        Tiene una relación 1:1 con Tournament (Puede estar vinculado a un solo torneo a la vez)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    branch = models.CharField(max_length=10, choices=BRANCH_CHOICES)
    #tournament = models.ForeignKey(Tournament, on_delete=models.SET_NULL, null=True, blank=True, related_name='teams')
    coach = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'role': 'COACH'}, related_name='coached_teams')
    players = models.ManyToManyField(User, related_name='teams_playing', limit_choices_to={'role': 'PLAYER'}, blank=True)
    
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='deleted_teams')
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['club', 'name', 'category', 'branch'],
                condition=models.Q(is_deleted=False),
                name='unique_active_team_identity',
            ),
        ]

class TournamentEnrollment(models.Model):
    """ Join Table entre torneo y equipo
        CONSTRAINT: Un equipo solo puede estar registrado en UN torneo activo;
    """
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('tournament', 'team')

class TournamentStage(models.Model):
    """ Divide el torneo en jornadas (Ej. Playoffs, etc.) """
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    date = models.DateField()
    name = models.CharField(max_length=50)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['tournament', 'date'],
                name='unique_tournament_stage_date',
            ),
        ]

class Match(models.Model):
    """ Establece toda la data de un partido (Equipos que juegan, cancha, fase de torneo, etc.) """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tournament_stage = models.ForeignKey(TournamentStage, on_delete=models.CASCADE)
    local_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='local_matches')
    visitor_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='visitor_matches')
    court = models.ForeignKey(Court, on_delete=models.SET_NULL, null=True, blank=True)
    
    match_datetime = models.DateTimeField(null=True, blank=True)
    referee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='refereed_matches', limit_choices_to={'role': 'REFEREE'})
    scorer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='scored_matches', limit_choices_to={'role': 'SCORER'})
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PREPARATION')
    score_summary = models.CharField(max_length=100, blank=True, null=True)
    # Guarda en un JSON la data de los Sets del partido
    sets_data = models.JSONField(null=True, blank=True)
    
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='deleted_matches')
    deleted_at = models.DateTimeField(null=True, blank=True)


class REQUEST_STATUS_CHOICES(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'


class ClubRegistrationRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, default='CLUB_ADMIN')
    token = models.CharField(max_length=255, unique=True, db_index=True)
    club_name = models.CharField(max_length=255, null=True, blank=True)
    club_address = models.CharField(max_length=255, null=True, blank=True)
    club_phone = models.CharField(max_length=50, null=True, blank=True)
    club_email = models.EmailField(null=True, blank=True)
    admin_first_name = models.CharField(max_length=150, null=True, blank=True)
    admin_last_name = models.CharField(max_length=150, null=True, blank=True)
    admin_email = models.EmailField(null=True, blank=True)
    club_logo_url = models.URLField(max_length=500, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=REQUEST_STATUS_CHOICES.choices,
        default=REQUEST_STATUS_CHOICES.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default='')
    recipient_label = models.CharField(max_length=150, blank=True, default='')
    password = models.CharField(max_length=128, null=True, blank=True)
    admin_username = models.CharField(max_length=150, null=True, blank=True)
    admin_dni = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return f"{self.club_name} - {self.status}"