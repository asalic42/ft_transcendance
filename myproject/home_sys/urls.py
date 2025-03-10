from django.urls import path, include
from .views import *

urlpatterns = [
    # --- Routes pour les pages en mode SPA ---
    path('', load_template, {'page': 'home'}, name="home"),
    path('profile/<str:username>/', load_template, {'page': 'profile'}, name='profile'),
    path('channels/', load_template, {'page': 'channels'}, name='channels'),
    path('notifications/', load_template, {'page': 'notifications'}, name='notifications'),
    path('other_game_multi/<int:game_id>/<int:map_id>/', load_template, {'page': 'other_game_multi'}, name='other_game_multi'),
    # Route générique pour toute autre page nécessitant un rendu (ex: about, contact, etc.)
    path('<str:page>/', load_template, name='load_template'),
    path('login/', include('loginpage.urls', namespace='loginpage')),
    # --- Routes pour les actions et API (inchangées) ---
    path('signout/', signout, name='signout'),
    path('deleteAccount/', delete_account, name='delete_account'),
    path('deleteSuccess/', delete_success, name='delete_success'),
    path('create_current_game/<int:sender_id>/', create_current_game, name="create_current_game"),
    
    # Exemples d'API et endpoints
    path('api/button-test/', button_test_page, name="button_test_page"),
    path('api/current-user/', get_current_user_id, name='current_user_id'),
    path('api/add_solo_casse_brique/', add_solo_casse_brique, name='add_solo_casse_brique'),
    path('api/add_pong/', add_pong, name='add_solo_casse_brique'),
    path('api/map/<int:map_id>/', map_view, name="map_view"),
    path('api/rooms/', get_rooms, name="get_rooms"),
    
    path('get-ip-info/', get_ip_info, name='get_ip_info'),
    # path('user-settings/', settings_user, name='settings_user'),
    path('user-settings/check_username/', check_username, name='check_username'),
    path('user-settings/check_email/', check_email, name='check_email'),
    path('user-settings/check_pseudo/', check_pseudo, name='check_pseudo'),
    path('user-settings/check_pp/<int:idU>/', check_pp, name='check_pp'),
    path('update-user/', update_user_info, name='update_user_info'),
    path('upload-avatar/', upload_avatar, name='upload_avatar'),
    
    # Endpoints pour les channels
    path('api/post_chan/', post_chan, name="post_chan"),
    path('api/get_chans/', get_chans, name="get_chans"),
    path('api/post_message/', post_message, name="post_message"),
    path('api/get_messages/', get_messages, name="get_messages"),
    path('api/live_chat/', live_chat, name="live_chat"),
    path('api/get_chan_id/<str:chanName>/', get_chan_id, name="get_chan_id"),
    path('api/is_chan_private/<int:idChan>/', is_chan_private, name="is_chan_private"),
    path('api/chan_exist/<str:asked_name>/', does_channel_exist, name="does_channel_exist"),
    path('api/get_blocked/<int:idPlayer>/', get_blocked, name="get_blocked"),
    path('api/check_private_channel/<int:user1_id>/<int:user2_id>/', check_duplicate_private_channel, name='check_private_channel'),
    path('api/postPv/', postPv, name="postPv"),
    path('api/doesUserHaveAccessToChan/<int:idC>/<int:idU>', doesUserHaveAccessToChan, name="doesUserHaveAccessToChan"),
    path('api/getNameById/<int:idU>/', getNameById, name="getNameById"),
    
    path('add_friend/<str:username>/', add_friend, name='add_friend'),
    path('accept_friend_request/<str:username>/', accept_friend_request, name='accept_friend_request'),
    path('decline_friend_request/<str:username>/', decline_friend_request, name='decline_friend_request'),
    path('block_user/<str:username>/', block_user, name='block_user'),
    path('remove_friend/<str:username>/', remove_friend, name="remove_friend"),
    path('remove_blocked_user/<str:username>/', remove_blocked_user, name='remove_blocked_user'),
    path('invite_friend/<str:username>/', invite_friend, name='invite_friend'),
    path('invitation_declined/<str:username>/', invitation_declined, name='invitation_declined'),
    
    path('api/user-status/', user_status, name='user-status'),
]
