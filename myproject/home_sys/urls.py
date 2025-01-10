from django.urls import path
from .views import (
    home, signout, delete_account, delete_success, service_unavailable,
    profile_page, game_page, game_choice_page, game_mode_page, game_bot_page,
    channels_page, other_game, tournament_page, get_current_user_id, add_solo_casse_brique, map_view
)

urlpatterns = [
    path('', home, name="home"),
    path('signout/', signout, name='signout'),
    path('deleteAccount/', delete_account, name='delete_account'),
    path('deleteSuccess/', delete_success, name='delete_success'),
    path('unavailable/', service_unavailable, name='unavailable'),
    path('profile/', profile_page, name='profile'),
    path('channels/', channels_page, name='channels'),
    path('game-choice/', game_choice_page, name='game-choice'),
    path('game-mode/', game_mode_page, name='game-mode'),
    path('game/', game_page, name='game'),
    path('game-bot/', game_bot_page, name='game-bot'),
    path('other_game/', other_game, name='other_game'),
    path('tournament/', tournament_page, name='tournament'),
	path('api/current-user/', get_current_user_id, name='current_user_id'),
	path('api/add_solo_casse_brique/', add_solo_casse_brique, name='add_solo_casse_brique'),
	path('api/map/<int:map_id>/', map_view, name="map_view")
]