#models.py home_sys

from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

""" USERS """

class Users(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)
	name = models.CharField(max_length = 150)
	pseudo = models.CharField(max_length=100, blank=True, null=True, default='pseudotest')
	date = models.DateTimeField(auto_now_add = True)
	image = models.ImageField(upload_to='profile_pics/', default='profile_pics/basePP.png')
	
	friends = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='user_friends')
	friends_request = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='user_friend_requests')
	blocked = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='user_blocked')

	invite = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='user_invite')
	has_unread_notifications = models.BooleanField(default=False)

	status = models.BooleanField(default=True)  # Ce champ semble déjà utilisé pour autre chose
	is_online = models.BooleanField(default=False)  # Nouveau champ pour le statut de connexion

	win_nb = models.IntegerField(default = 0)
	lose_nb = models.IntegerField(default = 0)

	def __str__(self):
		return self.name
	
	def print_info(self):
		return {
            'name': self.name,
            'pseudo': self.pseudo,
            'date': self.date.strftime('%Y-%m-%d %H:%M:%S'),
            'image': self.image.url if self.image else 'No image',
            'friends': [friend.name for friend in self.friends.all()],
            'friends_request': [request.name for request in self.friends_request.all()],
            'blocked': [blocked.name for blocked in self.blocked.all()],
            'invite': [invite.name for invite in self.invite.all()],
            'has_unread_notifications': self.has_unread_notifications,
            'status': self.status,
            'is_online': self.is_online,
            'win_nb': self.win_nb,
            'lose_nb': self.lose_nb,
        }

""" CHANS """

class Chans(models.Model):
	id = models.AutoField(primary_key = True)
	name = models.CharField(unique = True, max_length = 30)
	invite_link = models.CharField()
	date = models.DateTimeField(auto_now_add = True)
	private = models.BooleanField(default=False)
	def __str__(self):
		return self.name

# class UserChan(models.Model):
# 	idChan = models.IntegerField()
# 	idUser = models.IntegerField()

""" ACHIEVEMENT """

class Achievements(models.Model):
	id = models.AutoField(primary_key = True)
	name = models.CharField()
	description = models.CharField()
	icons = models.CharField()

	def __str__(self):
		return self.name

""" USERACHIEVEMENTS """

class UserAchievements(models.Model):
	idUser = models.IntegerField()
	idAchievement = models.IntegerField()

""" PONG """

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
	color = models.CharField(max_length=50, default='yellow')

""" TOURNAMENTS """

class Tournaments(models.Model):
	id = models.IntegerField(primary_key = True)
	date = models.DateTimeField(auto_now_add = True)
	winner = models.OneToOneField(Users, on_delete=models.CASCADE, related_name='winner', null=True)

""" MATCHSTOURNAMENTS """

class MatchsTournaments(models.Model):
	idTournaments = models.ForeignKey(Tournaments, on_delete=models.CASCADE, related_name='idTournaments')
	idMatchs = models.ForeignKey(Pong, on_delete=models.CASCADE, related_name='idMatchs')

""" SOLOCASSEBRIQUE """

class SoloCasseBrique(models.Model):
	id = models.AutoField(primary_key = True)
	id_player = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='S_CB_games')
	id_map = models.IntegerField()
	score = models.IntegerField()
	date = models.DateTimeField(auto_now_add = True)

""" MAPS """

class Maps(models.Model):
	id = models.AutoField(primary_key=True)
	LinkMaps = models.CharField()

""" MUTLICASSEBRIQUE """

class MultiCasseBrique(models.Model):
	id = models.AutoField(primary_key=True)
	id_p1 = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='M_CB_games_as_p1')
	id_p2 = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='M_CB_games_as_p2')
	winner = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='M_CB_winner')
	score_p1 = models.IntegerField()
	score_p2 = models.IntegerField()
	date = models.DateTimeField(auto_now_add=True)
	map = models.IntegerField()

""" BLOCKUSERS """

class BlockUsers(models.Model):
	idUser = models.IntegerField()
	idBlocked = models.IntegerField()

""" MESSAGES """

class Messages(models.Model):
	id = models.AutoField(primary_key = True)
	channel_name = models.CharField()
	sender = models.CharField()
	idSender = models.IntegerField()
	message = models.CharField(max_length=1000)
	date = models.DateTimeField(auto_now_add = True)
	is_link = models.BooleanField(default = False)
	read = models.BooleanField(null=True)

""" PRIVATECHAN """

class PrivateChan(models.Model):
	id = models.AutoField(primary_key = True)
	id_chan = models.IntegerField(unique = True)
	id_u1 = models.IntegerField()
	id_u2 = models.IntegerField()

""" CURRENTGAME """

class CurrentGame(models.Model):
	game_id = models.IntegerField(unique=True)

""" TOURNAMENTROOM """

class tournament_room(models.Model):
    tournament_id = models.IntegerField(unique=True)


""" USEROPENEDCHANNEL """

class UserOpenedChannel(models.Model):
	user = models.ForeignKey(Users, on_delete=models.CASCADE)
	channel_name = models.CharField(max_length=30)
	opened_at = models.DateTimeField(auto_now_add=True)
	tournament_id = models.IntegerField(unique=True)

""" CASSEBRIQUEROOM """

class casse_brique_room(models.Model):
	game_id = models.IntegerField(unique=True)
	map_id = models.IntegerField(unique=True)
