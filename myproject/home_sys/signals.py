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
		
@receiver(post_migrate)
def run_after_migrations(sender, **kwargs):
	cursor = connection.cursor()
	cursor.execute("DELETE FROM home_sys_currentgame;")  # Delete tous les channels qui n'ont pas été supprimés (serveur éteint subitement)
	# print("Salon supprimés")
	cursor.execute("SELECT COUNT(*) FROM home_sys_maps;")  # Vérifie si des cartes existent déjà
	count = cursor.fetchone()[0]

	if count == 0:  # Importer les cartes uniquement si la table est vide
		try:
			call_command('importmaps')
			print("Maps importées avec succès après la migration!")
		except Exception as e:
			print(f"Erreur lors de l'importation des maps: {e}")
	else:
		print("Les maps sont déjà importées, aucune action nécessaire.")
	tournament_room.objects.all().delete()
	CurrentGame.objects.all().delete()
	casse_brique_room.objects.all().delete()

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
