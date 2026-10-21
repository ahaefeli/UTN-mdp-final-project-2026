from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_clubregistrationrequest_rejection_reason'),
    ]

    operations = [
        migrations.AddField(
            model_name='clubregistrationrequest',
            name='recipient_label',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
    ]
