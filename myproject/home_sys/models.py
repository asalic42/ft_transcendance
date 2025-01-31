#models.py home_sys

from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

class Users(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)
	name = models.CharField(max_length = 150)
	pseudo = models.CharField(max_length=100, blank=True, null=True, default='pseudotest')
	date = models.DateTimeField(auto_now_add = True)
	image = models.ImageField(upload_to='profile_pics/', default='profile_pics/basePP.png')
	#image = models.CharField(max_length = 255, default = 'static/images/basePP.png')
	status = models.BooleanField(default = True)
	win_nb = models.IntegerField(default = 0)
	lose_nb = models.IntegerField(default = 0)

	def __str__(self):
		return self.name

class Chans(models.Model):
	id = models.AutoField(primary_key = True)
	name = models.CharField(unique=True, max_length = 30)
	invite_link = models.CharField()
	date = models.DateTimeField(auto_now_add = True)
	private = models.BooleanField(default=False)
	def __str__(self):
		return self.name

class UserChan(models.Model):
	idChan = models.IntegerField()
	idUser = models.IntegerField()

class Achievements(models.Model):
	id = models.AutoField(primary_key = True)
	name = models.CharField()
	description = models.CharField()
	icons = models.CharField()

	def __str__(self):
		return self.name

class UserAchievements(models.Model):
	idUser = models.IntegerField()
	idAchievement = models.IntegerField()

class Pong(models.Model):
	id = models.AutoField(primary_key = True)
	id_p1 = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='pong_games_as_p1')
	id_p2 = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='pong_games_as_p2', null=True, blank=True)
	is_bot_game = models.BooleanField(default=False)  # Indique si c'est contre un bot	score_p1 = models.IntegerField()
	score_p1 = models.IntegerField()
	score_p2 = models.IntegerField()
	date = models.DateTimeField(auto_now_add = True)
	difficulty = models.IntegerField()
	bounce_nb = models.IntegerField()    
    

class Tournaments(models.Model):
	idTournaments = models.IntegerField()
	date = models.DateTimeField(auto_now_add = True)
	nb_of_players = models.IntegerField()

class MatchsTournaments(models.Model):
	idTournaments = models.IntegerField()
	idMatchs = models.IntegerField()

class SoloCasseBrique(models.Model):
	id = models.AutoField(primary_key = True)
	id_player = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='S_CB_games')
	id_map = models.IntegerField()
	score = models.IntegerField()
	date = models.DateTimeField(auto_now_add = True)

class Maps(models.Model):
	id = models.AutoField(primary_key=True)
	LinkMaps = models.CharField()

class MultiCasseBrique(models.Model):
	id = models.AutoField(primary_key = True)
	id_p1 = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='M_CB_games_as_p1')
	id_p2 = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='M_CB_games_as_p2')
	score_p1 = models.IntegerField()
	score_p2 = models.IntegerField()
	date = models.DateTimeField(auto_now_add = True)
	map = models.IntegerField()

class BlockUsers(models.Model):
	idUser = models.IntegerField()
	idBlocked = models.IntegerField()

class Messages(models.Model):
	id = models.AutoField(primary_key = True)
	channel_name = models.CharField()
	sender = models.CharField()
	idSender = models.IntegerField()
	message = models.CharField(max_length=1000)
	date = models.DateTimeField(auto_now_add = True)

class PrivateChan(models.Model):
	id = models.AutoField(primary_key = True)
	id_chan = models.IntegerField(unique = True)
	id_u1 = models.IntegerField()
	id_u2 = models.IntegerField()
