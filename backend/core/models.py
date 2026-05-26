import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

# // Choices --------------------------------------------

class ROLE_CHOICES(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
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
    PREPARATION = 'PREPARATION', 'Preparation'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    FINISHED = 'FINISHED', 'Finished'

# // Models --------------------------------------------

class Organization(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20, null=True, blank=True)
    dni = models.CharField(max_length=20, unique=True, null=True, blank=True)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey('User', on_delete=models.CASCADE, null=True, blank=True, related_name='deleted_users')
    deleted_at = models.DateTimeField(null=True, blank=True)

class Club(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='deleted_clubs')
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class Court(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    enabled = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='deleted_courts')
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class Tournament(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    year = models.IntegerField()
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    branch = models.CharField(max_length=10, choices=BRANCH_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PREPARATION')
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='deleted_tournaments')
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.year}"

class Team(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    branch = models.CharField(max_length=10, choices=BRANCH_CHOICES)
    tournament = models.ForeignKey(Tournament, on_delete=models.SET_NULL, null=True, blank=True, related_name='teams')
    coach = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'role': 'COACH'}, related_name='coached_teams')
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='deleted_teams')
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class TournamentEnrollment(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('tournament', 'team')

class TournamentStage(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    date = models.DateField()
    name = models.CharField(max_length=50)

class Match(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tournament_stage = models.ForeignKey(TournamentStage, on_delete=models.CASCADE)
    local_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='local_matches')
    visitor_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='visitor_matches')
    court = models.ForeignKey(Court, on_delete=models.SET_NULL, null=True, blank=True)
    match_datetime = models.DateTimeField(null=True, blank=True)
    referee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='refereed_matches', limit_choices_to={'role': 'REFEREE'})
    scorer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='scored_matches', limit_choices_to={'role': 'SCORER'})
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    score_summary = models.CharField(max_length=100, blank=True, null=True)
    sets_data = models.JSONField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='deleted_matches')
    deleted_at = models.DateTimeField(null=True, blank=True)