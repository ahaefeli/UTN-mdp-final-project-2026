from django.db import models
from django.contrib.auth.models import AbstractUser

class Tenant(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Usuario(AbstractUser):
    ROLES = (
        ('ADMIN', 'Admin'),
        ('PLAYER', 'Player'),
        ('COACH', 'Coach'),
        ('REFEREE', 'Referee'),
        ('SCORER', 'Scorer')
    )
    role = models.CharField(max_length=20, choices=ROLES, default='PLAYER')
    phone = models.CharField(max_length=20, null=True, blank=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.SET_NULL, null=True, blank=True)

class Ciudad(models.Model):
    name = models.CharField(max_length=100)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class Club(models.Model):
    name = models.CharField(max_length=100)
    city = models.ForeignKey(Ciudad, on_delete=models.CASCADE)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class Cancha(models.Model):
    name = models.CharField(max_length=100)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    enabled = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Torneo(models.Model):
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

class Equipo(models.Model):
    name = models.CharField(max_length=100)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    category = models.CharField(max_length=20, choices=Torneo.CATEGORIES)
    branch = models.CharField(max_length=10, choices=Torneo.BRANCHES)
    current_tournament = models.ForeignKey(Torneo, on_delete=models.SET_NULL, null=True, blank=True, related_name='equipos_actuales')
    coach = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'role': 'COACH'})

    def __str__(self):
        return self.name

class InscripcionTorneo(models.Model):
    tournament = models.ForeignKey(Torneo, on_delete=models.CASCADE)
    team = models.ForeignKey(Equipo, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('tournament', 'team')

class FechaTorneo(models.Model):
    tournament = models.ForeignKey(Torneo, on_delete=models.CASCADE)
    date = models.DateField()
    name = models.CharField(max_length=50)

class Partido(models.Model):
    STATUSES = (
        ('PENDING', 'Pending'),
        ('PLAYING', 'Playing'),
        ('FINISHED', 'Finished')
    )
    tournament_date = models.ForeignKey(FechaTorneo, on_delete=models.CASCADE)
    local_team = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='partidos_local')
    visitor_team = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='partidos_visitante')
    court = models.ForeignKey(Cancha, on_delete=models.SET_NULL, null=True, blank=True)
    match_datetime = models.DateTimeField(null=True, blank=True)
    referee = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='partidos_arbitrados', limit_choices_to={'role': 'REFEREE'})
    scorer = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='partidos_planillados', limit_choices_to={'role': 'SCORER'})
    status = models.CharField(max_length=20, choices=STATUSES, default='PENDING')
    score_summary = models.CharField(max_length=100, blank=True, null=True)

class Set(models.Model):
    match = models.ForeignKey(Partido, on_delete=models.CASCADE, related_name='sets')
    set_number = models.IntegerField()
    local_points = models.IntegerField(default=0)
    visitor_points = models.IntegerField(default=0)
