from django.db import migrations, models
from django.utils import timezone


def dedupe_teams(apps, schema_editor):
    Team = apps.get_model('core', 'Team')
    seen = {}
    queryset = Team.objects.filter(is_deleted=False).order_by(
        'club_id', 'name', 'category', 'branch', 'id'
    )
    for team in queryset:
        key = (team.club_id, team.name, team.category, team.branch)
        if key not in seen:
            seen[key] = team
            continue
        team.is_deleted = True
        team.deleted_at = timezone.now()
        team.save(update_fields=['is_deleted', 'deleted_at'])


def dedupe_stages(apps, schema_editor):
    TournamentStage = apps.get_model('core', 'TournamentStage')
    Match = apps.get_model('core', 'Match')
    seen = {}
    for stage in TournamentStage.objects.order_by('tournament_id', 'date', 'id'):
        key = (stage.tournament_id, stage.date)
        if key not in seen:
            seen[key] = stage
            continue
        Match.objects.filter(tournament_stage_id=stage.id).update(
            tournament_stage_id=seen[key].id
        )
        stage.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_clubregistrationrequest_submitted_at'),
    ]

    operations = [
        migrations.RunPython(dedupe_teams, migrations.RunPython.noop),
        migrations.RunPython(dedupe_stages, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='team',
            constraint=models.UniqueConstraint(
                condition=models.Q(('is_deleted', False)),
                fields=('club', 'name', 'category', 'branch'),
                name='unique_active_team_identity',
            ),
        ),
        migrations.AddConstraint(
            model_name='tournamentstage',
            constraint=models.UniqueConstraint(
                fields=('tournament', 'date'),
                name='unique_tournament_stage_date',
            ),
        ),
    ]
