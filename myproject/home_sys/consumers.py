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

from .models import *
import math



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
	if result >= -9 and result <= 9:
		return get_random_arbitrary(min, max)
	return result


class PongGame:

	# Define default variables
	def __init__(self):
		self.players = {}
		self.reset_game()
		self.is_running = False
		self.multiplyer = 0

	def reset_game(self):
		self.ball = {
			'coords': {'x': 960, 'y': 475},
			'vector': {'vx': get_random_arbitrary(-10, 10), 'vy': get_random_arbitrary(-10, 10)},
			'radius': 13
		}
		self.scores = {'p1': 0, 'p2': 0}
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
		
		player_number = len(self.players) +1
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
			self.is_running = False
		
	# Update player position in the game
	def update_player_coords(self, channel_name, coords):
		if channel_name in self.players:
			self.players[channel_name]['coords'] = coords

	# Update state of the game (ball/players coords and scores)
	def get_game_state(self):
		player1_coords = None
		player2_coords = None

		for player in self.players.values():
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

class PongConsumer(AsyncWebsocketConsumer):
		
	games = defaultdict(PongGame)

	# Connexion au serveur
	async def connect(self):
		self.room_name = "pong"
		self.room_group_name = f"game_{self.room_name}"
		self.game = self.games[self.room_group_name]
		user_id = self.scope['user'].id if self.scope['user'].is_authenticated else None

		# try to add player
		if not self.game.add_player(self.channel_name, user_id):
			await self.close()
			return

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		await self.accept()

		player_number = self.game.players[self.channel_name]['number']
		initial_state_game = self.game.get_game_state()

		await self.send(text_data=json.dumps({
			'type': 'game_state',
			'number': player_number,
			'ball_coords': initial_state_game['ball_coords'],
			'player1_coords': initial_state_game['player1_coords'],
			'player2_coords': initial_state_game['player2_coords'],
			'scores': initial_state_game['scores']
		}))

		if len(self.game.players) == 2 and not self.game.is_running:
			self.game.is_running = True

			await self.send_game_state()
			asyncio.create_task(self.start_game())

	# Deconnexion du serveur
	async def disconnect(self, close_code):

		loser = self.game.players[self.channel_name]['number']
		await self.channel_layer.group_send(
			self.room_group_name, {
				'type': 'game_won',
				'loser': loser 
			}
		)
		self.game.remove_player(self.channel_name)
		self.game.is_running = False
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)
		print("Player disco")

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
		try:
			if data['action'] == "restart_game":
				self.game.reset_game()
				self.game.is_running = True

				game_state = self.game.get_game_state()

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
			await self.channel_layer.group_send(
				self.room_group_name, {
					'type': 'start_countdown',
					'message': message
				}
			)
			await asyncio.sleep(1)

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
					ball['coords']['y'] + ball['radius'] >= 950):
						ball['vector']['vy'] = -ball['vector']['vy']

				# Collision ball with player
				for player in self.game.players.values():
					coords = player['coords']

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

				if self.game.scores['p1'] >= 5 or self.game.scores['p2'] >= 5:
					self.game.is_running = False

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

class Block:
	def __init__(self, x, y, width, height, state):
		self.x = x
		self.y = y
		self.width = width
		self.height = height
		self.state = state

class CasseBriqueGame:
	def __init__(self):
		self.players = {}
		self.scores = {'p1': 0, 'p2': 0 }
		self.health = {'p1': 5, 'p2': 5}
		self.mapTab = {}
		self.block_array = []
		self.reset_game()
		self.map = None
		self.is_running = False

	def reset_game(self):
		self.ball = {
			1:{
				'coords' : {'x' : 500 / 2, 'y' : 800 - 70 },
				'const_vector' : {'vy' : 9, 'vx' : 9, 'speed': 9},
				'vector' : {},
				'radius' : 13,
				'hit_horizontal' : 0,
				'hit_vertical' : 0,
				'hit_player' : 0
			},
			2: {
				'coords' : {'x' : 1500 / 2, 'y' : 800 - 70 },
				'const_vector' : {'vy' : 9, 'vx' : 9, 'speed': 9},
				'vector' : {},
				'radius' : 13,
				'hit_horizontal' : 0,
				'hit_vertical' : 0,
				'hit_player' : 0
			}
		}
		
		self.ball[1]['vector'] = {
			'vx': self.ball[1]['const_vector']['vx'],
			'vy': self.ball[1]['const_vector']['vy'],
			'total' : self.ball[1]['const_vector']['vy'] + self.ball[1]['const_vector']['vx'],
		}

		self.ball[2]['vector'] = {
			'vx': self.ball[2]['const_vector']['vx'],
			'vy': self.ball[2]['const_vector']['vy'],
			'total' : self.ball[2]['const_vector']['vy'] + self.ball[2]['const_vector']['vx'],
		}

		for player in self.players.values():
			player_number = player['number']
			player['coords'] =  {
				'x1': 690 if player_number == 1 else 1690,
				'y1': 961,
				'x2': 770 if player_number == 1 else 1770,
				'y2': 976,
				'vx': 20
			}

	# Add player to the game if its possible
	def add_player(self, channel_name, user_id):
		if len(self.players) >= 2:
			return False
		
		player_number = len(self.players) +1
		initial_coords = {
			'x1': 690 if player_number == 1 else 1690,
			'y1': 961,
			'x2': 770 if player_number == 1 else 1770,
			'y2': 976,
			'vx': 20
		}

		self.players[channel_name] = {
			'number': player_number,
			'coords': initial_coords,
			'user_id': user_id
		}
		return True

	def create_blocks(self, block_array):

		start_x = 500 / 8
		start_y = 800 / 24
		x = start_x - 5
		y = start_y - 5
		width = start_x - 5
		height = start_y - 5

		for i in range(6):
			for j in range(12):
				block_array.append(Block(x, y + start_y + start_y, width, height, self.mapTab[j][i]))
				y += start_y
			x += start_x
			y = start_y - 5
		return block_array

	# Update state of the game (ball/players coords and scores)
	def get_game_state(self):
		player1_coords = None
		player2_coords = None

		for player in self.players.values():
			if player['number'] == 1:
				player1_coords = player['coords']
			elif player['number'] == 2:
				player2_coords = player['coords']

		return {
			'blocks': self.block_array,
			'ball_p1': self.ball[1]['coords'],
			'ball_p2': self.ball[2]['coords'],
			'player1_coords': player1_coords,
			'player2_coords': player2_coords,
			'scores': self.scores
		}

class CasseBriqueConsumer(AsyncWebsocketConsumer):

	games = defaultdict(CasseBriqueGame)

	async def connect(self):
		self.room_name = "casse-brique"
		self.room_group_name = f"game_{self.room_name}"
		self.game = self.games[self.room_group_name]

		user_id = self.scope['user'].id if self.scope['user'].is_authenticated else None

		# try to add player
		if not self.game.add_player(self.channel_name, user_id):
			await self.close()
			return

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		await self.accept()

		player_number = self.game.players[self.channel_name]['number']
		initial_state_game = self.game.get_game_state()

		await self.send(text_data=json.dumps({
			'type': 'game_state',
			'number': player_number,
			'ball_p1': initial_state_game['ball_p1'],
			'ball_p2': initial_state_game['ball_p2'],
			'player1_coords': initial_state_game['player1_coords'],
			'player2_coords': initial_state_game['player2_coords'],
			'scores': initial_state_game['scores']
		}))

		selected_map = self.game.map if hasattr(self.game, 'map') else None

		if len(self.game.players) == 2 and selected_map and not self.game.is_running:
			self.game.is_running = True

			await self.send_game_state(0)
			asyncio.create_task(self.start_game())
		
	async def disconnect(self, close_code):
		self.game.is_running = False

		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

		print("Player disconnected")

	async def receive(self, text_data):
		data = json.loads(text_data)

		if data['type'] == "map_selected":
			if not hasattr(self.game, 'map'):
				self.game.map = data['map']
				print("MAP choisie")
				sys.stdout.flush()
				self.game.mapTab = data['mapTab']
				self.game.block_array = self.game.create_blocks(block_array=[])

	""" """ """ """ """ """ """ """ """ """
	""" Back ball concerns """
	""" """ """ """ """ """ """ """ """ """

	# Increment the speed of the ball after a collision
	def increment_ball_speed(self, ball_player):
		ball_player['const_vector']['speed'] += 0.075
		speed_ratio = ball_player['const_vector']['speed'] / math.sqrt	(ball_player['const_vector']['vx'] ** 2 + ball_player['const_vector']['vy'] ** 2)
		ball_player['const_vector']['vx'] *= speed_ratio
		ball_player['const_vector']['vy'] *= speed_ratio
		ball_player['vector']['vx'] = ball_player['const_player']['vx']
		ball_player['vector']['vy'] = ball_player['const_player']['vy']
	
	# Collision ball with walls and top
	def collision_walls_top(self, ball_player):

		# Collision walls right/left
		if (ball_player['coords']['x'] - ball_player['radius'] <= 0 or ball_player['coords']['x'] + ball_player['radius'] >= 500) and ball_player['hit_horizontal'] == 0:
			ball_player['hit_horizontal'] = 1
			ball_player['const_vector']['vx'] = -ball_player['const_vector']['vx']
			ball_player['vector']['vx'] = -ball_player['vector']['vx']
			self.increment_ball_speed(ball_player)
				# Ajuster la position pour que la balle ne colle pas au mur
			if ball_player['coords']['x'] - ball_player['radius'] <= 0:
				ball_player['coords']['x'] = ball_player['radius']
			elif ball_player['coords']['x'] + ball_player['radius'] >= 500:
				ball_player['coords']['x'] = 500 - ball_player['radius']
		
		# Collision avec le plafond
		if ball_player['coords']['y'] - ball_player['radius'] <= 0 and ball_player['hit_vertical'] == 0:
			ball_player['hit_vertical'] = 1
			ball_player['const_vector']['vy'] = -ball_player['const_vector']['vy']
			ball_player['vector']['vy'] = ball_player['const_vector']['vy']
			self.increment_ball_speed(ball_player)

			# Ajuster la position pour que la balle ne colle pas au plafond
			ball_player['coords']['y'] = ball_player['radius']
		
	# Collision ball with blocks
	def collision_block(self, ball_player, number):
		for block in range(self.game.block_array.length()):
			if not block.state:
				continue
			
			ball_future_x = ball_player['coords']['x'] + ball_player['const_vector']['vx']
			ball_future_y = ball_player['coords']['y'] + ball_player['const_vector']['vy']


			if ball_future_x + ball_player['radius'] >= block.x and ball_future_x - ball_player['radius'] <= block.x + block.width and ball_future_y + ball_player['radius'] >= block.y and ball_future_y - ball_player['radius'] <= block.y + block.height: 

				hit_left_or_right = ball_player['coords']['x'] <= block.x or ball_player['coords']['x'] >= block.x + block.width
				hit_top_or_bottom = ball_player['coords']['y'] <= block.y or ball_player['coords']['y'] >= block.y + block.height

				if hit_left_or_right and hit_top_or_bottom:
					# Collision sur un coin
					ball_player['const_vector']['vx'] = -ball_player['const_vector']['vx']
					ball_player['const_vector']['vy'] = -ball_player['const_vector']['vy']
				elif hit_left_or_right:
					# Collision sur les côtés gauche/droite
					ball_player['const_vector']['vx'] = -ball_player['const_vector']['vx']
					# Ajuster la position
					if ball_player['coords']['x'] <= block.x:
						ball_player['coords']['x'] = block.x - ball_player['radius']
					else:
						ball_player['coords']['x'] = block.x + block.width + ball_player['radius']
				elif hit_top_or_bottom:
					# Collision sur les côtés haut/bas
					ball_player['const_vector']['vy'] = -ball_player['const_vector']['vy']
					# Ajuster la position
					if ball_player['coords']['y'] <= block.y:
						ball_player['coords']['y'] = block.y - ball_player['radius']
					else:
						ball_player['coords']['y'] = block.y + block.height + ball_player['radius']

				ball_player['vector']['vx'] = ball_player['const_vector']['vx']
				ball_player['vector']['vy'] = ball_player['const_vector']['vy']

				self.increment_ball_speed(ball_player)
				block.state -= 1
				if number == 1:
					self.scores['p1'] += abs(5 - block.state)
				elif number == 2:
					self.scores['p2'] += abs(5 - block.state)
				break

	# look if there is a ball collision with player
	def is_collision_player(self, ball_player, player_coords):
		if ball_player['hit_player'] > 0 and ball_player['hit_player'] < 15:
			ball_player['hit_player'] +=1
			return False

		if ball_player['hit_player'] >= 15:
			ball_player['hit_player'] = 0

		if ball_player['coords']['x'] + ball_player['radius'] / 2 >= player_coords['coords']['x1'] and \
			ball_player['coords']['x'] - ball_player['radius'] / 2 <= player_coords['coords']['x2'] and \
			ball_player['coords']['y'] + ball_player['radius'] >= player_coords['coords']['y1'] and \
			ball_player['coords']['y'] + ball_player['radius'] <= player_coords['coords']['y2']:
				ball_player['hit_player'] = 1
				self.increment_ball_speed(ball_player)
				return True
		return False

	def handle_player_collision(self, ball_player, player_coords):
		intersection = ((player_coords['coords']['x1'] + 60 - ball_player['coords']['x']) / -60)
		ball_player['const_vector']['vx'] = max(-1, min(1, intersection)) * abs(ball_player['const_vector']['vy'])
		ball_player['const_vector']['vy'] = -ball_player['const_vector']['vy']
		self.increment_ball_speed(ball_player)

		ball_player['vector']['vx'] = ball_player['const_vector']['vx']
		ball_player['vector']['vy'] = ball_player['const_vector']['vy']

	def move_ball(self, ball_player, number):
		steps = 5
		step_x = ball_player['vector']['x'] / steps
		step_y = ball_player['vector']['y'] / steps
		player_coords = self.game.players[self.channel_name]

		for step in steps:
			ball_player.coords.x += step_x
			ball_player.coords.y += step_y

			if self.is_collision_player(ball_player, player_coords):
				self.handle_player_collision(ball_player, player_coords)
		
			self.collision_walls_top(ball_player)
			self.collision_block(ball_player, number)

	""" """ """ """ """ """ """ """ """ """
	""" Sender Messages"""
	""" """ """ """ """ """ """ """ """ """
	async def send_game_state(self, time):
		try:
			state = self.game.get_game_state()
			await self.channel_layer.group_send(
				self.room_group_name, {
					'type': 'game_update',
					'time': time,
					**state
				},
			)
		except ChannelFull:
			print("Channel full in send_game_state")
	
	async def game_update(self, event):
		await self.send(text_data=json.dumps({
			'type': 'game_state',
			'time': event['time'],
			'blocks': event['blocks'],
			'ball_p1': event['ball_p1'],
			'ball_p2': event['ball_p2'],
			'player1_coords': event['player1_coords'],
			'player2_coords': event['player2_coords'],
			'scores': event['scores']
		}))
	
	async def game_over(self, event):
		await self.send(text_data=json.dumps({
			'type': 'game_over'
		}))

	""" """ """ """ """ """ """ """
	""" Start the game """
	""" """ """ """ """ """ """ """
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
			await self.channel_layer.group_send(
				self.room_group_name, {
					'type': 'start_countdown',
					'message': message
				}
			)
			await asyncio.sleep(1)
		
		time_left = 60
		while self.game.is_running and len(self.game.players) == 2:
			update_interval = 0.016 # 60 FPS
			current_time = asyncio.get_event_loop().time()
			if current_time - last_update >= update_interval:

				ball_p1 = self.game.ball[1]
				ball_p2 = self.game.ball[2]

				# Maj ball coords p1
				ball_p1['coords']['x'] += ball_p1['vector']['vx'] * self.game.multiplyer
				ball_p1['coords']['y'] += ball_p1['vector']['vy'] * self.game.multiplyer

				# Maj ball coords p2
				ball_p2['coords']['x'] += ball_p2['vector']['vx'] * self.game.multiplyer
				ball_p2['coords']['y'] += ball_p2['vector']['vy'] * self.game.multiplyer


				self.move_ball(ball_p1, 1)
				self.move_ball(ball_p2, 2)

				# Check if a player lost a life
				self.is_round_end(ball_p1, ball_p2)

				# End of the game
				if time_left <= 0:
					await self.channel_layer.group_send(
						self.room_group_name, {
							'type': 'game_over'
						}
					)
					self.game.is_running = False
				
				try:
					await self.send_game_state(time_left)
					elapsed = asyncio.get_event_loop().time() - current_time
					remaining_time = update_interval - elapsed
					self.game.multiplyer = remaining_time / update_interval
					if remaining_time > 0:
						await asyncio.sleep(remaining_time)  # ⬅️ LE SLEEP EST ICI !
				except ChannelFull:
					print("Channel full, skipping update")
				
				await asyncio.sleep(1)
				time_left -= 1
				last_update = current_time


	# Check si le round est fini pour chaque joueur et en demarre un autre
	def is_round_end(self, ball_p1, ball_p2):
		if ball_p1['coords']['y'] + ball_p1['radius'] >= 800:
			if self.game.scores['p1'] > 5:
				self.game.scores['p1'] -= 5
			self.game.reset_game()
		if ball_p2['coords']['y'] + ball_p2['radius'] >= 800:
			if self.game.scores['p1'] > 5:
				self.game.scores['p2'] -= 5
			self.game.reset_game()
