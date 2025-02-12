from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/pong/', consumers.PongConsumer.as_asgi()),
    path('ws/casse-brique/<int:gameId>/', consumers.CasseBriqueConsumer.as_asgi()),
]