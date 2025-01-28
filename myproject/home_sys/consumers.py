import json
import random
from channels.generic.websocket import AsyncWebsocketConsumer

class PongGame:

    # Define default variables
    def __init__(self):
        self.players = {}
        self.ball = {
            'coords': {'x': 960, 'y': 475},
            'vector': {'vx': random.choice([-10, 10]), 'vy': random.randint(-10, 10)},
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

        self.player[channel_name] = {
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
            if player['number'] == 1:
                player2_coords = player['coords']
                break
        
        return {
            'ball': self.ball['coords'],
            'player1_coords': player1_coords,
            'player2_coords': player2_coords,
            'scores': self.scores
        }


class PongConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        print('JE SUIS LA PUYTAIN DE TA MERE')
        self.room_name = "pong"
        self.room_group_name = f"game_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"Player connected: {self.channel_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"Player disconnected: {self.channel_name}")
        
    async def receive(self, text_data):
        data = json.loads(text_data)
        print(f"Message received: {data}")

        ball_coords = data['ball_coords']
        player1_coords = data['player1_coords']
        player2_coords = data['player2_coords']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_update',
                'ball_coords': ball_coords,
                'player1_coords': player1_coords,
                'player2_coords': player2_coords,
            }
        )

    async def game_update(self, event):
        ball_coords = event['ball_coords']
        player1_coords = event['player1_coords']
        player2_coords = event['player2_coords']
        # Envoyer les mises à jour à WebSocket
        await self.send(text_data=json.dumps({
            'ball_coords': ball_coords,
            'player1_coords': player1_coords,
            'player2_coords': player2_coords,
        }))