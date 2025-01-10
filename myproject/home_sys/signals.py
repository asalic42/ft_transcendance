from django.db.models.signals import *
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.core.management import *
from .models import Users

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
    # Cette fonction sera appelée après chaque migration
    try:
        call_command('importmaps')
        print("Maps importées avec succès après la migration!")
    except Exception as e:
        print(f"Erreur lors de l'importation des maps: {e}")