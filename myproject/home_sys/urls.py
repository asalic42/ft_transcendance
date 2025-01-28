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
	# Game URLs
	path('api/current-user/', get_current_user_id, name='current_user_id'),
	path('api/add_solo_casse_brique/', add_solo_casse_brique, name='add_solo_casse_brique'),
	path('api/add_pong/', add_pong, name='add_solo_casse_brique'),
	path('api/map/<int:map_id>/', map_view, name="map_view"),
    # Channels URLs
    path('get-ip-info/', get_ip_info, name='get_ip_info'),
    path('user-settings/', settings_user, name='settings_user'),
    path('user-settings/check_username/', check_username, name='check_username'),
    path('user-settings/check_email/', check_email, name='check_email'),
    path('user-settings/check_pseudo/', check_pseudo, name='check_pseudo'),
    path('user-settings/check_pp/<int:idU>/', check_pp, name='check_pp'),
    path('update-user/', update_user_info, name='update_user_info'),
    path('upload-avatar/', upload_avatar, name='upload_avatar'),
    path('profile-user/<str:username>/', profile_view, name='profile'),
	
	# Channels URLs
	path('api/post_chan/', post_chan, name="post_chan"),
	path('api/get_chans/', get_chans, name="get_chans"),
	path('api/post_message/', post_message, name="post_message"),
	path('api/get_messages/', get_messages, name="get_messages"),
	path('api/live_chat/', live_chat, name="live_chat"),
	path('api/get_chans/', get_chans, name="get_chans"),
	path('api/chan_exist/<str:asked_name>/', does_channel_exist, name="does_channel_exist"),
	path('api/get_blocked/<int:idPlayer>/', get_blocked, name="get_blocked"),
	path('api/post_blocked/', post_blocked, name="post_blocked"),
	path('api/post_deblock/', post_deblock, name="post_deblock"),
]
