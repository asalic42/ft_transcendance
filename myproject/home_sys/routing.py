from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/pong/', consumers.PongConsumer.as_asgi()),
    path('ws/casse-brique/', consumers.CasseBriqueConsumer.as_asgi()),
    path('ws/status/', consumers.StatusConsumer.as_asgi()),
    path("ws/notifications/", consumers.NotificationConsumer.as_asgi()),
    path('ws/pong/<int:game_id>/<int:id_t>', consumers.PongConsumer.as_asgi()),
    path('ws/tournament/<int:id_t>', consumers.TournamentConsumer.as_asgi()),
]