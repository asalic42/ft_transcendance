from django.apps import AppConfig


class HomeSysConfig(AppConfig):
	default_auto_field = 'django.db.models.BigAutoField'
	name = 'home_sys'
	def ready(self):
		try:
			import home_sys.signals  # Importe les signaux
		except ImportError:
			pass

	