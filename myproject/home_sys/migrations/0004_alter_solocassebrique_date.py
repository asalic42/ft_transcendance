# Generated by Django 5.0 on 2025-01-09 13:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home_sys', '0003_alter_solocassebrique_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='solocassebrique',
            name='date',
            field=models.DateTimeField(auto_now_add=True),
        ),
    ]
