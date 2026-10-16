from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_tournament_pending_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='clubregistrationrequest',
            name='submitted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
