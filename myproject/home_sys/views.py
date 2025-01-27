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

@csrf_exempt
@require_http_methods(["POST"])
def add_pong(request):
	try:
		data = json.loads(request.body)
		new_game = Pong.objects.create(**data)
		return JsonResponse({'status': 'success', 'game': {
			'id_p1': new_game.id_p1,
			'id_p2': new_game.id_p2,
			'score_p1': new_game.score_p1,
			'score_p2': new_game.score_p2,
			'date': new_game.date.isoformat(),
			'difficulty': new_game.difficulty,
			'bounce_nb': new_game.bounce_nb,
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
	channel = request.GET.get('channel_name', None)
	last_message = request.GET.get('last_message', None)

	if not channel:
		return JsonResponse({'status': 'error', 'message': 'Channel name is required'}, status=400)

	new_message = Messages.objects.filter(channel_name=channel)
	if last_message and last_message != "0":
		try:
			last_message = int(last_message)
			new_message = new_message.filter(id__gt=last_message)  # Récupérer les messages plus récents
		except ValueError:
			return JsonResponse({'status': 'error', 'message': 'Invalid last_message value'}, status=400)

	if new_message.exists():
		data = [{ 
				'id': msg.id,
				'channel_name': msg.channel_name,
				'sender': msg.sender,
				'idSender': msg.idSender,
				'message': msg.message,
				'date':msg.date.isoformat()} for msg in new_message]
		return JsonResponse({'new_message': data})
	return JsonResponse({'new_message': None})


@csrf_exempt
@require_http_methods(["GET"])
def does_channel_exist(request, asked_name):
	try:
		listing = Chans.objects.get(name=asked_name)
		return JsonResponse({'status': 'success'})
	except Chans.DoesNotExist:
		return JsonResponse({'status': 'error'})

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
			'idSender': new_message.idSender,
			'message': new_message.message,
			'date':new_message.date.isoformat(),
		}}, status=201)
	except (KeyError, json.JSONDecodeError) as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
	
@csrf_exempt
@require_http_methods(["GET"])
def get_blocked(request, idPlayer):
    # Récupérer les IDs des utilisateurs bloqués par l'utilisateur spécifié (idPlayer)
    blocked_users_ids = BlockUsers.objects.filter(idUser=idPlayer).values_list('idBlocked', flat=True).distinct()

    # Convertir le QuerySet en liste pour la réponse JSON
    blocked_users_ids_list = list(blocked_users_ids)

    # Retourner la réponse JSON
    return JsonResponse({'blocked_users_ids': blocked_users_ids_list})

@csrf_exempt
@require_http_methods(["POST"])
def post_blocked(request):
	try:
		data = json.loads(request.body)
		new_blocked = BlockUsers.objects.create(**data)
		return JsonResponse({'status': 'success', 'message': {
			"idUser": new_blocked.idUser, 
			"idBlocked": new_blocked.idBlocked,
		}}, status=201)
	except (KeyError, json.JSONDecodeError) as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
	

@csrf_exempt
@require_http_methods(["POST"])
def post_deblock(request):
	try:
		data = json.loads(request.body)
		BlockUsers.objects.filter(idUser=data["idUser"], idBlocked=data["idBlocked"]).delete()
		return JsonResponse({'status': 'success'})
	except (KeyError, json.JSONDecodeError) as e:
		return JsonResponse({'status': 'error'})