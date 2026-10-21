from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_clubregistrationrequest_recipient_label'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='photo_url',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
