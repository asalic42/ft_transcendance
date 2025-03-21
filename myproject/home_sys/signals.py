from django.db.models.signals import *
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.core.management import *
from .models import *
from django.db import connection
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.contrib.sessions.models import Session


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


""" @receiver(user_logged_in)
def on_user_logged_in(sender, request, user, **kwargs):
    # Ajouter l'ID de session actuel à la liste des sessions actives
    session_key = request.session.session_key
    if session_key not in user.active_sessions:
        user.active_sessions.append(session_key)
        user.save()

@receiver(user_logged_out)
def on_user_logged_out(sender, request, user, **kwargs):
    # Supprimer toutes les sessions actives pour l'utilisateur
    for session_key in user.active_sessions:
        Session.objects.filter(session_key=session_key).delete()
    user.active_sessions = []
    user.save()
 """