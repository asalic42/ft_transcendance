import os
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.views.decorators.cache import never_cache
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import *
import json
from django.shortcuts import get_object_or_404

from django.views.decorators.http import require_http_methods


"""
|
|	Pour la page home,
|	autrement dit la page qui s'ouvre une fois qu'on est log.
|
"""

@login_required
@never_cache
def home(request):
	users = User.objects.all()			  # > Ici on récupe tous les users
	return (render(request, 'home.html', {'users': users}))

"""
|
|   Pour le sign out,
|   la déconnection d'un user, on redirige sur la page du sign in.
|
"""
def signout(request):
	logout(request)
	return (redirect('sign_in'))

"""
[-------------------------------------------------------------------------]
		
>   Utilisation du décorateur "@login_required" 
>   pour dire que l'on execute ce qui suit seulement si le user est log.

[-------------------------------------------------------------------------]
|
|   Ici on gère la suppression d'un compte utilisateur de la BDD.
|   Une fois effacé, on redirige sur la page de "compte effacé avec succès"
|
|
"""
@login_required
def delete_account(request):

	if (request.method == 'POST'):
		user = request.user
		user.delete()
		print(f"Del {user} --> Success.")
		
		request.session['deletion_request'] = True  # P1(1/2) : Protection pour que l'utilisateur ne puisse accéder à la page suivante que si il en a fait la requête
		return (redirect('delete_success'))

	return (render(request, 'delete_account.html'))

"""
|
|   Redirige sur la page correspondante quand le compte est effacé avec succès.
|
|
"""

def delete_success(request):

	try:
		del request.session['deletion_request']
	except:
		return (redirect('home'))
	return (render(request, 'delete_success.html'))

@login_required
def settings_user(request):
	return (render(request, 'user-settings.html'))

@login_required
def profile_page(request):
	return (render(request, 'profile.html'))

@login_required
def service_unavailable(request):
	return (render(request, 'service_unavailable.html'))

@login_required
def channels_page(request):
    curr_user = request.user
    users = User.objects.all()
    return (render(request, 'channels.html', {'current_user': curr_user, 'users': users}))

@login_required
def game_page(request):
	return (render(request, 'game.html'))

@login_required
def game_choice_page(request):
	return (render(request, 'game-choice.html'))

@login_required
def game_mode_page(request):
	return (render(request, 'game-mode.html'))

@login_required
def game_bot_page(request):
	return (render(request, 'game-bot.html'))

@login_required
def other_game(request):
	return (render(request, 'other_game.html'))

@login_required
def tournament_page(request):
    return (render(request, 'tournament.html'))

@login_required
def button_test_page():
    users_list = User.objects.all()
    return JsonResponse({'users_list': users_list})

@login_required
def get_current_user_id(request):
	"""Renvoie l'ID de l'utilisateur actuellement connecté"""
	return JsonResponse({'userId': request.user.id})

@csrf_exempt
@require_http_methods(["POST"])
def add_solo_casse_brique(request):
    try:
        data = json.loads(request.body)
        new_game = SoloCasseBrique.objects.create(**data)
        return JsonResponse({'status': 'success', 'game': {
            'id': new_game.id,
            'id_player': new_game.id_player,
            'id_map': new_game.id_map,
            'score': new_game.score,
            'date': new_game.date.isoformat(),
        }}, status=201)
    except (KeyError, json.JSONDecodeError) as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


def map_view(request, map_id):
	# Spécifiez le chemin de votre fichier .txt
	selected_map = get_object_or_404(Maps, id=map_id)
	# Lire le fichier .txt

	try:
		with open(selected_map.LinkMaps, 'r') as file:
			map_data = file.read()
	except FileNotFoundError:
		return HttpResponse("Carte non trouvée", status=404)

	# Retourner le contenu du fichier en tant que réponse HTTP
	return HttpResponse(map_data, content_type="text/plain")


# """ CHANNELS VIEWS """ #

@csrf_exempt
@require_http_methods(["GET"])
def live_chat(request):
	channel = request.GET.get('channel', None)
	last_message = request.GET.get('last_message', None)

	if not channel:
		return JsonResponse({'status': 'error', 'message': 'Channel name is required'}, status=400)

	if last_message & last_message != 0:
		new_message = new_message.filter(channel_name=channel, id=last_message)
	else:
		new_message = Messages.objects.filter(channel_name=channel)

	if new_message.exists():
		data = [{ 
				'id': msg.id,
				'channel_name': msg.channel_name,
				'sender': msg.sender,
				'message': msg.message,
				'date':msg.date.isoformat()} for msg in new_message]
		return JsonResponse({'new_message': data})
	return JsonResponse({'new_message': []})


@csrf_exempt
@require_http_methods(["POST"])
def post_chan(request):
	try:
		data = json.loads(request.body)
		new_chan = Chans.objects.create(**data)
		return JsonResponse({'status': 'success', 'chan': {
			'id': new_chan.id,
			'name': new_chan.name,
			'invite_link': new_chan.invite_link,
			'date': new_chan.date.isoformat(),
		}}, status=201)
	except (KeyError, json.JSONDecodeError) as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def get_chans(request):
	try:
		channels = Chans.objects.values_list('name', flat=True)
		return JsonResponse({'status': 'success', 'channels': list(channels)}, status=200)
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': 'Erreur lors de la recup des channels'}, status=500)
 
@csrf_exempt
@require_http_methods(["GET"])
def get_messages(request):
	channel_name = request.GET.get('channel_name', None)

	if not channel_name:
		return JsonResponse({'status': 'error', 'message': 'Un nom de channel est requis !'}, status=400)

	try:
		messages = Messages.objects.filter(channel_name=channel_name).order_by('date')

		if not messages.exists():
			return JsonResponse({'status': 'error', 'message': 'Aucun message a recuperer'}, status=200)
	
		message_list = list(messages.values())
		return JsonResponse({'status': 'success', 'messages': message_list}, status=200)
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': 'Erreur lors de la recup des messages'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def post_message(request):
	try:
		data = json.loads(request.body)
		new_message = Messages.objects.create(**data)
		return JsonResponse({'status': 'success', 'message': {
			'id': new_message.id,
			'channel_name': new_message.channel_name,
			'sender': new_message.sender,
			'message': new_message.message,
			'date':new_message.date.isoformat(),
		}}, status=201)
	except (KeyError, json.JSONDecodeError) as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
	

import requests
from django.conf import settings
from django.http import JsonResponse

def get_ip_info(request):
    url = f'https://ipinfo.io/json?token={settings.IP_LOCALISATION}'
    response = requests.get(url)
    return JsonResponse(response.json())


from django.http import JsonResponse
from django.views.decorators.http import require_GET

@require_GET
def check_username(request):
    username = request.GET.get('username', '')
    if (User.objects.filter(username=username).exists()):
        return (JsonResponse({'is_taken' : True}))
    return (JsonResponse({'data' : False}))

@require_GET
def check_pseudo(request):
    pseudo = request.GET.get('pseudo', '')
    if (Users.objects.filter(pseudo=pseudo).exists()):
        return (JsonResponse({'is_taken' : True}))
    return (JsonResponse({'data' : False}))

@require_GET
def check_email(request):
    email = request.GET.get('email', '')
    if (User.objects.filter(email=email).exists()):
        return (JsonResponse({'is_taken' : True}))
    return (JsonResponse({'data' : False}))


from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from .models import Users

@login_required
@csrf_exempt
def update_user_info(request):
    if request.method == 'POST':
        user = request.user  # Récupère l'utilisateur connecté
        
        # Récupère les nouvelles données depuis la requête
        new_email = request.POST.get('email')
        new_username = request.POST.get('username')
        new_pseudo = request.POST.get('pseudo')

        try:
            # Récupère le profil de l'utilisateur connecté
            user_profile = Users.objects.get(user=user)
            
            # Mets à jour les informations
            if new_email:
                user.email = new_email
            if new_username:
                user.username = new_username
            if new_pseudo:
                user_profile.pseudo = new_pseudo  # Met à jour le pseudo

            # Sauvegarde les changements
            user.save()
            user_profile.save()  # Sauvegarde le profil utilisateur avec la nouvelle image
            
            return JsonResponse({
                "status": "success",
                "message": "Informations mises à jour.",
            })


        except Users.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Profil utilisateur non trouvé."})

    return JsonResponse({"status": "error", "message": "Requête invalide."})


from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from .models import Users

@login_required
@csrf_exempt
def upload_avatar(request):
    if request.method == 'POST':
        try:
            # Récupère l'utilisateur connecté
            user = request.user

            # Récupère le fichier avatar envoyé
            avatar_file = request.FILES.get('avatar')

            if not avatar_file:
                return JsonResponse({"status": "error", "message": "Aucun fichier sélectionné."})

            # Récupère le profil utilisateur
            user_profile = Users.objects.get(user=user)
            
            # Mets à jour l'image de l'utilisateur
            user_profile.image = avatar_file
            user_profile.save()  # Sauvegarde le profil avec la nouvelle image

            # Retourne l'URL de la nouvelle image
            return JsonResponse({
                "status": "success",
                "message": "Avatar mis à jour.",
                "new_avatar_url": user_profile.image.url  # L'URL de l'image mise à jour
            })

        except Users.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Profil utilisateur non trouvé."})

    return JsonResponse({"status": "error", "message": "Requête invalide."})


# views.py
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User

@login_required
def profile_view(request, username):
    user = get_object_or_404(User, username=username)
    return render(request, 'profile-other-user.html', {'profile_user': user})