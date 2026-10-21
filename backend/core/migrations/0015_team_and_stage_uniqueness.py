from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_clubregistrationrequest_submitted_at'),
    ]

    operations = [
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
