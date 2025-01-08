from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Users

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
	if created:  # Vérifie si l'utilisateur a été créé
		Users.objects.create(user=instance, name=instance.username)  # Crée un nouvel enregistrement dans Users

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'users'):
        instance.users.save()