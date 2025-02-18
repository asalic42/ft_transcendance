from django.core.management.base import BaseCommand
from home_sys.models import *

class Command(BaseCommand):
	help = 'Importe des cartes dans la base de données'

	def handle(self, *args, **kwargs):
		# Liste des cartes à importer
		maps = [
			{"LinkMaps": "home_sys/static/maps/map1.txt"},
			{"LinkMaps": "home_sys/static/maps/map2.txt"},
			{"LinkMaps": "home_sys/static/maps/map3.txt"},
		]

		# Importation dans la base de données
		for map_data in maps:
			Maps.objects.get_or_create(LinkMaps=map_data["LinkMaps"])
			self.stdout.write(self.style.SUCCESS(f'Carte "{map_data["LinkMaps"]}" importée avec succès !'))
