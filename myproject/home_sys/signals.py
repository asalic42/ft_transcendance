from django.db.models.signals import *
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.core.management import *
from .models import Users
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
