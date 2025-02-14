from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/pong/<int:game_id>/<int:id_t>', consumers.PongConsumer.as_asgi()),
]