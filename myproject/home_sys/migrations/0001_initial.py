# Generated by Django 5.1.5 on 2025-01-30 15:09

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Achievements',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField()),
                ('description', models.CharField()),
                ('icons', models.CharField()),
            ],
        ),
        migrations.CreateModel(
            name='BlockUsers',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('idUser', models.IntegerField()),
                ('idBlocked', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Chans',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=30, unique=True)),
                ('invite_link', models.CharField()),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('private', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='Maps',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('LinkMaps', models.CharField()),
            ],
        ),
        migrations.CreateModel(
            name='MatchsTournaments',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('idTournaments', models.IntegerField()),
                ('idMatchs', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Messages',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('channel_name', models.CharField()),
                ('sender', models.CharField()),
                ('idSender', models.IntegerField()),
                ('message', models.CharField(max_length=1000)),
                ('date', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='MultiCasseBrique',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('id_p1', models.IntegerField()),
                ('id_p2', models.IntegerField()),
                ('score_p1', models.IntegerField()),
                ('score_p2', models.IntegerField()),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('map', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Pong',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('id_p1', models.IntegerField()),
                ('id_p2', models.IntegerField()),
                ('score_p1', models.IntegerField()),
                ('score_p2', models.IntegerField()),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('difficulty', models.IntegerField()),
                ('bounce_nb', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='PrivateChan',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('id_chan', models.IntegerField(unique=True)),
                ('id_u1', models.IntegerField()),
                ('id_u2', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='SoloCasseBrique',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('id_player', models.IntegerField()),
                ('id_map', models.IntegerField()),
                ('score', models.IntegerField()),
                ('date', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='Tournaments',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('idTournaments', models.IntegerField()),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('nb_of_players', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='UserAchievements',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('idUser', models.IntegerField()),
                ('idAchievement', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='UserChan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('idChan', models.IntegerField()),
                ('idUser', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Users',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150)),
                ('pseudo', models.CharField(blank=True, default='pseudotest', max_length=100, null=True)),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('image', models.ImageField(default='profile_pics/basePP.png', upload_to='profile_pics/')),
                ('status', models.BooleanField(default=True)),
                ('win_nb', models.IntegerField(default=0)),
                ('lose_nb', models.IntegerField(default=0)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
