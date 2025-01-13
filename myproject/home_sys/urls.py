from django.urls import path
from .views import *

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
    path('api/button-test/', button_test_page, name="button_test_page"),
]