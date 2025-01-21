import json

from channels.generic.websocket import AsyncWebsocketConsumer

class PongConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.room_name = "pong_game"
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

        if data["type"] == "move":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "update_game_state",
                    "playerData": data["playerData"]
                }
            )
    
    async def update_game_state(self, event):
        player_data = event["playerData"]
        await self.send(text_data=json.dumps({
            "type": "update",
            "playerData": player_data
        }))