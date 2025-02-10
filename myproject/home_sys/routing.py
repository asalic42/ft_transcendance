from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/pong/', consumers.PongConsumer.as_asgi()),
    path('ws/status/', consumers.StatusConsumer.as_asgi()),
]