# Generated by Django 5.1.4 on 2025-01-30 09:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home_sys', '0002_privatechan'),
    ]

    operations = [
        migrations.AlterField(
            model_name='privatechan',
            name='id_chan',
            field=models.IntegerField(unique=True),
        ),
    ]
