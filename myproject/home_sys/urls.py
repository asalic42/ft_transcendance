from django.urls import path
from .views import home, signout, delete_account, delete_success, service_unavailable, profile_page, game_page

urlpatterns = [
    path('', home, name="home"),
    path('signout/', signout, name='signout'),
    path('deleteAccount/', delete_account, name='delete_account'),
    path('deleteSuccess/', delete_success, name='delete_success'),
    path('unavailable/', service_unavailable, name='unavailable'),
    path('profile/', profile_page, name='profile'),
    path('game-mode/', game_mode_page, name='game-mode'),
    path('game/', game_page, name='game'),
    path('game-bot/', game_bot_page, name='game-bot'),
]