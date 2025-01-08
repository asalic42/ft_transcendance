from django.apps import AppConfig


class HomeSysConfig(AppConfig):
	default_auto_field = 'django.db.models.BigAutoField'
	name = 'home_sys'
	def ready(self):
		import home_sys.signals 


	