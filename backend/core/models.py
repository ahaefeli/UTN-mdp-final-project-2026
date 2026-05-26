from django.db import models
from django.contrib.auth.models import AbstractUser

class Organization(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class User(AbstractUser):
    ROLES = (
        ('ADMIN', 'Admin'),
        ('PLAYER', 'Player'),
        ('COACH', 'Coach'),
        ('REFEREE', 'Referee'),
        ('SCORER', 'Scorer')
    )
    role = models.CharField(max_length=20, choices=ROLES, default='PLAYER')
    phone = models.CharField(max_length=20, null=True, blank=True)
    dni = models.CharField(max_length=20, unique=True, null=True, blank=True)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)

class Club(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)

    def __str__(self):
        return self.name

class Court(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    enabled = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Tournament(models.Model):
    CATEGORIES = (
        ('SUB_14', 'Sub 14'),
        ('SUB_16', 'Sub 16'),
        ('SUB_18', 'Sub 18'),
        ('SUB_21', 'Sub 21'),
        ('PRIMERA', 'Primera'),
        ('MAXI', 'Maxi')
    )
    BRANCHES = (
        ('MALE', 'Male'),
        ('FEMALE', 'Female')
    )
    STATUSES = (
        ('PREPARATION', 'Preparation'),
        ('IN_PROGRESS', 'In Progress'),
        ('FINISHED', 'Finished')
    )
    name = models.CharField(max_length=100)
    year = models.IntegerField()
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORIES)
    branch = models.CharField(max_length=10, choices=BRANCHES)
    status = models.CharField(max_length=20, choices=STATUSES, default='PREPARATION')

    def __str__(self):
        return f"{self.name} - {self.year}"

class Team(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=Tournament.CATEGORIES)
    branch = models.CharField(max_length=10, choices=Tournament.BRANCHES)
    tournament = models.ForeignKey(Tournament, on_delete=models.SET_NULL, null=True, blank=True, related_name='teams')
    coach = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'role': 'COACH'})
    is_deleted = models.BooleanField(default=False)

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
    STATUSES = (
        ('PENDING', 'Pending'),
        ('PLAYING', 'Playing'),
        ('FINISHED', 'Finished')
    )
    tournament_stage = models.ForeignKey(TournamentStage, on_delete=models.CASCADE)
    local_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='local_matches')
    visitor_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='visitor_matches')
    court = models.ForeignKey(Court, on_delete=models.SET_NULL, null=True, blank=True)
    match_datetime = models.DateTimeField(null=True, blank=True)
    referee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='refereed_matches', limit_choices_to={'role': 'REFEREE'})
    scorer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='scored_matches', limit_choices_to={'role': 'SCORER'})
    status = models.CharField(max_length=20, choices=STATUSES, default='PENDING')
    score_summary = models.CharField(max_length=100, blank=True, null=True)

class GameSet(models.Model):
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='sets')
    set_number = models.IntegerField()
    local_points = models.IntegerField(default=0)
    visitor_points = models.IntegerField(default=0)
