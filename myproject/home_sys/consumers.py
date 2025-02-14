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


class PongGame:

	# Define default variables
	def __init__(self):
		self.players = {}
		self.reset_game()
		self.is_running = False
		self.is_over = False
		self.multiplyer = 0
		self.bounce = 0

	def reset_game(self):
		self.ball = {
			'coords': {'x': 960, 'y': 475},
			'vector': {'vx': self.get_random_arbitrary(-10, 10), 'vy': self.get_random_arbitrary(-10, 10)},
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

	# Direction aleatoire de la balle 
	def get_random_arbitrary(self, min, max):
		result = random.random() * (max - min) + min
		if result >= -9 and result <= 9:
			return self.get_random_arbitrary(min, max)
		return result

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
			if (self.id_t != -1):
				# print(f"launching T save, game_data.pk:{game_data['pk']}" )
				# sys.stdout.flush()
				await self.addTgame(game_data['pk'])

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
		game, created = CurrentGame.objects.get_or_create(game_id=self.game_id)
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
			if player_number == 1:
				self.game.scores['p2'] = 1
			elif player_number == 2:
				self.game.scores['p1'] = 1
	
			loser = player_number
			
			await self.send_game_state()
			await self.channel_layer.group_send(
				self.room_group_name, {
					'type': 'game_won',
					'loser': loser 
				}
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
		
		player1_name = await database_sync_to_async(self.get_player_name)(1)
		player2_name = await database_sync_to_async(self.get_player_name)(2)

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
		self.game.ball['vector'] = {'vx': direction, 'vy': self.game.get_random_arbitrary(-10, 10)}

	def get_player_name(self, player_number):
		try:
			for player in self.game.players.values():
				if player['number'] == player_number:
					user_id = player.get('user_id')
					user = User.objects.get(id=user_id)
					print('username = ', user.username)
					sys.stdout.flush()
					return user.username
		except User.DoesNotExist:
			return f"Player {player_number}"

    # def get_player_name(self, player_number):
    #     for player in self.game.players.values():
    #         if player['number'] == player_number:
    #             user_id = player.get('user_id')
    #             try:
    #                 user = User.objects.get(id=user_id)
    #                 return user.username
    #             except User.DoesNotExist:
    #                 return f"Player {player_number}"
    #     return f"Player {player_number}"


""" Pour le status utilisateur (online/offline) """

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


		
