from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_team_and_stage_uniqueness'),
    ]

    operations = [
        migrations.AddField(
            model_name='clubregistrationrequest',
            name='rejection_reason',
            field=models.TextField(blank=True, default=''),
        ),
    ]
