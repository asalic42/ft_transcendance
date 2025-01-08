from django.db import models
from django.contrib.auth.models import User

class Users(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)
	name = models.CharField(max_length=150)
	date = models.DateTimeField(auto_now_add=True)
	image = models.CharField(max_length=255, default='static/images/basePP.png')
	status = models.BooleanField(default=True)
	win_nb = models.IntegerField(default=0)
	lose_nb = models.IntegerField(default=0)

	def __str__(self):
		return self.name

class Chans(models.Model):
	id = models.IntegerField(primary_key = True)
	name = models.CharField(max_length = 150)
	invite_link = models.CharField()
	created = models.CharField()

	def __str__(self):
		return self.name

class UserChan(models.Model):
	idChan = models.IntegerField()
	idUser = models.IntegerField()

class Achievements(models.Model):
	id = models.IntegerField(primary_key=True)
	name = models.CharField()
	description = models.CharField()
	icons = models.CharField()

	def __str__(self):
		return self.name

class UserAchievements(models.Model):
	idUser = models.IntegerField()
	idAchievement = models.IntegerField()

class Pong(models.Model):
	id = models.IntegerField(primary_key=True, )
	id_p1 = models.IntegerField()
	id_p2 = models.IntegerField()
	score_p1 = models.IntegerField()
	score_p2 = models.IntegerField()
	date = models.DateTimeField(auto_now_add=True)
	difficulty = models.IntegerField()
	bounce_nb = models.IntegerField()

class Tournaments(models.Model):
	idTournaments = models.IntegerField()
	date = models.DateTimeField(auto_now_add=True)
	nb_of_players = models.IntegerField()

class MatchsTournaments(models.Model):
	idTournaments = models.IntegerField()
	idMatchs = models.IntegerField()

class soloCasseBrique(models.Model):
	id = models.IntegerField(primary_key=True, )
	idPlayer = models.IntegerField()
	idMap = models.IntegerField()
	score = models.IntegerField()
	date = models.DateTimeField(auto_now_add=True)

class Maps(models.Model):
	idMaps = models.IntegerField()
	LinkMaps = models.CharField()

class MultiCasseBrique(models.Model):
	id = models.IntegerField(primary_key=True)
	id_p1 = models.IntegerField()
	id_p2 = models.IntegerField()
	score_p1 = models.IntegerField()
	score_p2 = models.IntegerField()
	date = models.DateTimeField(auto_now_add=True)
	map = models.IntegerField()

class BlockUsers(models.Model):
	idUser = models.IntegerField()
	idBlocked = models.IntegerField()

