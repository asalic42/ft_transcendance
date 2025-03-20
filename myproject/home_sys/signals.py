from django.db.models.signals import *
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.core.management import *
from .models import *
from django.db import connection


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
	if created:  # Vérifie si l'utilisateur a été créé
		Users.objects.create(user=instance, name=instance.username)  # Crée un nouvel enregistrement dans Users

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
	if hasattr(instance, 'users'):
		instance.users.save()
		
from django.db import connection

@receiver(post_migrate)
def run_after_migrations(sender, **kwargs):
	cursor = connection.cursor()

	# Vérifier si la table existe avant de l'utiliser
	def table_exists(table_name):
		cursor.execute(
			"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name=%s);",
			[table_name],
		)
		return cursor.fetchone()[0]

	try:
		t_room = tournament_room.objects.all()
		if t_room.exists():
			t_room.delete()
	except tournament_room.DoesNotExist:
		print('no tournament_room')

	try:
		c_game = CurrentGame.objects.all()
		if c_game.exists():
			c_game.delete()
	except CurrentGame.DoesNotExist:
		print('no CurrentGame')

	try:
		c_room = casse_brique_room.objects.all()
		if c_room.exists():
			c_room.delete()
	except casse_brique_room.DoesNotExist:
		print('no casse_brique_room')

	# Réinitialiser les statuts de connexion
	try:
		Users.objects.update(is_online=False)
	except Users.DoesNotExist:
		print('no Users')
	print("Tous les statuts de connexion ont été réinitialisés à hors ligne.")

	# Vérifier si la table maps existe avant d'exécuter la requête
	try:
		count = Maps.objects.all().count()

		# Importer les cartes uniquement si la table est vide
		if count == 0:
			try:
				call_command("importmaps")
				print("Maps importées avec succès après la migration!")
			except Exception as e:
				print(f"Erreur lors de l'importation des maps: {e}")
	except Maps.DoesNotExist:
		print('no Maps')

# signals.py
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Users

@receiver(user_logged_in)
def on_user_logged_in(sender, request, user, **kwargs):
	user_profile = Users.objects.get(user=user)
	user_profile.is_online = True
	user_profile.save()

	channel_layer = get_channel_layer()
	async_to_sync(channel_layer.group_send)(
		"status_updates",
		{
			"type": "user_status_update",
			"user_id": user.id,
			"is_online": True,
		},
	)

@receiver(user_logged_out)
def on_user_logged_out(sender, request, user, **kwargs):
	user_profile = Users.objects.get(user=user)
	user_profile.is_online = False
	user_profile.save()

	channel_layer = get_channel_layer()
	async_to_sync(channel_layer.group_send)(
		"status_updates",
		{
			"type": "user_status_update",
			"user_id": user.id,
			"is_online": False,
		},
	)

from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from .models import Users
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
		
@receiver(m2m_changed, sender=Users.friends_request.through)
def send_friend_request_notification(sender, instance, action, **kwargs):
	if action == "post_add":
		# Marquer l'utilisateur comme ayant des notifications non lues
		instance.has_unread_notifications = True
		instance.save()

		# Envoyer la notification via WebSocket
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			f"notifications_{instance.user.id}",
			{
				'type': 'update_notification_status',
				'has_unread_notifications': True,
			}
		)


@receiver(m2m_changed, sender=Users.invite.through)
def send_invite_notification(sender, instance, action, **kwargs):
	if action == "post_add":

		instance.has_unread_notifications = True
		instance.save()
		
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			f"notifications_{instance.user.id}",
			{
				'type': 'update_notification_status',
				'has_unread_notifications': True,

			}
		)
