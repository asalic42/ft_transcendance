# Generated by Django 5.1.4 on 2025-02-18 13:16

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
            name='CurrentGame',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('game_id', models.IntegerField(unique=True)),
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
            name='Messages',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('channel_name', models.CharField()),
                ('sender', models.CharField()),
                ('idSender', models.IntegerField()),
                ('message', models.CharField(max_length=1000)),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('is_link', models.BooleanField(default=False)),
                ('read', models.BooleanField()),
            ],
        ),
        migrations.CreateModel(
            name='Pong',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('is_bot_game', models.BooleanField(default=False)),
                ('score_p1', models.IntegerField()),
                ('score_p2', models.IntegerField()),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('difficulty', models.IntegerField()),
                ('bounce_nb', models.IntegerField()),
                ('color', models.CharField(default='yellow', max_length=50)),
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
            name='tournament_room',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tournament_id', models.IntegerField(unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Tournaments',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('date', models.DateTimeField(auto_now_add=True)),
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
            name='MatchsTournaments',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('idMatchs', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='idMatchs', to='home_sys.pong')),
                ('idTournaments', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='idTournaments', to='home_sys.tournaments')),
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
                ('has_unread_notifications', models.BooleanField(default=False)),
                ('status', models.BooleanField(default=True)),
                ('is_online', models.BooleanField(default=False)),
                ('win_nb', models.IntegerField(default=0)),
                ('lose_nb', models.IntegerField(default=0)),
                ('blocked', models.ManyToManyField(blank=True, related_name='user_blocked', to='home_sys.users')),
                ('friends', models.ManyToManyField(blank=True, related_name='user_friends', to='home_sys.users')),
                ('friends_request', models.ManyToManyField(blank=True, related_name='user_friend_requests', to='home_sys.users')),
                ('invite', models.ManyToManyField(blank=True, related_name='user_invite', to='home_sys.users')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='SoloCasseBrique',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('id_map', models.IntegerField()),
                ('score', models.IntegerField()),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('id_player', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='S_CB_games', to='home_sys.users')),
            ],
        ),
        migrations.AddField(
            model_name='pong',
            name='id_p1',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pong_games_as_p1', to='home_sys.users'),
        ),
        migrations.AddField(
            model_name='pong',
            name='id_p2',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='pong_games_as_p2', to='home_sys.users'),
        ),
        migrations.CreateModel(
            name='MultiCasseBrique',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('score_p1', models.IntegerField()),
                ('score_p2', models.IntegerField()),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('map', models.IntegerField()),
                ('id_p1', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='M_CB_games_as_p1', to='home_sys.users')),
                ('id_p2', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='M_CB_games_as_p2', to='home_sys.users')),
            ],
        ),
    ]
