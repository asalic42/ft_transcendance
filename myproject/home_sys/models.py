from django.db import models

# Create your models here.
class Users(models.Model):
	id = models.IntegerField(primary_key=True)
	name = models.CharField()
	date = models.CharField()
	image = models.CharField()
	status = models.BooleanField()
	win_nb = models.IntegerField(default=0)  # Or make it nullable
	lose_nb = models.IntegerField(default=0)  # Or make it nullable

class Chans(models.Model):
	id = models.IntegerField(primary_key=True)
	name = models.CharField()
	invite_link = models.CharField()
	created = models.CharField()

class UserChan(models.Model):
	idChan = models.IntegerField()
	idUser = models.IntegerField()

class Achievements(models.Model):
	id = models.IntegerField(primary_key=True)
	name = models.CharField()
	description = models.CharField()
	icons = models.CharField()

class UserAchievements(models.Model):
	idUser = models.IntegerField()
	idAchievement = models.IntegerField()

class Pong(models.Model):
	id_p1 = models.IntegerField()
	id_p2 = models.IntegerField()
	score_p1 = models.IntegerField()
	score_p2 = models.IntegerField()
	date = models.CharField()
	difficulty = models.IntegerField()
	bounce_nb = models.IntegerField()

class Tournaments(models.Model):
	idTournaments = models.IntegerField()
	date = models.CharField()
	nb_of_players = models.IntegerField()

class MatchsTournaments(models.Model):
	idTournaments = models.IntegerField()
	idMatchs = models.IntegerField()

class soloCasseBrique(models.Model):
	id = models.IntegerField(primary_key=True, )
	idMap = models.IntegerField()
	score = models.IntegerField()
	date = models.CharField()

class Maps(models.Model):
	idMaps = models.IntegerField()
	LinkMaps = models.CharField()

class MultiCasseBrique(models.Model):
	id = models.IntegerField(primary_key=True)
	id_p1 = models.IntegerField()
	id_p2 = models.IntegerField()
	score_p1 = models.IntegerField()
	score_p2 = models.IntegerField()
	date = models.CharField()
	map = models.IntegerField()

class BlockUsers(models.Model):
	idUser = models.IntegerField()
	idBlocked = models.IntegerField()

