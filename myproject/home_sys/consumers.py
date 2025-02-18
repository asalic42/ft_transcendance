import json
import asyncio
from collections import defaultdict
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.shortcuts import get_object_or_404
import time
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.exceptions import ChannelFull
from channels.db import database_sync_to_async
from collections import defaultdict
import asyncio
import random
import json
import sys
from .utils import add_pong_logic
from .models import *
import math
from django.shortcuts import render, redirect, get_object_or_404

""" Other functions utils """
def get_player_name(player_values, player_number):
	try:
		for player in player_values:
			if player['number'] == player_number:
				user_id = player.get('user_id')
				user = User.objects.get(id=user_id)
				print('username = ', user.username)
				sys.stdout.flush()
				return user.username
	except User.DoesNotExist:
		return f"Player {player_number}"
	
# Direction aleatoire de la balle 
def get_random_arbitrary(min, max):
	result = random.random() * (max - min) + min
	if result >= -8 and result <= 8:
		return get_random_arbitrary(min, max)
	return result

class PongGame:

	# Define default variables
	def __init__(self):
		self.players = {}
		self.reset_game()
		self.is_running = False
		self.is_over = False
		self.multiplyer = 0
		self.bounce = 0
		self.reported_to_tournament = False  # <-- Nouveau drapeau

	def reset_game(self):
		self.ball = {
			'coords': {'x': 960, 'y': 475},
			'vector': {'vx': get_random_arbitrary(-10, 10), 'vy': get_random_arbitrary(-10, 10)},
			'radius': 13
		}
		self.scores = {'p1': 0, 'p2': 0}
		self.bounce = 0
		for player in self.players.values():
			player_number = player['number']
			player['coords'] =  {
				'x1': 92 if player_number == 1 else 1820,
				'y1': 435,
				'x2': 100 if player_number == 1 else 1828,
				'y2': 515,
				'vy': 30
			}

	# Add player to the game if its possible
	def add_player(self, channel_name, user_id):
		if len(self.players) >= 2:
			return False
		
		player_number = len(self.players) + 1
		if len(self.players) == 1:
			for player in self.players.values():
				if player['number'] == 2:
					player_number = 1
					  
		initial_coords = {
			'x1': 92 if player_number == 1 else 1820,
			'y1': 435,
			'x2': 100 if player_number == 1 else 1828,
			'y2': 515,
			'vy': 10
		}

		self.players[channel_name] = {
			'number': player_number,
			'coords': initial_coords,
			'user_id': user_id
		}
		return True

	# Delete a player from the game
	def remove_player(self, channel_name):
		if channel_name in self.players:
			del self.players[channel_name]
		
	# Update player position in the game
	def update_player_coords(self, channel_name, coords):
		if channel_name in self.players:
			self.players[channel_name]['coords'] = coords

	# Update state of the game (ball/players coords and scores)
	def get_game_state(self):
		player1_coords = None
		player2_coords = None

		if (len(self.players) < 2 and dont_raise == False):
			raise RuntimeError("There has been an error. Sorry for the invonviniance.")

		for player in self.players.values():
			# print(f"player : {player['number']} coords are : {player['coords']}")
			if player['coords'] is None:
				raise RuntimeError("There has been an error. Sorry for the invonviniance.")
			if player['number'] == 1:
				player1_coords = player['coords']
			elif player['number'] == 2:
				player2_coords = player['coords']
		return {
			'ball_coords': self.ball['coords'],
			'player1_coords': player1_coords,
			'player2_coords': player2_coords,
			'scores': self.scores
		}

dont_raise = False
class PongConsumer(AsyncWebsocketConsumer):
		
	games = defaultdict(PongGame)

	@database_sync_to_async
	def add_pong_game(self, data):
		return add_pong_logic(data)

	@database_sync_to_async
	def addTgame(self, pk):
		try:
			tournament = Tournaments.objects.get(id=self.id_t)
			pong_game = Pong.objects.get(id=pk)
			
			new_game = MatchsTournaments.objects.create(
				idTournaments=tournament,
				idMatchs=pong_game
			)

			return new_game

		except Exception as e:
			print(f'ERROR in addTgame: {str(e)}')
			print(f'Error type: {type(e).__name__}')
			import traceback
			print(traceback.format_exc())
			sys.stdout.flush()	

	async def add_pong_serializer(self):
		print('adding game')
		
		try:
			for player in self.game.players.values():
				if player['number'] == 1:
					id_p1 = player['user_id']
				elif player['number'] == 2:
					id_p2 = player['user_id']
	
			
			data = {
				'id_p1': id_p1,
				'id_p2': id_p2,
				'is_bot_game': False,
				'score_p1': self.game.scores['p1'],
				'score_p2': self.game.scores['p2'],
				'difficulty': -1,
				'bounce_nb': self.game.bounce,
			}

			game_data = await self.add_pong_game(data)
			# print(game_data)
			print(f"self.id_t {self.id_t}")
			sys.stdout.flush()
			if (self.id_t != 0):
				# print(f"launching T save, game_data.pk:{game_data['pk']}" )
				# sys.stdout.flush()
				await self.addTgame(game_data['pk'])
				tournament_group = f"tournament_{self.id_t}"
				if self.game.reported_to_tournament is False:
					self.game.reported_to_tournament = True  # Bloquer les doubles envois
					await self.channel_layer.group_send(
						tournament_group,
						{
							'type': 'match_finished',  # Le type définit le nom de la méthode à appeler dans le consumer cible
						}
					)

			await self.send(text_data=json.dumps({
				'type': 'game_created',
				'game': game_data
			}))
		except Exception as e:
			print(str(e))
			## Gère les erreurs (par exemple, envoyer une erreur au client)
			#await self.send(text_data=json.dumps({
			#	'type': 'error',
			#	'message': str(e)
			#}))

	@database_sync_to_async
	def create_current_game(self):
		created = CurrentGame.objects.get_or_create(game_id=self.game_id)
		if created:
			print("game has been added into the database")
		else:
			print("game already exists in the database")
	
	@database_sync_to_async
	def delete_current_game(self):
		# On peut supprimer en filtrant sur game_id
		CurrentGame.objects.filter(game_id=self.game_id).delete()
	
	# Connexion au serveur
	async def connect(self):
		# Récupération de l'ID de la partie depuis l'URL
		self.game_id = self.scope['url_route']['kwargs']['game_id']
		self.id_t = self.scope['url_route']['kwargs']['id_t']
		self.room_group_name = f"game_{self.game_id}"
		self.game = self.games[self.room_group_name]

		if len(self.game.players) >= 2:
			self.close()

		user_id = self.scope['user'].id if self.scope['user'].is_authenticated else None

		# Ajout du joueur à la partie
		if not self.game.add_player(self.channel_name, user_id):
			await self.close()
			return

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		await self.accept()

		player_number = self.game.players[self.channel_name]['number']
		global dont_raise
		dont_raise = True
		initial_state_game = self.game.get_game_state()
		dont_raise = False
			

		await self.send(text_data=json.dumps({
			'type': 'game_state',
			'number': player_number,
			'ball_coords': initial_state_game['ball_coords'],
			'player1_coords': initial_state_game['player1_coords'],
			'player2_coords': initial_state_game['player2_coords'],
			'scores': initial_state_game['scores']
		}))
		if len(self.game.players) == 1 and not self.game.is_running:
			await self.create_current_game()

		if len(self.game.players) == 2 and not self.game.is_running and not self.game.is_over:
			self.game.is_running = True
			await self.delete_current_game()
			await self.send_game_state()
			asyncio.create_task(self.start_game())

	# Deconnexion du serveur
	async def disconnect(self, close_code):
		self.game.is_running = False
		self.game.is_over = True
	
		if self.channel_name in self.game.players:
			player_number = self.game.players[self.channel_name]['number']
			
			# Marquer le perdant
			if player_number == 1:
				self.game.scores['p2'] = 1
			else:
				self.game.scores['p1'] = 1
	
			# Envoyer game_won aux joueurs
			await self.channel_layer.group_send(
				self.room_group_name,
				{"type": "game_won", "loser": player_number}
			)
	
			# Envoyer match_finished au tournoi UNE FOIS SEULEMENT
			if self.id_t != 0 and not self.game.reported_to_tournament:
				self.game.reported_to_tournament = True  # Bloquer les doubles envois
				tournament_group = f"tournament_{self.id_t}"
				await self.channel_layer.group_send(
					tournament_group,
					{"type": "match_finished"}
				)
	
			self.game.remove_player(self.channel_name)
		else:
			print(f"Channel {self.channel_name} already removed from players.")
		
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)
		if len(self.game.players) == 0:
			await self.delete_current_game()
		elif len(self.game.players) == 1:
			await self.create_current_game()
		await self.close()

	# Game win suite a une deconnexion de joueur
	async def game_won(self, event):
		await self.send(text_data=json.dumps({
			'type': 'game_won',
			'loser': event['loser']
		}))

	# Messages recus du client
	async def receive(self, text_data):
		try:
			data = json.loads(text_data)

			if not self.game.is_running:
				await self.receive_restarted(data)
				return
			
			player_number = self.game.players[self.channel_name]['number']
			current_coords = self.game.players[self.channel_name]['coords']

			# Si player == 1 on accepte ses nouvelles coords
			if player_number == 1 and 'player1_coords' in data:
				new_y1 = current_coords['y1'] + (data['player1_coords']['y1'] * self.game.multiplyer)
				new_y1 = max(10, min(new_y1, 860))

				current_coords['y1'] = new_y1
				current_coords['y2'] = new_y1 + 80

			# Si player == 2 on accepte ses nouvelles coords
			elif player_number == 2 and 'player2_coords' in data:
				new_y1 = current_coords['y1'] + (data['player2_coords']['y1'] * self.game.multiplyer)
				new_y1 = max(10, min(new_y1, 860))

				current_coords['y1'] = new_y1
				current_coords['y2'] = new_y1 + 80

			self.game.update_player_coords(self.channel_name, current_coords)
			await self.send_game_state()

		except Exception as e:
			print(f"Erreur inattendue: {str(e)}")
		
	# Message du client lorsque le bouton Replay a ete active
	async def receive_restarted(self, data):
		if (not self.game.is_running and len(self.game.players) == 2):
			try:
				if data['action'] == "restart_game":
					self.game.reset_game()
	
					game_state = None
					try:
						game_state = self.game.get_game_state()
					except RuntimeError:
						await self.send(text_data=json.dumps({'type': 'game_error'}))
					
					self.game.is_running = True
					self.game.is_over = False
					await self.channel_layer.group_send(
						self.room_group_name, {
						'type': 'new_game',
						**game_state
					})
	
					asyncio.create_task(self.start_game())
					return
			except json.JSONDecodeError:
				print("Invalid Error JSON")
				return

	# Envoie des donnees de la game a tous les participants
	async def send_game_state(self):
		try:
			state = self.game.get_game_state()
			await self.channel_layer.group_send(
				self.room_group_name, {
					'type': 'game_update',
					**state
				},
			)
		except RuntimeError:
			await self.send(text_data=json.dumps({'type': 'game_error'}))
			
		except ChannelFull:
			print("Channel full in send_game_state")


	# Envoyer les mises à jour à WebSocket
	async def game_update(self, event):
		await self.send(text_data=json.dumps({
			'type': 'game_state',
			'ball_coords': event['ball_coords'],
			'player1_coords': event['player1_coords'],
			'player2_coords': event['player2_coords'],
			'scores': event['scores']
		}))

	# Envoyer les mises à jour à WebSocket pour un Replay
	async def new_game(self, event):
		await self.send(text_data=json.dumps({
			'type': 'game_restarted',
			'number': self.game.players[self.channel_name]['number'],
			'ball_coords': event['ball_coords'],
			'player1_coords': event['player1_coords'],
			'player2_coords': event['player2_coords'],
			'scores': event['scores']
		}))

	async def get_player_names(self, event):
		await self.send(text_data=json.dumps({
			'type': 'players_name',
			'player1_name': event['player1_name'],
			'player2_name': event['player2_name'],
		}))

	# Compte a rebours avant la game
	async def start_countdown(self, event):
		await self.send(text_data=json.dumps({
			'type': 'countdown',
			'message': event['message']
		}))

	# Debut du jeu
	async def start_game(self):
		
		player1_name = await database_sync_to_async(get_player_name)(self.game.players.values(), 1)
		player2_name = await database_sync_to_async(get_player_name)(self.game.players.values(), 2)

		players_names = {
			'player1_name': player1_name,
			'player2_name': player2_name
		}
		
		await self.channel_layer.group_send(
			self.room_group_name, {
				'type': 'get_player_names',
				**players_names
			},
		)

		update_interval = 0.05
		last_update = asyncio.get_event_loop().time()
		print("\033[0;34m Demarrage du jeu ! \033[0m")
		sys.stdout.flush()

		countdown_messages = ['3', '2', '1', 'Start!']
		for message in countdown_messages:
			if self.game.is_running:
				await self.channel_layer.group_send(
					self.room_group_name, {
						'type': 'start_countdown',
						'message': message
					}
				)
				await asyncio.sleep(1)
			else:
				break

		while self.game.is_running and len(self.game.players) == 2:
			update_interval = 0.016 # 60 FPS
			current_time = asyncio.get_event_loop().time()
			if current_time - last_update >= update_interval:
				ball = self.game.ball

				# Maj ball coords
				ball['coords']['x'] += ball['vector']['vx'] * self.game.multiplyer
				ball['coords']['y'] += ball['vector']['vy'] * self.game.multiplyer

				# Collision ball with wall
				if (ball['coords']['y'] - ball['radius'] <= 0 or
					ball['coords']['y'] + ball['radius'] >= 850):
						ball['vector']['vy'] = -ball['vector']['vy']

				# Collision ball with player
				for player in self.game.players.values():
					coords = player['coords']
					self.game.bounce += 1
					if (player['number'] == 1 and
						ball['coords']['x'] - ball['radius'] >= coords['x1'] and
						ball['coords']['x'] - ball['radius'] <= coords['x2'] + abs(ball['vector']['vx'] * 1.05) and
						ball['coords']['y'] - ball['radius'] <= coords['y2'] + ball['radius'] / 2 and
						ball['coords']['y'] + ball['radius'] >= coords['y1'] - ball['radius'] / 2):

						if ball['vector']['vx'] > -25 and ball['vector']['vx'] < 25:
							ball['vector']['vx'] = abs(ball['vector']['vx']) +1
						else:
							ball['vector']['vx'] = abs(ball['vector']['vx'])


					elif (player['number'] == 2 and
						  ball['coords']['x'] + ball['radius'] >= coords['x1'] - abs(ball['vector']['vx'] *1) and
						  ball['coords']['x'] + ball['radius'] <= coords['x2'] and
						  ball['coords']['y'] - ball['radius'] <= coords['y2'] + ball['radius'] /2 and
						  ball['coords']['y'] + ball['radius'] >= coords['y1'] - ball['radius'] / 2 ):
						
						if ball['vector']['vx'] > -25 and ball['vector']['vx'] < 25:
							ball['vector']['vx'] = -(abs(ball['vector']['vx']) +1)
						else:
							ball['vector']['vx'] = -abs(ball['vector']['vx'])

				# Player add score
				if ball['coords']['x'] + ball['radius'] >= 1920:
					self.game.scores['p1'] += 1
					self.reset_ball(-10)
					for player in self.game.players.values():

						player['coords'] = {
							'x1': 92 if player['number'] == 1 else 1820,
							'y1': 435,
							'x2': 100 if player['number'] == 1 else 1828,
							'y2': 515,
							'vy': 30
						}
				
				elif ball['coords']['x'] - ball['radius'] <= 0:
					self.game.scores['p2'] += 1
					self.reset_ball(10)
					for player in self.game.players.values():

						player['coords'] = {
							'x1': 92 if player['number'] == 1 else 1820,
							'y1': 435,
							'x2': 100 if player['number'] == 1 else 1828,
							'y2': 515,
							'vy': 30
						}

				if self.game.scores['p1'] >= 1 or self.game.scores['p2'] >= 1:
					self.game.is_running = False
					await self.add_pong_serializer()

				try:
					await self.send_game_state()
					elapsed = asyncio.get_event_loop().time() - current_time
					remaining_time = update_interval - elapsed
					self.game.multiplyer = remaining_time / update_interval
					if remaining_time > 0:
						await asyncio.sleep(remaining_time)  # ⬅️ LE SLEEP EST ICI !
				except ChannelFull:
					print("Channel full, skipping update")
				
				last_update = current_time
		
	# Reset de la balle apres chaque score+1
	def reset_ball(self, direction):
		self.game.ball['coords'] = {'x': 960, 'y': 475}
		self.game.ball['vector'] = {'vx': direction, 'vy': get_random_arbitrary(-10, 10)}


""" CASSE BRIQUE GAME MULTIPLAYER """

"""
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
"""

class CasseBriqueGame:
	def __init__(self):
		self.players = {}
		self.health = {'p1': 5, 'p2': 5}
		self.mapTab = None
		# self.block_array = []
		self.reset_game()
		self.map = None
		self.is_running = False
		self.multiplyer = 0
		self.timeleft = 0

	def reset_game(self):
		self.scores = {'p1': 0, 'p2': 0 }
		self.ball = {
			1:{
				'coords' : {'x' : 600 / 2, 'y' : 700 -13},
				'vector' : {'vy' : 9, 'vx' : 9, 'speed': 9},
				'radius' : 13,
				'hit_horizontal' : 0,
				'hit_vertical' : 0,
				'hit_player' : 0
			},
			2: {
				'coords' : {'x' : 600 / 2, 'y' : 700 -13},
				'vector' :{'vy' : 9, 'vx' : 9, 'speed': 9},
				'radius' : 13,
				'hit_horizontal' : 0,
				'hit_vertical' : 0,
				'hit_player' : 0
			}
		}

		for player in self.players.values():
			player_number = player['number']
			player['coords'] =  {
				'x1': 240,
				'y1': 700,
				'x2': 320,
				'y2': 715,
				'vx': 20
			}
			player['block_array'] = []
			

	# Add player to the game if its possible
	def add_player(self, channel_name, user_id):
		if len(self.players) >= 2:
			return False
		
		player_number = len(self.players) +1
		initial_coords = {
			'x1': 240,
			'y1': 700,
			'x2': 320,
			'y2': 715,
			'vx': 20
		}

		self.players[channel_name] = {
			'number': player_number,
			'coords': initial_coords,
			'user_id': user_id,
			'block_array': []
		}
		return True

	@database_sync_to_async
	def fetch_map(self, map_id):
		selected_map = get_object_or_404(Maps, id=map_id)
		try:
			with open(selected_map.LinkMaps, 'r') as file:
				map_data = file.read()
				return {"map": [list(map(int, line)) for line in map_data.split('\n') if line]}
		except FileNotFoundError:
			return {"error": "Carte non trouvée."}


	async def load_map(self, map_id):
		# Cette méthode sera appelée pour charger la map depuis la base de données
		try:
			map_data = await self.fetch_map(map_id)
			if "error" in map_data:
				print(f"Error loading map: {map_data['error']}")
				return False
				
			self.map = map_data["map"]
			# Convertir la map en format pour les blocs
			self.mapTab = []
			for row in self.map:
				self.mapTab.append([int(cell) for cell in row])
			return True
		except Exception as e:
			print(f"Error loading map: {e}")
			return False

	def create_blocks(self, block_array):
		if not self.mapTab:
			print("Warning: No map loaded!")
			return block_array

		start_x = 600 / 8
		start_y = 750 / 24
		x = start_x - 5
		y = start_y - 5
		width = start_x - 5
		height = start_y - 5

		for i in range(6):
			for j in range(12):
				block_array.append({
					"x": x,
					"y": y + start_y + start_y,
					"width": width,
					"height": height,
					"state": self.mapTab[j][i]
				})
				y += start_y
			x += start_x
			y = start_y - 5
		return block_array
	
	# Update player position in the game
	def update_player_coords(self, channel_name, coords):
		if channel_name in self.players:
			self.players[channel_name]['coords'] = coords

	# Update state of the game (ball/players coords and scores)
	def get_game_state(self):
		player1_coords = None
		player2_coords = None
		block_array1 = None
		block_array2 = None

		for player in self.players.values():
			if player['number'] == 1:
				block_array1 = player['block_array']
				player1_coords = player['coords']
			elif player['number'] == 2:
				block_array2 = player['block_array']
				player2_coords = player['coords']

		return {
			'blocks_p1': block_array1,
			'blocks_p2': block_array2,
			'ball_p1': self.ball[1],
			'ball_p2': self.ball[2],
			'player1_coords': player1_coords,
			'player2_coords': player2_coords,
			'scores': self.scores
		}

	def remove_player(self, channel_name):
		if channel_name in self.players:
			del self.players[channel_name]

class CasseBriqueConsumer(AsyncWebsocketConsumer):

	games = defaultdict(CasseBriqueGame)
	
	@database_sync_to_async
	def create_room(self):
		created = casse_brique_room.objects.get_or_create(game_id=self.game_id, map_id=self.map_id)
		if created:
			print("game has been added into the database")
		else:
			print("game already exists in the database")
		sys.stdout.flush()
	
	@database_sync_to_async
	def delete_room(self):
		# On peut supprimer en filtrant sur game_id
		casse_brique_room.objects.filter(game_id=self.game_id).delete()
	
	async def game_won(self, event):
		"""Handler pour le message de type game_won"""
		await self.send(text_data=json.dumps({
			'type': 'game_won',
			'loser': event['loser'],
			'disconnected': event.get('disconnected', False)
		}))

	# Modification de la méthode disconnect pour gérer correctement la déconnexion
	async def disconnect(self, close_code):
		game_was_running = self.game.is_running
		self.game.is_running = False
		self.game.is_over = True
		
		if self.channel_name in self.game.players:
			player_number = self.game.players[self.channel_name]['number']
			loser = player_number
		
			# Sauvegarde du résultat avec le perdant
			await self.save_game_result()
		
			try:
				# Notification aux joueurs
				await self.channel_layer.group_send(
					self.room_group_name,
					{
						'type': 'game_won',
						'loser': loser,
						'disconnected': True
					}
				)
		
				# Fermeture forcée des autres connexions
				await self.channel_layer.group_send(
					self.room_group_name,
					{
						'type': 'close_connection',
						'message': 'Opponent disconnected. You win!'
					}
				)
			except Exception as e:
				print(f"Error sending disconnect messages: {e}")
		
			self.game.remove_player(self.channel_name)
		
		# Nettoyage de la room
		await self.delete_room()
		if self.room_group_name in self.__class__.games:
			del self.__class__.games[self.room_group_name]
		
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)
		await self.close()

	# Nouveau handler pour fermer les connexions
	async def close_connection(self, event):
		await self.send(text_data=json.dumps({
			'type': 'close_connection',
			'message': event['message']
		}))
		await self.close()

	async def connect(self):
		self.game_id = self.scope['url_route']['kwargs']['game_id']
		self.map_id = self.scope['url_route']['kwargs']['map_id']
		self.room_name = f"{self.game_id}"
		self.room_group_name = f"game_{self.room_name}"
		self.game = self.games[self.room_group_name]

		user_id = self.scope['user'].id if self.scope['user'].is_authenticated else None

		if not self.game.add_player(self.channel_name, user_id):
			await self.close()
			return

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)
		await self.accept()

		# Charger la map si ce n'est pas déjà fait
		if not self.game.mapTab:
			default_map_id = 1
			success = await self.game.load_map(self.map_id)
			if not success:
				await self.close()
				return

		# Créer les blocs pour le nouveau joueur
		player = self.game.players[self.channel_name]
		player['block_array'] = self.game.create_blocks([])

		# Envoyer l'état initial
		player_number = player['number']
		initial_state = self.game.get_game_state()
		await self.send(text_data=json.dumps({
			'type': 'game_state',
			'number': player_number,
			'mapData': self.game.mapTab,  # Envoyer la map au client
			**initial_state,
			'time': 0
		}))

		print(f"creating game room, len={len(self.game.players)}")
		sys.stdout.flush()
		if len(self.game.players) == 1:
			await self.create_room()

		if len(self.game.players) == 2 and not self.game.is_running:
			await self.delete_room()
			self.game.is_running = True
			await self.send_game_state(0)
			asyncio.create_task(self.start_game())

	@database_sync_to_async
	def save_game_result(self):
		try:
			id_p1 = None
			id_p2 = None
			
			# Récupération des IDs des joueurs
			for player in self.game.players.values():
				if player['number'] == 1 and player.get('user_id'):
					id_p1 = player['user_id']
				elif player['number'] == 2 and player.get('user_id'):
					id_p2 = player['user_id']
		
			if id_p1 is None or id_p2 is None:
				print(f"Missing player IDs. P1: {id_p1}, P2: {id_p2}")
				return
		
			winner_id = id_p1 if self.game.scores['p1'] > self.game.scores['p2'] else id_p2
			
			game_data = MultiCasseBrique.objects.create(
				id_p1_id=id_p1,
				id_p2_id=id_p2,
				winner_id=winner_id,
				score_p1=self.game.scores['p1'],
				score_p2=self.game.scores['p2'],
				map=1  # Vous pouvez adapter ceci selon votre logique
			)
			print(f"Game saved successfully: {game_data}")
			
		except Exception as e:
			print(f"Error saving game result: {str(e)}")
			# Log plus détaillé de l'erreur
			import traceback
			print(traceback.format_exc())



	async def receive(self, text_data):
		try:

			data = json.loads(text_data)

			if data['type'] == "map_selected":

				chosen_map = data['map']
				self.game.map[self.game.players[self.channel_name]['number']] = chosen_map

				self.game.mapTab = data['mapTab']
				self.game.players[self.channel_name]['block_array'] = self.game.create_blocks(self.game.players[self.channel_name]['block_array'])
			elif data['type'] == "move_player":
				await self.move_player(data)

			elif data['type'] == "restart_game":
				await self.receive_restarted()


		except Exception as e:
			print(f"Erreur inattendue: {str(e)}")

	async def receive_restarted(self):
		try:
			self.game.reset_game()
			for player in self.game.players.values():
				player['block_array'] = self.game.create_blocks(player['block_array'])
			self.game.is_running = True

			game_state = self.game.get_game_state()
			await self.channel_layer.group_send(
				self.room_group_name, {
				'type': 'new_game',
				'time': 60,
				**game_state
			})

			asyncio.create_task(self.start_game())
			return
		except json.JSONDecodeError:
			print("Invalid Error JSON")
			return


	""" """ """ """ """ """ """ """ """ """
	""" Back ball/players/blocks concerns """
	""" """ """ """ """ """ """ """ """ """

	async def move_player(self, data):
		player_number = self.game.players[self.channel_name]['number']
		current_coords = self.game.players[self.channel_name]['coords']

		# Si player == 1 on accepte ses nouvelles coords
		if player_number == 1 and 'player1_coords' in data.get('move', {}):
			new_x1 = current_coords['x1'] + (data['move']['player1_coords']['x1'] * self.game.multiplyer)
			new_x1 = max(10, min(new_x1, 520))

			current_coords['x1'] = new_x1
			current_coords['x2'] = new_x1 + 80

		# Si player == 2 on accepte ses nouvelles coords
		elif player_number == 2 and 'player2_coords' in data.get('move', {}):
			new_x1 = current_coords['x1'] + (data['move']['player2_coords']['x1'] * self.game.multiplyer)
			new_x1 = max(10, min(new_x1, 520))

			current_coords['x1'] = new_x1
			current_coords['x2'] = new_x1 + 80

		self.game.update_player_coords(self.channel_name, current_coords)
		await self.send_game_state(0)

	# Increment the speed of the ball after a collision
	def increment_ball_speed(self, ball_player):
		ball_player['vector']['speed'] += 0.075
		speed_ratio = ball_player['vector']['speed'] / math.sqrt(ball_player['vector']['vx'] ** 2 + ball_player['vector']['vy'] ** 2)
		ball_player['vector']['vx'] *= speed_ratio
		ball_player['vector']['vy'] *= speed_ratio
	
	# Collision ball with walls and top
	def collision_walls_top(self, ball_player):

		# Collision walls right/left
		if (ball_player['coords']['x'] - ball_player['radius'] <= 0 or ball_player['coords']['x'] + ball_player['radius'] >= 600) and ball_player['hit_horizontal'] == 0:
			ball_player['hit_horizontal'] = 1
			ball_player['vector']['vx'] = -ball_player['vector']['vx']
			self.increment_ball_speed(ball_player)
				# Ajuster la position pour que la balle ne colle pas au mur
			if ball_player['coords']['x'] - ball_player['radius'] <= 0:
				ball_player['coords']['x'] = ball_player['radius']
			elif ball_player['coords']['x'] + ball_player['radius'] >= 600:
				ball_player['coords']['x'] = 600 - ball_player['radius']
		
		# Collision avec le plafond
		if ball_player['coords']['y'] - ball_player['radius'] <= 0 and ball_player['hit_vertical'] == 0:
			ball_player['hit_vertical'] = 1
			ball_player['vector']['vy'] = -ball_player['vector']['vy']
			self.increment_ball_speed(ball_player)

			# Ajuster la position pour que la balle ne colle pas au plafond
			ball_player['coords']['y'] = ball_player['radius']
		
		if ball_player['hit_horizontal'] > 0:
			ball_player['hit_horizontal'] += 1
		if ball_player['hit_vertical'] > 0:
			ball_player['hit_vertical'] += 1
		if ball_player['hit_horizontal'] > 5:
			ball_player['hit_horizontal'] = 0
		if ball_player['hit_vertical'] > 5:
			ball_player['hit_vertical'] = 0
		
	# Collision ball with blocks
	def collision_block(self, ball_player, number, block_array):

		for block in block_array:
			if not block["state"]:
				continue
			
			ball_future_x = ball_player['coords']['x'] + ball_player['vector']['vx']
			ball_future_y = ball_player['coords']['y'] + ball_player['vector']['vy']

			if (ball_future_x + ball_player['radius'] >= block["x"] and 
				ball_future_x - ball_player['radius'] <= block["x"] + block["width"] and 
				ball_future_y + ball_player['radius'] >= block["y"] and 
				ball_future_y - ball_player['radius'] <= block["y"] + block["height"]): 

				hit_left_or_right = ball_player['coords']['x'] <= block["x"] or ball_player['coords']['x'] >= block["x"] + block["width"]
				hit_top_or_bottom = ball_player['coords']['y'] <= block["y"] or ball_player['coords']['y'] >= block["y"] + block["height"]

				if hit_left_or_right and hit_top_or_bottom:
					# Collision sur un coin
					ball_player['vector']['vx'] = -ball_player['vector']['vx']
					ball_player['vector']['vy'] = -ball_player['vector']['vy']
				elif hit_left_or_right:
					# Collision sur les côtés gauche/droite
					ball_player['vector']['vx'] = -ball_player['vector']['vx']
					# Ajuster la position
					if ball_player['coords']['x'] <= block["x"]:
						ball_player['coords']['x'] = block["x"] - ball_player['radius']
					else:
						ball_player['coords']['x'] = block["x"] + block["width"] + ball_player['radius']
				elif hit_top_or_bottom:
					# Collision sur les côtés haut/bas
					ball_player['vector']['vy'] = -ball_player['vector']['vy']
					# Ajuster la position
					if ball_player['coords']['y'] <= block["y"]:
						ball_player['coords']['y'] = block["y"] - ball_player['radius']
					else:
						ball_player['coords']['y'] = block["y"] + block["height"] + ball_player['radius']

				self.increment_ball_speed(ball_player)
				block["state"] -= 1
				if number == 1:
					self.game.scores['p1'] += abs(5 - block["state"])
				elif number == 2:
					self.game.scores['p2'] += abs(5 - block["state"])
				return True

		return False

	# look if there is a ball collision with player
	def is_collision_player(self, ball_player, player_coords):
		if ball_player['hit_player'] > 0 and ball_player['hit_player'] < 15:
			ball_player['hit_player'] +=1
			return False

		if ball_player['hit_player'] >= 15:
			ball_player['hit_player'] = 0

		if (ball_player['coords']['x'] + ball_player['radius'] >= player_coords['coords']['x1'] and
			ball_player['coords']['x'] - ball_player['radius'] <= player_coords['coords']['x2'] and
			ball_player['coords']['y'] + ball_player['radius'] >= player_coords['coords']['y1'] and
			ball_player['coords']['y'] - ball_player['radius'] <= player_coords['coords']['y2']):
				ball_player['hit_player'] = 1
				self.increment_ball_speed(ball_player)
				return True
		return False

	def handle_player_collision(self, ball_player, player_coords):
		paddle_width = player_coords['coords']['x2'] - player_coords['coords']['x1']
		intersection = ((ball_player['coords']['x'] - player_coords['coords']['x1']) / paddle_width) * 2 - 1
		ball_player['vector']['vx'] = intersection * abs(ball_player['vector']['vy'])
		ball_player['vector']['vy'] = -abs(ball_player['vector']['vy'])
		
		self.increment_ball_speed(ball_player)

	def move_ball(self, ball_player, number):
		for player in self.game.players.values():
			if player['number'] == number:
				block_array = player['block_array']
				player_coords = player

		steps = 5
		step_x = ball_player['vector']['vx'] * self.game.multiplyer / steps
		step_y = ball_player['vector']['vy'] * self.game.multiplyer / steps

		for step in range(steps):

			ball_player['coords']['x'] += step_x
			ball_player['coords']['y'] += step_y

			collision_occured = False

			if self.is_collision_player(ball_player, player_coords):
				self.handle_player_collision(ball_player, player_coords)
				collision_occured = True
		
			self.collision_walls_top(ball_player)
			if self.collision_block(ball_player, number, block_array):
				collision_occured = True
			
			if collision_occured:
				steps_left = steps - step - 1
				if steps_left > 0:
					step_x = (ball_player['vector']['vx'] * self.game.multiplyer - (steps * (step - 1))) / steps_left
					step_y = (ball_player['vector']['vy'] * self.game.multiplyer - (steps * (step - 1))) / steps_left


	""" """ """ """ """ """ """ """ """ """
	""" Sender Messages"""
	""" """ """ """ """ """ """ """ """ """
	async def send_game_state(self, time):
		try:
			state = self.game.get_game_state()
			await self.channel_layer.group_send(
				self.room_group_name, {
					'type': 'game_update',
					'time': self.game.timeleft,	
					**state
				},
			)
		except ChannelFull:
			print("Channel full in send_game_state")
	
	async def game_update(self, event):
		await self.send(text_data=json.dumps({
			'type': 'game_state',
			'time': event['time'],
			'blocks_p1': event['blocks_p1'],
			'blocks_p2': event['blocks_p2'],
			'ball_p1': event['ball_p1'],
			'ball_p2': event['ball_p2'],
			'player1_coords': event['player1_coords'],
			'player2_coords': event['player2_coords'],
			'scores': event['scores']
		}))
	
	async def game_over(self, event):
		if self.game.scores['p1'] == self.game.scores['p2']:
			winner = 0
		elif self.game.scores['p1'] > self.game.scores['p2']:
			winner = 1
		else:
			winner = 2

		await self.send(text_data=json.dumps({
			'type': 'game_over',
			'winner': winner
		}))

	async def get_player_names(self, event):
		await self.send(text_data=json.dumps({
			'type': 'players_name',
			'player1_name': event['player1_name'],
			'player2_name': event['player2_name'],
		}))

	async def start_countdown(self, event):
		await self.send(text_data=json.dumps({
			'type': 'countdown',
			'message': event['message']
		}))

	# Envoyer les mises à jour à WebSocket pour un Replay
	async def new_game(self, event):
		await self.send(text_data=json.dumps({
			'type': 'game_restarted',
			'time': event['time'],
			'blocks_p1': event['blocks_p1'],
			'blocks_p2': event['blocks_p2'],
			'ball_p1': event['ball_p1'],
			'ball_p2': event['ball_p2'],
			'player1_coords': event['player1_coords'],
			'player2_coords': event['player2_coords'],
			'scores': event['scores']
		}))

	""" """ """ """ """ """ """ """
	""" Start the game """
	""" """ """ """ """ """ """ """
	async def start_game_send(self, event):
		await self.send(text_data=json.dumps({
			'type': 'game_start',
		}))
	
	
	async def start_game(self):

		player1_name = await database_sync_to_async(get_player_name)(self.game.players.values(), 1)
		player2_name = await database_sync_to_async(get_player_name)(self.game.players.values(), 2)

		players_names = {
			'player1_name': player1_name,
			'player2_name': player2_name
		}
		
		await self.channel_layer.group_send(
			self.room_group_name, {
				'type': 'get_player_names',
				**players_names
			},
		)

		await self.send_game_state(0)
		update_interval = 0.05
		last_update = asyncio.get_event_loop().time()
		print("\033[0;34m Demarrage du jeu ! \033[0m")
		sys.stdout.flush()

		await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type': 'start_game_send',
				}
			)
			
		countdown_messages = ['3', '2', '1', 'Start!']
		for message in countdown_messages:
			await self.channel_layer.group_send(
				self.room_group_name, {
					'type': 'start_countdown',
					'message': message
				}
			)
			await asyncio.sleep(1)


		time_left = 60
		start = time.time()
		while self.game.is_running and len(self.game.players) == 2:
			update_interval = 0.016 # 60 FPS
			current_time = asyncio.get_event_loop().time()
			if current_time - last_update >= update_interval:

				ball_p1 = self.game.ball[1]
				ball_p2 = self.game.ball[2]

				self.move_ball(ball_p1, 1)
				self.move_ball(ball_p2, 2)

				# Check if a player lost a life
				self.is_round_end(ball_p1, ball_p2)

				# End of the game
				# if time_left <= 0:
				end = time.time()
				self.game.timeleft = end - start
					
				try:
					await self.send_game_state(0)
					elapsed = asyncio.get_event_loop().time() - current_time
					remaining_time = update_interval - elapsed
					self.game.multiplyer = remaining_time / update_interval
					if remaining_time > 0:
						await asyncio.sleep(remaining_time)  # ⬅️ LE SLEEP EST ICI !
				except ChannelFull:
					print("Channel full, skipping update")
				
				if (self.game.timeleft >= 10):
					await self.save_game_result()
					await self.channel_layer.group_send(
						self.room_group_name, {
							'type': 'game_over'
						}
					)
					self.game.is_running = False
				# await asyncio.sleep(1)
				# time_left -= 1
				last_update = current_time


	# Check si le round est fini pour chaque joueur et en demarre un autre
	def is_round_end(self, ball_p1, ball_p2):

		if ball_p1['coords']['y'] + ball_p1['radius'] >= 750:
			if self.game.scores['p1'] > 5:
				self.game.scores['p1'] -= 5
			self.reset_ball_and_player(ball_p1, 1)
		if ball_p2['coords']['y'] + ball_p2['radius'] >= 750:
			if self.game.scores['p1'] > 5:
				self.game.scores['p2'] -= 5
			self.reset_ball_and_player(ball_p2, 2)
	
	def reset_ball_and_player(self, ball, player_reset):
		ball['coords'] = {'x' : 600 / 2, 'y' : 700 -13}
		ball['vector'] = {'vy' : get_random_arbitrary(-11, 0), 'vx' : get_random_arbitrary(-11, 11), 'speed': 9}
		ball['radius'] = 13
		ball['hit_horizontal'] = 0
		ball['hit_vertical'] = 0
		ball['hit_player'] = 0

		for player in self.game.players.values():
			if player['number'] == player_reset:
				player_update = player

		player_update['coords'] =  {
			'x1': 240,
			'y1': 700,
			'x2': 320,
			'y2': 715,
			'vx': 20
		}

""" Pour le status utilisateur (online/offline) """

"""
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

class StatusConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.user = self.scope['user']
		if self.user.is_authenticated:
			await self.accept()
			await self.channel_layer.group_add("status_updates", self.channel_name)
			logger.info(f"User {self.user.id} connected to WebSocket.")

	async def disconnect(self, close_code):
		if hasattr(self, 'user') and self.user.is_authenticated:
			await self.channel_layer.group_discard("status_updates", self.channel_name)
			logger.info(f"User {self.user.id} disconnected from WebSocket.")

	async def user_status_update(self, event):
		await self.send(text_data=json.dumps({
			"user_id": event["user_id"],
			"is_online": event["is_online"],
		}))
		logger.info(f"Sent status update for user {event['user_id']}: {event['is_online']}")


"""
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
"""

from channels.generic.websocket import AsyncWebsocketConsumer
import json

class FriendRequestConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.user = self.scope['user']
		if self.user.is_authenticated:
			# Associer l'utilisateur à un groupe unique basé sur son ID
			await self.channel_layer.group_add(
				f"user_{self.user.id}",  # Groupe basé sur l'ID de l'utilisateur récepteur
				self.channel_name
			)
			await self.accept()
		else:
			await self.close()

	async def disconnect(self, close_code):
		if self.user.is_authenticated:
			# Lorsque l'utilisateur se déconnecte, quitter le groupe
			await self.channel_layer.group_discard(
				f"user_{self.user.id}",
				self.channel_name
			)

	async def send_friend_request(self, event):
		"""
		Cette méthode reçoit un message du signal et envoie une notification WebSocket
		pour signaler à l'utilisateur récepteur qu'il a une nouvelle demande d'ami.
		"""
		# Envoi de la notification à l'utilisateur récepteur
		await self.send(text_data=json.dumps({
			'type': 'friend_request',  # Type de message, à gérer côté front-end
			'message': 'Vous avez une nouvelle demande d\'ami!',
			'from_user': event['from_user'],  # Nom de l'utilisateur qui a envoyé la demande
		}))


"""
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
"""

from channels.generic.websocket import AsyncWebsocketConsumer
import json

class NotificationConsumer(AsyncWebsocketConsumer):
		
	async def connect(self):
		self.user = self.scope['user']
		if self.user.is_authenticated:
			await self.accept()
			await self.channel_layer.group_add(f"notifications_{self.user.id}", self.channel_name)
			print(f"Utilisateur {self.user.id} ajouté au groupe notifications.")
		else:
			await self.close()

	async def disconnect(self, close_code):
		if self.user.is_authenticated:
			await self.channel_layer.group_discard(f"notifications_{self.user.id}", self.channel_name)

	async def send_notification(self, event):
		await self.send(text_data=json.dumps({
			'type': 'notification',
			'message': event['message'],
		}))

	async def update_notification_status(self, event):
		await self.send(text_data=json.dumps({
			'type': 'update_status',
			'has_unread_notifications': event['has_unread_notifications'],
		}))


"""
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
?------------------------------------------------------------------------------------------------------------------
"""

class TournamentConsumer(AsyncWebsocketConsumer):
	
	players = {}  # Dictionnaire partagé par tournoi (clé = tournament_id, valeur = liste de joueurs)
	is_running = {}
	gameFinished = {}
	roundNb = {}
	tournament_ended = {}
	async def connect(self):
		try:
			print("starting connection process")
			sys.stdout.flush()
			self.tournament_id = self.scope['url_route']['kwargs']['id_t']
			self.tournament_group = f"tournament_{self.tournament_id}"
			
			# Initialiser les structures si elles n'existent pas
			if self.tournament_id not in TournamentConsumer.players:
				TournamentConsumer.players[self.tournament_id] = []
				
			if self.tournament_id not in TournamentConsumer.is_running:
				TournamentConsumer.is_running[self.tournament_id] = False
				
			if self.tournament_id not in TournamentConsumer.gameFinished:
				TournamentConsumer.gameFinished[self.tournament_id] = 0
				
			if self.tournament_id not in TournamentConsumer.roundNb:
				TournamentConsumer.roundNb[self.tournament_id] = 0
			
			if self.tournament_id not in TournamentConsumer.tournament_ended:
				TournamentConsumer.tournament_ended[self.tournament_id] = False
			
			if (len(TournamentConsumer.players[self.tournament_id]) >= 4 or 
				TournamentConsumer.is_running[self.tournament_id]):
				print("closing at len(TournamentConsumer.players[self.tournament_id]")
				sys.stdout.flush()
				await self.close()
				return

			# Ajouter le joueur au groupe
			await self.channel_layer.group_add(self.tournament_group, self.channel_name)
			await self.accept()
			
			# Ajouter ce joueur à la liste partagée
			user_id = self.scope['user'].id if self.scope['user'].is_authenticated else None
			TournamentConsumer.players[self.tournament_id].append({
				'channel_name': self.channel_name,
				'user_id': user_id,
				'username': self.scope['user'].username
			})
			
			print(f"Joueurs connectés au tournoi {self.tournament_id}: {len(TournamentConsumer.players[self.tournament_id])}")
			sys.stdout.flush()
			
			await self.channel_layer.group_send(self.tournament_group, {'type': 'user_list',})

			# Si 1 joueur est connecté pour ce tournoi, ajouter à la listes des rooms
			if len(TournamentConsumer.players[self.tournament_id]) == 1:
				try : 
					if (await self.add_t_room()): # si le tournois est déjà fini
						await self.send(json.dumps({"type": "already"})) #envoyer message pour notif
						await self.disconnect(0) #deco proprement
						await self.close() #close le socket
						return 
					sys.stdout.flush()
				except Exception as e:
					print(f"Erreur lors de l'ajout du tournois dans les rooms disponibles : {str(e)}")
					sys.stdout.flush()
					await self.close()	
					return 
			if (TournamentConsumer.tournament_ended[self.tournament_id]):
				await self.send(json.dumps({"type": "already"})) #envoyer message pour notif
				await self.disconnect(0) #deco proprement
				await self.close() #close le socket
				return 
			# Si 4 joueurs sont connectés pour ce tournoi, lancer le tournoi
			if len(TournamentConsumer.players[self.tournament_id]) == 4:
				try : 
					await self.delete_current_tournament()
					await self.create_t()
				except Exception as e:
					print(f"Erreur lors de la supression du tournoi dans les rooms disponibles : {str(e)}")
					sys.stdout.flush()
				await self.start_tournament()
		except Exception as e:
			print(f"Erreur lors de la connexion : {str(e)}")
			sys.stdout.flush()
			await self.close()
			return 
	
	
	@database_sync_to_async
	def create_t(self):
		created = Tournaments.objects.create(pk=self.tournament_id)
		if created:
			print("game has been added into the database")

	@database_sync_to_async
	def add_t_room(self):
		created = tournament_room.objects.create(tournament_id=self.tournament_id)
		if created:
			print("game has been added into the database")
		try:
			check = Tournaments.objects.get(pk=self.tournament_id)
		except Exception as e:
			print("returning false")
			sys.stdout.flush()
			return False
		print("returning true")
		sys.stdout.flush()
		return True
			
	@database_sync_to_async
	def delete_current_tournament(self):
		tournament_room.objects.filter(tournament_id=self.tournament_id).delete()

	async def start_tournament(self):
		print("starting tournament")
		sys.stdout.flush()
		TournamentConsumer.is_running[self.tournament_id] = True
	
		players = TournamentConsumer.players[self.tournament_id]
	
		# Fixed pairing scheme for 4 players, 3 rounds
		round_pairings = [
			[(players[0], players[1]), (players[2], players[3])],  # Round 1
			[(players[0], players[2]), (players[1], players[3])],  # Round 2
			[(players[0], players[3]), (players[1], players[2])],  # Round 3
		]
		message = f"The matches will be : \n \
		Round 1: {round_pairings[0][0][0]['username']} against {round_pairings[0][0][1]['username']} and {round_pairings[0][1][0]['username']} against {round_pairings[0][1][1]['username']} \n \
		Round 2: {round_pairings[1][0][0]['username']} against {round_pairings[1][0][1]['username']} and {round_pairings[1][1][0]['username']} against {round_pairings[1][1][1]['username']} \n \
		Round 3: {round_pairings[2][0][0]['username']} against {round_pairings[2][0][1]['username']} and {round_pairings[2][1][0]['username']} against {round_pairings[2][1][1]['username']}"

		print(message)
		sys.stdout.flush()
		game_id1 = random.randint(10000, 19999)
		game_id2 = random.randint(10000, 19999)
	
		if TournamentConsumer.roundNb[self.tournament_id] < 3:
			current_round_pairings = round_pairings[TournamentConsumer.roundNb[self.tournament_id]]
	
			for pair_index, pair in enumerate(current_round_pairings):
				game_id = game_id1 if pair_index < 1 else game_id2
				name = [pair[0]['username'], pair[1]['username']]
				index = 0
				for player_in_pair in pair:
					game_link = f"https://transcendance.42.paris/accounts/game-distant/{game_id}/{self.tournament_id}"
					print(f'On envoie le lien "{game_link}" à {player_in_pair["channel_name"]} and round nb is at {TournamentConsumer.roundNb[self.tournament_id]}')
					print(f'name: {name}')
					print(f'name[index]: {name[index]}')
					sys.stdout.flush()
					await self.channel_layer.send(
						player_in_pair['channel_name'],
						{
							'type': 'send_game_link',
							'link': game_link,
							'name_op': name[index],
							'message': message
						}
					)	
					index += 1
		else:
			print("Tournament finished!")
			sys.stdout.flush()
			TournamentConsumer.is_running[self.tournament_id] = False
			# await self.tournament_ending()
			return

	async def send_game_link(self, event):
		try:
			link = event['link']
			await self.send(text_data=json.dumps({
				'type': 'game_link',
				'link': link,
				'name_op': event['name_op'],
				'message': event['message']
			}))
		except 	Exception as e:
			print(f"Erreur lors de l'envoi du lien de jeu : {e}")
			sys.stdout.flush()

	async def disconnect(self, close_code):
		try:
			# Vérifier si le tournament_id existe
			if self.tournament_id in TournamentConsumer.players:
				# Retirer le joueur de la liste
				TournamentConsumer.players[self.tournament_id] = [
					p for p in TournamentConsumer.players[self.tournament_id]
					if p['channel_name'] != self.channel_name
				]
				

				# Si le tournoi est en cours, l'arrêter
				if TournamentConsumer.is_running[self.tournament_id]:
					TournamentConsumer.is_running[self.tournament_id] = False
					await self.channel_layer.group_send(
						self.tournament_group,
						{
							'type': 'tournament_cancelled',
							'message': 'Le tournoi a été annulé en raison d\'une déconnexion'
						}
					)
				
				# Nettoyer les données du tournoi si plus aucun joueur
				if len(TournamentConsumer.players[self.tournament_id]) == 0:
					TournamentConsumer.gameFinished.pop(self.tournament_id, None)
					TournamentConsumer.roundNb.pop(self.tournament_id, None)
					TournamentConsumer.is_running.pop(self.tournament_id, None)
					TournamentConsumer.players.pop(self.tournament_id, None)
					try : 
						await self.delete_current_tournament()
					except Exception as e:
						print(f"Erreur lors de la supression du tournoi dans les rooms disponibles : {str(e)}")
						sys.stdout.flush()
				else:
					await self.channel_layer.group_send(self.tournament_group, {'type': 'user_list',})
			# Retirer le joueur du groupe
			await self.channel_layer.group_discard(self.tournament_group, self.channel_name)
	
			print(f"Joueur déconnecté du tournoi {self.tournament_id}")
			sys.stdout.flush()
	
		except Exception as e:
			print(f"Erreur lors de la déconnexion : {e}")
			sys.stdout.flush()
	
	# Ajouter ces méthodes pour gérer les nouveaux types de messages
	async def player_disconnected(self, event):
		await self.send(text_data=json.dumps({
			'type': 'player_disconnected',
			'message': event['message']
		}))
	
	async def tournament_cancelled(self, event):
		await self.send(text_data=json.dumps({
			'type': 'tournament_cancelled',
			'message': event['message']
		}))
	
	async def user_list(self, event):
		data = []
		if self.tournament_id in TournamentConsumer.players:  # Vérifier si la clé existe
			for player in TournamentConsumer.players[self.tournament_id]:
				data.append(player['username'])
			print(f'sending user_list to {data}')
			sys.stdout.flush()
			await self.send(text_data=json.dumps({
				'type': 'user_list',
				'len': len(data),
				'data': data,
			}))
		else:
			# Gérer le cas où le tournoi n'existe plus
			await self.send(text_data=json.dumps({
				'type': 'user_list',
				'len': 0,
				'data': [],
			}))

	async def match_finished(self, event):
		if self.tournament_id not in self.gameFinished:
			return  # Sécurité
	
		self.gameFinished[self.tournament_id] += 1
		print(f"Matchs terminés : {self.gameFinished[self.tournament_id]}/2")
	
		# Si 2 matches terminés dans ce round
		if self.gameFinished[self.tournament_id] == 8:
			self.gameFinished[self.tournament_id] = 0  # Réinitialiser
			self.roundNb[self.tournament_id] += 1
	
			# Si 3 rounds terminés, fin du tournoi
			if self.roundNb[self.tournament_id] == 3:
				print("Fin du tournoi !")
				await self.tournament_ending()
			else:
				await self.start_tournament()  # Lancer le round suivant

	@database_sync_to_async
	def get_tournament_results(self):
		try:
			tournament = Tournaments.objects.get(pk=self.tournament_id)
			all_games = MatchsTournaments.objects.filter(idTournaments=tournament)

			player_scores = {}
			for game_entry in all_games:
				game = game_entry.idMatchs  # Get the related Pong game
				p1_id = game.id_p1_id
				p2_id = game.id_p2_id

				if p1_id not in player_scores:
					player_scores[p1_id] = {'score': 0, 'name': None}  # Initialize name
				if p2_id not in player_scores:
					player_scores[p2_id] = {'score': 0, 'name': None}  # Initialize name

				player_scores[p1_id]['score'] += game.score_p1
				player_scores[p2_id]['score'] += game.score_p2

				# Fetch names only once per player
				if player_scores[p1_id]['name'] is None:
					p1 = Users.objects.get(pk=p1_id)
					player_scores[p1_id]['name'] = p1.name
				if player_scores[p2_id]['name'] is None:
					p2 = Users.objects.get(pk=p2_id)
					player_scores[p2_id]['name'] = p2.name

			return player_scores

		except Tournaments.DoesNotExist:
			print(f"Tournament {self.tournament_id} not found!")
			return {}
		except Exception as e:
			print(f"Error in get_tournament_results: {e}")
			return {}


	async def tournament_ending(self):
		try:
			player_scores = await self.get_tournament_results()

			if not player_scores:
				print("No scores found for the tournament.")
				sys.stdout.flush()
				TournamentConsumer.is_running[self.tournament_id] = False
				return

			print("Tournament finished. Results:", player_scores)  # Log the results
			sys.stdout.flush()
			TournamentConsumer.is_running[self.tournament_id] = False

			# Send results to all clients
			for player_id, data in player_scores.items():
				await self.channel_layer.group_send(
					self.tournament_group,
					{
						"type": "result",
						"score": data['score'],
						"name": data['name'],
						"player_id": player_id, # Include player ID for frontend use
					}
				)
			TournamentConsumer.tournament_ended[self.tournament_id] = True
		except Exception as e:
			print(f"Error in tournament_ending: {e}")
			sys.stdout.flush()

	async def result(self, event):  # New method to handle 'result' messages
		await self.send(text_data=json.dumps(event))
