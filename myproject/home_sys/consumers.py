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
            'vector': {'vx': self.get_random_arbitrary(-10, 10), 'vy': self.get_random_arbitrary(-10, 10)},
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

    # Direction aleatoire de la balle 
    def get_random_arbitrary(self, min, max):
        result = random.random() * (max - min) + min
        if result >= -9 and result <= 9:
            return self.get_random_arbitrary(min, max)
        return result

    # Add player to the game if its possible
    def add_player(self, channel_name):
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
            # 'user_id': user_id
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
        # user_id = self.scope['user'].id if self.scope['user'].is_authenticated else None

        # try to add player
        if not self.game.add_player(self.channel_name):
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        player_number = self.game.players[self.channel_name]['number']
        initial_state_game = self.game.get_game_state()
        # player1_name = await database_sync_to_async(self.get_player_name)(1)
        # player2_name = await database_sync_to_async(self.get_player_name)(2)

        await self.send(text_data=json.dumps({
            'type': 'game_state',
            'number': player_number,
            # 'player1_name': player1_name,
            # 'player2_name': player2_name,
            'ball_coords': initial_state_game['ball_coords'],
            'player1_coords': initial_state_game['player1_coords'],
            'player2_coords': initial_state_game['player2_coords'],
            'scores': initial_state_game['scores']
        }))

        if len(self.game.players) == 2 and not self.game.is_running:
            self.game.is_running = True

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

    # Compte a rebours avant la game
    async def start_countdown(self, event):
        await self.send(text_data=json.dumps({
            'type': 'countdown',
            'message': event['message']
        }))

    # Debut du jeu
    async def start_game(self):
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
        self.game.ball['vector'] = {'vx': direction, 'vy': self.game.get_random_arbitrary(-10, 10)}

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
        