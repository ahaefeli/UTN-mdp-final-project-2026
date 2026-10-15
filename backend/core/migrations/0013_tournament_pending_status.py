from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_clubregistrationrequest_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='match',
            name='status',
            field=models.CharField(choices=[('PENDING', 'Pending'), ('PREPARATION', 'Preparation'), ('CANCELLED', 'Cancelled'), ('IN_PROGRESS', 'In Progress'), ('FINISHED', 'Finished')], default='PREPARATION', max_length=20),
        ),
        migrations.AlterField(
            model_name='tournament',
            name='status',
            field=models.CharField(choices=[('PENDING', 'Pending'), ('PREPARATION', 'Preparation'), ('CANCELLED', 'Cancelled'), ('IN_PROGRESS', 'In Progress'), ('FINISHED', 'Finished')], default='PREPARATION', max_length=20),
        ),
    ]
