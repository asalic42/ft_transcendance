# Generated by Django 5.1.4 on 2025-01-30 13:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home_sys', '0005_alter_messages_message'),
    ]

    operations = [
        migrations.AlterField(
            model_name='messages',
            name='message',
            field=models.CharField(max_length=1000),
        ),
    ]
