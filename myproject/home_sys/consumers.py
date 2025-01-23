import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PongConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        print('JE SUIS LA PUYTAIN DE TA MERE');
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