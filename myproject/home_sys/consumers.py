import json
import random
import asyncio
from collections import defaultdict
from channels.generic.websocket import AsyncWebsocketConsumer

class PongGame:

    # Define default variables
    def __init__(self):
        self.players = {}
        self.ball = {
            'coords': {'x': 960, 'y': 475},
            'vector': {'vx': 10, 'vy': 0},
            'radius': 13
        }
        self.scores = {'p1': 0, 'p2': 0}
        self.game_loop = None
        self.is_running = False

    # Add player to the game if its possible
    def add_player(self, channel_name):
        if len(self.players) >= 2:
            return False
        
        player_number =len(self.players) + 1
        initial_coords = {
            'x1': 92 if player_number == 1 else 1820,
            'y1': 435,
            'x2': 100 if player_number == 1 else 1828,
            'y2': 515,
            'vy': 20
        }

        self.players[channel_name] = {
            'number': player_number,
            'coords': initial_coords
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
        for player in self.players.values():
            if player['number'] == 1:
                player1_coords = player['coords']
                break
        
        player2_coords = None
        for player in self.players.values():
            if player['number'] == 2:
                player2_coords = player['coords']
                break
        
        return {
            'ball_coords': self.ball['coords'],
            'player1_coords': player1_coords,
            'player2_coords': player2_coords,
            'scores': self.scores
        }


class PongConsumer(AsyncWebsocketConsumer):
    
    games = defaultdict(PongGame)

    async def connect(self):
        print('JE SUIS LA, PUYTAIN DE TA MERE')
        self.room_name = "pong"
        self.room_group_name = f"game_{self.room_name}"
        self.game = self.games[self.room_group_name]

        # try to add player
        if not self.game.add_player(self.channel_name):
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"Player connected: {self.channel_name}")

        if len(self.game.players) == 2 and not self.game.is_running:
            self.game.is_running = True
            await self.start_game()

    async def disconnect(self, close_code):
        self.game.remove_player(self.channel_name)
        self.game.is_running = False

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"Player disconnected: {self.channel_name}")
        
    async def receive(self, text_data):
        data = json.loads(text_data)
        print(f"Message received: {data}")

        player_coords = None

        # Si player == 1 on accepte ses nouvelles coords
        if 'player1_coords' in data and self.game.players[self.channel_name]['number'] == 1:
            player_coords = data['player1_coords']

        # Si player == 2 on accepte ses nouvelles coords
        elif 'player2_coords' in data and self.game.players[self.channel_name]['number'] == 2:
            player_coords = data['player2_coords']

        if player_coords:
            self.game.update_player_coords(self.game.channel_name, player_coords)
            await self.send_game_state()
        
    async def send_game_state(self):
        print("j'envoie un message !")
        state = self.game.get_game_state()
        await self.channel_layer.group_send(
            self.room_group_name, {
                'type': 'game_update',
                **state # Decompresse les donnees envoyees !
            }
        )

    async def game_update(self, event):
        # Envoyer les mises à jour à WebSocket
        await self.send(text_data=json.dumps({
            'ball_coords': event['ball_coords'],
            'player1_coords': event['player1_coords'],
            'player2_coords': event['player2_coords'],
            'scores': event['scores']
        }))
    
    async def start_game(self):
        while self.game.is_running:

            # Maj ball coords
            self.game.ball['coords']['x'] += self.game.ball['vector']['vx']
            self.game.ball['coords']['y'] += self.game.ball['vector']['vy']

            # Collision ball with wall
            if (self.game.ball['coords']['y'] - self.game.ball['radius'] <= 0 or
            self.game.ball['coords']['y'] + self.game.ball['radius'] >= 950):
                self.game.ball['vector']['vy'] = -self.game.ball['vector']['vy']
            
            # Collision ball with player
            ball = self.game.ball
            for player in self.game.players.values():
                coords = player['coords']

                # print(ball['coords']['x'] - ball['radius'])
                # print(" | ")
                # print(coords['x1'])

                if (player['number'] == 1 and
                    ball['coords']['x'] - ball['radius'] >= coords['x1'] and
                    ball['coords']['x'] - ball['radius'] <= coords['x2'] + abs(ball['vector']['vx'] *1) and
                    ball['coords']['y'] - ball['radius'] <= coords['y2'] + ball['radius'] / 2 and
                    ball['coords']['y'] + ball['radius'] >= coords['y1'] - ball['radius'] / 2):
                    print("Collision joueur 1")
                    ball['vector']['vx'] = abs(ball['vector']['vx']) +1

                elif (player['number'] == 2 and
                      ball['coords']['x'] + ball['radius'] >= coords['x1'] - abs(ball['vector']['vx'] *1) and
                      ball['coords']['x'] + ball['radius'] <= coords['x2'] and
                      ball['coords']['y'] - ball['radius'] <= coords['y2'] + ball['radius'] /2 and
                      ball['coords']['y'] + ball['radius'] >= coords['y1'] - ball['radius'] / 2 ):
                    print("Collision joueur 2")
                    ball['vector']['vx'] = -(abs(ball['vector']['vx']) +1) 
                
            # Player add score
            if ball['coords']['x'] + ball['radius'] >= 1920:
                self.game.scores['p1'] += 1
                self.reset_ball(-10)
            elif ball['coords']['x'] - ball['radius'] <= 0:
                self.game.scores['p2'] += 1
                self.reset_ball(10)
            
            if self.game.scores['p1'] >= 5 or self.game.scores['p2'] >= 5:
                self.game.is_running = False

            await self.send_game_state()

            await asyncio.sleep(0.05)
    
    def reset_ball(self, direction):
        self.game.ball['coords'] = {'x': 960, 'y': 475}
        self.game.ball['vector'] = {'vx': direction, 'vy': random.randint(-10, 10)}