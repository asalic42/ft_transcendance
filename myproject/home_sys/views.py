import os, sys
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.views.decorators.cache import never_cache
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods, require_GET
from django.conf import settings
from django.db.models import Q
from .models import *
import json, requests
from .utils import add_pong_logic, send_notification_to_user

###############################################################################

from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.views.decorators.cache import never_cache
from django.contrib import messages


# Page d'accueil
@never_cache
def index(request):
	if request.user.is_authenticated:
		return redirect('home')
		
	storage = messages.get_messages(request)
	storage.used = True
	return render(request, 'login.html')


# Inscription d'un utilisateur
#@never_cache
#def signup(request):
#	if request.user.is_authenticated:
#		return redirect('home')
#	
#	if request.method == 'POST':
#		username = request.POST.get('username')
#		email = request.POST.get('email')
#		password = request.POST.get('password')
#
#		# Vérifier si un utilisateur existe déjà avec ce nom d'utilisateur ou cet email
#		if User.objects.filter(username=username).exists():
#			return HttpResponse("Ce nom d'utilisateur est déjà pris.", status=400)
#		if User.objects.filter(email=email).exists():
#			return HttpResponse("Cet email est déjà utilisé.", status=400)
#
#		# Créer un nouvel utilisateur
#		user = User.objects.create_user(username=username, email=email, password=password)
#		user.save()
#
#		userauth = authenticate(request, username=username, password=password)
#		login(request, userauth)
#		return (redirect('home'))
#	
#	return redirect('home')

@never_cache
def signup(request):
	if request.user.is_authenticated:
		return JsonResponse({'status': 'authenticated', 'redirect': reverse('home')})
		
	if request.method == 'POST':
		# Check content type to determine how to get the data
		content_type = request.META.get('CONTENT_TYPE', '')
		if 'application/json' in content_type:
			# Handle JSON data
			import json
			try:
				data = json.loads(request.body)
				username = data.get('username')
				password = data.get('password')
				email = data.get('email')
			except json.JSONDecodeError:
				return JsonResponse({
					'status': 'error',
					'message': 'Invalid JSON data'
				}, status=400)
		else:
			# Handle form data
			username = request.POST.get('username')
			password = request.POST.get('password')
			email = request.POST.get('email')
			
		# Check if a user already exists with this username or email
		if User.objects.filter(username=username).exists():
			return JsonResponse({
				'status': 'error',
				'message': 'Ce nom d\'utilisateur est déjà pris.'
			}, status=400)
			
		if User.objects.filter(email=email).exists():
			return JsonResponse({
				'status': 'error',
				'message': 'Cet email est déjà utilisé.'
			}, status=400)
			
		# Create a new user
		user = User.objects.create_user(username=username, email=email, password=password)
		user.save()
		
		user = authenticate(request, username=username, password=password)
		if user is not None:
			login(request, user)
			return JsonResponse({
				'status': 'success',
				'redirect': reverse('home'),
				'user': {
					'id': user.id,
					'username': user.username,
					# other user fields you need
				},
				'online_count': Users.objects.filter(is_online=True).count()
			})
		else:
			return JsonResponse({'status': 'unauthenticated'})
			"""  return JsonResponse({
				'status': 'error',
				'message': 'Invalid credentials'
			}, status=400) """
			
	# GET requests can return minimal data needed for the signup form
	return JsonResponse({'status': 'unauthenticated'})



from django.template.loader import render_to_string
from django.urls import reverse


def signin(request):
    if request.user.is_authenticated:
        return JsonResponse({'status': 'authenticated', 'redirect': reverse('home')})
        
    if request.method == 'POST':
        content_type = request.META.get('CONTENT_TYPE', '')
        
        if 'application/json' in content_type:
            import json
            try:
                data = json.loads(request.body)
                username = data.get('username')
                password = data.get('password')
            except json.JSONDecodeError:
                return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
        else:
            username = request.POST.get('username')
            password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)

            # Mettre à jour le statut de l'utilisateur à 'online'
            try:
                user_profile = Users.objects.get(user=user)
                user_profile.is_online = True
                user_profile.save()

                return JsonResponse({
                    'status': 'success',
                    'redirect': reverse('home'),
                    'user': {
                        'id': user.id,
                        'username': user.username,
                    },
                    'online_count': Users.objects.filter(is_online=True).count()
                })
            except Users.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'User profile not found.'})
        else:
            return JsonResponse({'status': 'unauthenticated'})
    
    return JsonResponse({'status': 'unauthenticated'})



""" def signin(request):
	if request.user.is_authenticated:
		return JsonResponse({'status': 'authenticated', 'redirect': reverse('home')})
		
	if request.method == 'POST':
		# Check content type to determine how to get the data
		content_type = request.META.get('CONTENT_TYPE', '')
		
		if 'application/json' in content_type:
			# Handle JSON data
			import json
			try:
				data = json.loads(request.body)
				username = data.get('username')
				password = data.get('password')
			except json.JSONDecodeError:
				return JsonResponse({
					'status': 'error',
					'message': 'Invalid JSON data'
				}, status=400)
		else:
			# Handle form data
			username = request.POST.get('username')
			password = request.POST.get('password')
		
		# Continue with authentication
		user = authenticate(request, username=username, password=password)
		if user is not None:
			login(request, user)
			return JsonResponse({
				'status': 'success',
				'redirect': reverse('home'),
				'user': {
					'id': user.id,
					'username': user.username,
					# other user fields you need
				},
				'online_count': Users.objects.filter(is_online=True).count()
			})
		else:
			return JsonResponse({'status': 'unauthenticated'})
			#return JsonResponse({
			#	'status': 'error',
			#	'message': 'Invalid credentials'
			#}, status=400)
		
	# GET requests can return minimal data needed for the login form
	return JsonResponse({'status': 'unauthenticated'}) """


# Déconnexion de l'utilisateur
def signout(request):
	if request.user.is_authenticated:
		try:
			user_profile = Users.objects.get(user=request.user)
			user_profile.is_online = False
			user_profile.save()
		except Users.DoesNotExist:
			pass  # Ne rien faire si le profil de l'utilisateur n'est pas trouvé

	logout(request)
	return JsonResponse({
        'status': 'success',
        'redirect': f'https://{settings.IP_ADDR}:5000/'
    })


from django.http import JsonResponse
from django.views.decorators.http import require_GET
from zxcvbn import zxcvbn as passwordscore

@require_GET
def check_username(request):
	username = request.GET.get('username', '')
	if (User.objects.filter(username=username).exists()):
		return (JsonResponse({'is_taken' : True}))
	return (JsonResponse({'data' : False}))


@require_GET
def check_email(request):
	email = request.GET.get('email', '')
	if (User.objects.filter(email=email).exists()):
		return (JsonResponse({'is_taken' : True}))
	return (JsonResponse({'data' : False}))

@require_GET
def check_password_solidity(request):
	password = request.GET.get('password', '')
	return (JsonResponse({'data' : passwordscore(password)['score']}))

#######################################################################################################



@login_required
@never_cache
def load_template(request, page, **kwargs):
	template_name = f"{page}.html"
	context = {}

	if page == "home" or page == "accounts":
		template_name = "home.html"
		users = Users.objects.all()
		context['online_users'] = users.filter(is_online=True)
		context['offline_users'] = users.filter(is_online=False)

	elif page == "profile":
		# Cas particulier pour la vue profile_view : on passe le nom d'utilisateur en paramètre
		print("called profile")
		username = kwargs.get('username', request.user.username)
		print(f"username: {username}")
		sys.stdout.flush()
		try:
			user = User.objects.get(username=username)
			users_profile = Users.objects.get(user=user)
		except User.DoesNotExist:
			return redirect('home')

		# Récupération des parties de Pong associées à l'utilisateur
		games_P = Pong.objects.filter(
			Q(id_p1=users_profile) | Q(id_p2=users_profile)
		).order_by('-date')

		# Attribuer une couleur aux matchs de Pong en fonction du score
		for game in games_P:
			s1, s2 = game.score_p1, game.score_p2
			if game.id_p1 != users_profile:
				s1, s2 = game.score_p2, game.score_p1
			if s1 < s2:
				game.color = 'red'
			elif s1 > s2:
				game.color = 'green'

		# Récupération des autres jeux
		games_S_CB = SoloCasseBrique.objects.filter(id_player=users_profile).order_by('-date')
		games_M_CB = MultiCasseBrique.objects.filter(
			Q(id_p1=users_profile) | Q(id_p2=users_profile)
		).order_by('-date')

		# Gestion des tournois
		games_T_CB = list(MatchsTournaments.objects.values_list('idTournaments', flat=True)
						   .distinct()
						   .order_by("-idTournaments__date"))
		tournaments_users = {}
		tournaments_colors = {}
		tournaments_date = {}
		for tournament_id in games_T_CB:
			tournament = Tournaments.objects.get(id=tournament_id)
			winner = tournament.winner
			if users_profile == winner:
				tournament_color = 'green'
			else:
				tournament_color = 'red'
			tournaments_colors[tournament_id] = tournament_color
			tournaments_date[tournament_id] = tournament.date
			users_img = get_users_of_one_tournament(users_profile, tournament_id)
			tournaments_users[tournament_id] = users_img

		context = {
			'user': user,
			'games_P': games_P,
			'games_S_CB': games_S_CB,
			'games_M_CB': games_M_CB,
			'games_T_CB': games_T_CB,
			'tournaments_users': tournaments_users,
			'tournaments_colors': tournaments_colors,
			'tournaments_date': tournaments_date,
		}

	elif page == "channels":
		current_user_profile = request.user.users
		context = {
			'users': {
				'friends': current_user_profile.friends.all()
			},
			'current_user': request.user,
			'all_users': User.objects.all()
		}

	elif page == "notifications":
		current_user_profile = request.user.users
		friend_requests = current_user_profile.friends_request.all()
		context = {
			'users': current_user_profile,
			'friend_requests': friend_requests,
		}

	elif page == "other_game_multi":
		context = {
			'game_id': kwargs.get('game_id'),
			'map_id': kwargs.get('map_id')
		}

	else:
		context = {}

	# Vérifier l'existence du template dans le répertoire
	template_path = os.path.join(settings.BASE_DIR, 'home_sys', 'templates', f"{page}.html")
	if not os.path.exists(template_path):
		return JsonResponse({"error": "Page not found"}, status=404)

	return render(request, template_name, context)


"""
|
|	Pour la page home,
|	autrement dit la page qui s'ouvre une fois qu'on est log.
|
"""

from django.template.loader import render_to_string

@login_required
@never_cache
def home(request):
	
	# Récupérer les utilisateurs et pré-calculer leur statut
	users = Users.objects.all()
	online_users = users.filter(is_online=True)
	offline_users = users.filter(is_online=False)
		
	context = {
		'online_users': online_users,
		'offline_users': offline_users,
	}
	return render(request, 'home.html', context)

"""
[-------------------------------------------------------------------------]
		
>   Utilisation du décorateur "@login_required" 
>   pour dire que l'on execute ce qui suit seulement si le user est log.

[-------------------------------------------------------------------------]
|
|   Ici on gère la suppression d'un compte utilisateur de la BDD.
|   Une fois effacé, on redirige sur la page de "compte effacé avec succès"
|
"""
@ensure_csrf_cookie
@login_required
def delete_account(request):
	return render(request, 'delete_account.html')

def delete_success(request):
	# Vérifier si l'utilisateur est authentifié avant de continuer
	if request.user.is_authenticated:
		user = request.user
		# Stocker des informations pour afficher dans le template si nécessaire
		username = user.username  # ou autre info que vous voulez conserver
		
		# Désactiver le mot de passe
		user.set_unusable_password()
		user.save()
		
		# Déconnecter l'utilisateur
		from django.contrib.auth import logout
		logout(request)
		
		# Passer les informations au template
		return render(request, 'delete_success.html', {'username': username})
	else:
		# Rediriger vers une page publique si non authentifié
		return render(request, 'delete_success.html')

@login_required
def settings_user(request):
	return (render(request, 'user-settings.html'))

@login_required
def profile_page(request):
	return (render(request, 'profile.html'))

# @login_required
# def service_unavailable(request):
	# return (render(request, 'service_unavailable.html'))

"""
|
|	Charge la page des channels avec les informations necessaires (ami, profil)
|	On aurait pu passer le currentuser differement, via des cookies, mais flemmee : c'était implémenté comme ça, pourquoi changer une équipe qui gagne?
|
"""

@login_required
def channels_page(request):
	# Récupérer le profil de l'utilisateur connecté
	current_user_profile = request.user.users

	# Récupérer les demandes d'ami
	friends = current_user_profile.friends.all()

	# Passer les ami au template
	context = {
		'users': {
			'friends': friends
		},
		'current_user': request.user,
		'all_users': User.objects.all()
	}

	return render(request, 'channels.html', context)

@login_required
def game_page(request):
	return (render(request, 'game.html'))

@login_required
def game_choice_page(request):
	return (render(request, 'game-choice.html'))

@login_required
def game_mode_pong_page(request):
	return (render(request, 'game-mode-pong.html'))

@login_required
def game_type_pong_page(request):
	return (render(request, 'game-type-pong.html'))

# @login_required
# def game_distant_page_choice(request):
# 	all_games = CurrentGame.objects.all()
# 	return (render(request, 'game-distant-choice.html', {'all_games': all_games}))

@login_required
def game_distant_page(request, game_id):
	return (render(request, 'game-distant.html', {'game_id':game_id}))

@login_required
def game_distant_page_t(request, game_id, id_t):
	return (render(request, 'game-distant-t.html', {'game_id':game_id, 'id_t':id_t}))

@login_required
def game_bot_page(request):
	return (render(request, 'game-bot.html'))

@login_required
def other_game(request):
	return (render(request, 'other_game.html'))

@login_required
def map_choice(request):
	return (render(request, 'map_choice.html'))

@login_required
def tournament_choice(request):
	tour = tournament_room.objects.all()
	return render(request, 'tournament_choice.html', {'all_games':tour})

""" @login_required
def casse_brique_room_choice(request):
	tour = casse_brique_room.objects.all()
	return render(request, 'other_game_multi_room.html', {'all_games':tour}) """

def other_game_choice(request):
	return (render(request, 'other_game_choice.html'))

@login_required
def other_game_multi(request, game_id, map_id):
	return (render(request, 'other_game_multi.html', {'game_id':game_id, 'map_id':map_id}))

@login_required
def tournament_page(request):
	existing_ids = set(Tournaments.objects.values_list('id', flat=True))
	waiting_room = set(tournament_room.objects.values_list('tournament_id', flat=True))
	next_id = 1
	while next_id in existing_ids or next_id in waiting_room:
		next_id += 1
	
	return (render(request, 'tournament.html', {'id_t': next_id}))

@login_required
def tournament_page_id(request, id_t):
	return (render(request, 'tournament.html', {'id_t':id_t}))

@login_required
def button_test_page():
	users_list = User.objects.all()
	return JsonResponse({'users_list': users_list})

@login_required
def get_current_user_id(request):
	"""Renvoie l'ID de l'utilisateur actuellement connecté"""
	return JsonResponse({'userId': request.user.id})

"""
|
|	Add la partie dans la database. id_player n'est pas vraiment un id, c'est un "pointeur"
|
"""
@ensure_csrf_cookie
@require_http_methods(["POST"])
def add_solo_casse_brique(request):
	try:
		data = json.loads(request.body)

		user = Users.objects.get(user_id=data.get('id_player'))
		data['id_player'] = user

		new_game = SoloCasseBrique.objects.create(**data)
		return JsonResponse({'status': 'success', 'game': {
			'id': new_game.id,
			'id_player': new_game.id_player.pk,
			'id_map': new_game.id_map,
			'score': new_game.score,
			'date': new_game.date.isoformat(),
		}}, status=201)
	except (KeyError, json.JSONDecodeError) as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

def add_pong(request):
	try:
		data = json.loads(request.body)
		game_data = add_pong_logic(data)
		return JsonResponse({'status': 'success', 'game': game_data}, status=201)
	except Users.DoesNotExist:
		return JsonResponse({'status': 'error', 'message': 'Utilisateur non trouvé'}, status=404)
	except (KeyError, json.JSONDecodeError) as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

"""
|
|	Ici on va aller cherche la map demandé dans la database, où est stocké le chemin pour y acceder.
|	On lit le fichier, et on renvoie le texte brut, il sera traité côté client.
|
"""

def map_view(request, map_id):
	selected_map = get_object_or_404(Maps, id=map_id)

	# Lire le fichier .txt
	try:
		with open(selected_map.LinkMaps, 'r') as file:
			map_data = file.read()
	except FileNotFoundError:
		return HttpResponse("Carte non trouvée", status=404)

	# Retourner le contenu du fichier en tant que réponse http
	return HttpResponse(map_data, content_type="text/plain")


# """ CHANNELS VIEWS """ #

"""
|
|	La view qui va être appellée en boucle dans le fetch côté client
|	Pas très propre, on aurait pu utiliser des websockets. Dommage.
|
"""


@require_http_methods(["GET"])
def live_chat(request):
	channel = request.GET.get('channel_name', None)
	last_message = request.GET.get('last_message', None)

	if not channel:
		return JsonResponse({'status': 'error', 'message': 'Channel name is required'}, status=400)

	new_message = Messages.objects.filter(channel_name=channel).order_by('id')
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
				'is_link': msg.is_link,
				'date':msg.date.isoformat()} for msg in new_message]
		return JsonResponse({'new_message': data})
	return JsonResponse({'new_message': None})

@require_http_methods(["GET"])
def does_channel_exist(request, asked_name):

	try:
		listing = Chans.objects.get(name=asked_name)
		return JsonResponse({'status': 'success', 'private' : listing.private, 'id': listing.id})
	except Chans.DoesNotExist:
		return JsonResponse({'status': 'error'})

@ensure_csrf_cookie
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
			'private': new_chan.private,
		}}, status=201)
	except (KeyError, json.JSONDecodeError) as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

@require_http_methods(["GET"])
def get_chans(request):
	try:
		channels = list(Chans.objects.values('id', 'name', 'private'))
		
		return JsonResponse({'status': 'success', 'channels': channels}, status=200)
	except Exception as e:
		print(f"Erreur serveur: {str(e)}")
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	
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

@ensure_csrf_cookie
@require_http_methods(["POST"])
def post_message(request):
	try:
		data = json.loads(request.body)
		new_message = Messages.objects.create(
			channel_name = data.get('channel_name'),
			sender = data.get('sender'),
			idSender = data.get('idSender'),
			message = data.get('message'),
			is_link = data.get('is_link'),
			read =  data.get('read')
		)

		if data.get('user2'):
			if data.get('user2') != new_message.idSender:
				recipient = Users.objects.get(id=data.get('user2'))
				# if not UserOpenedChannel.objects.filter(user=recipient, channel_name=new_message.channel_name).exists():
				send_notification_to_user(data.get('user2'), data.get('channel_name'))
		else:
			for user in Users.objects.all():
				if user.id != new_message.idSender:
					# if not UserOpenedChannel.objects.filter(user=user, channel_name=data.get('channel_name')).exists():
					send_notification_to_user(user.id, data.get('channel_name'))

		return JsonResponse({'status': 'success', 'message': {
			'id': new_message.id,
			'channel_name': new_message.channel_name,
			'sender': new_message.sender,
			'idSender': new_message.idSender,
			'message': new_message.message,
			'is_link' : new_message.is_link,
			'read': False,
			'date':new_message.date.isoformat(),
		}}, status=201)
	except (KeyError, json.JSONDecodeError) as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

def get_ip_info(request):
	url = f'https://ipinfo.io/json?token={settings.IP_LOCALISATION}'
	response = requests.get(url)
	return JsonResponse(response.json())

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

@ensure_csrf_cookie
@login_required
def update_user_info(request):
	if request.method == 'POST':
		user = request.user  # Récupère l'utilisateur connecté
		logger.info(f"[UPDATE USER INFO][TYPE]: {type(user)}")
		
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
				user.users.name = new_username
				user_profile.name = new_username
			if new_pseudo:
				user_profile.pseudo = new_pseudo  # Met à jour le pseudo

			# Sauvegarde les changements
			user.save()
			user_profile.save()  # Sauvegarde le profil utilisateur avec la nouvelle image

			# En gros, vu qu'on a modifié le profil il faut aussi modifier ceux enregistrés dans blocked et friend etc
			all_users = Users.objects.all()
			for other_user in all_users:
				if other_user.blocked.filter(pk=user_profile.pk).exists():
					logger.info(f"\t[UPDATE][BLOCKED]: removing {user_profile}, adding {user}")
					other_user.blocked.remove(user_profile.pk)
					other_user.blocked.add(user.users)

				if (other_user.friends.filter(pk=user_profile.pk).exists()):
					if other_user.friends.filter(pk=user_profile.pk).exists():
						logger.info(f"\t[UPDATE][FRIENDS]: removing {user_profile}, adding {user}")
						other_user.friends.remove(user_profile.pk)
						other_user.friends.add(user.users)

				if (other_user.friends_request.filter(pk=user_profile.pk).exists()):
					if other_user.friends_request.filter(pk=user_profile.pk).exists():
						logger.info(f"\t[UPDATE][FRIENDS REQUEST]: removing {user_profile}, adding {user}")
						other_user.friends_request.remove(user_profile.pk)
						other_user.friends_request.add(user.users)

				if (other_user.invite.filter(pk=user_profile.pk).exists()):
					if other_user.invite.filter(pk=user_profile.pk).exists():
						logger.info(f"\t[UPDATE][INVITE]: removing {user_profile}, adding {user}")
						other_user.invite.remove(user_profile.pk)
						other_user.invite.add(user.users)

			messages_pseudo_update = Messages.objects.all().filter(idSender=user_profile.pk)
			for idv in messages_pseudo_update:
				idv.sender = user_profile.name
				idv.save()


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

@ensure_csrf_cookie
@login_required
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

from django.shortcuts import redirect

import logging

logger = logging.getLogger(__name__)


def get_users_of_one_tournament(user, id):
	""" 
		Avec un id on cible un tournois,
		On parse chaque match de celui-ci,
		Et on retourne chaque user trouvé autre que le principale.
	"""

	games_T_CB = MatchsTournaments.objects.filter(idTournaments=id)
	logger.info(f"[GET USERS TOURNAMENT BY ID]: {games_T_CB}")

	user_ids = set()
	for game in games_T_CB:
		pong_session = Pong.objects.get(id=game.idMatchs.id)

		if (user.id == pong_session.id_p1.id):
			user_ids.add(pong_session.id_p2.image.url)
		else:
			user_ids.add(pong_session.id_p1.image.url)
	return list(user_ids)

@login_required
def profile_view(request, username):
	# Si aucun username n'est fourni, utiliser l'utilisateur connecté
	if not username:
		return redirect('profile', username=request.user.username)
		
	try:
		user = User.objects.get(username=username)
		users_profile = Users.objects.get(user=user)
		
		# Récupérer les parties de Pong associées à l'utilisateur
		games_P = Pong.objects.filter(
			Q(id_p1=users_profile) | Q(id_p2=users_profile)
		).order_by('-date')


		# Attribuer une couleur aux matchs de Pong en fonction du score
		for game in games_P:
			s1, s2 = game.score_p1, game.score_p2

			if game.id_p1 != users_profile:
				s1, s2 = game.score_p2, game.score_p1

			if s1 < s2:
				game.color = 'red'
			elif s1 > s2:
				game.color = 'green'

		# Récupérer les autres jeux
		games_S_CB = SoloCasseBrique.objects.filter(id_player=users_profile).order_by('-date')
		games_M_CB = MultiCasseBrique.objects.filter(
			Q(id_p1=users_profile) | Q(id_p2=users_profile)
		).order_by('-date')

		# Dictionnaire pour stocker les données des tournois
		games_T_CB = list(MatchsTournaments.objects.values_list('idTournaments', flat=True).distinct().order_by("-idTournaments__date"))

		# Dictionnaire pour stocker les données des tournois
		tournaments_users = {}
		tournaments_colors = {}  # Nouveau dictionnaire pour stocker les couleurs
		tournaments_date = {}

		# Parcourir chaque tournoi
		for tournament_id in games_T_CB:
			# Récupérer le gagnant du tournoi
			tournament = Tournaments.objects.get(id=tournament_id)
			winner = tournament.winner

			# Déterminer la couleur du tournoi
			if users_profile == winner:
				tournament_color = 'green'  # L'utilisateur principal est le gagnant
			else:
				tournament_color = 'red'  # L'utilisateur principal n'est pas le gagnant

			# Stocker la couleur dans le dictionnaire
			tournaments_colors[tournament_id] = tournament_color
			tournaments_date[tournament_id] = tournament.date

			# Récupérer les images des autres utilisateurs du tournoi
			users_img = get_users_of_one_tournament(users_profile, tournament_id)
			tournaments_users[tournament_id] = users_img

		return render(request, 'profile.html', {
			'user': user,
			'games_P': games_P,
			'games_S_CB': games_S_CB,
			'games_M_CB': games_M_CB,
			'games_T_CB': games_T_CB,
			'tournaments_users': tournaments_users,
			'tournaments_colors': tournaments_colors,
			'tournaments_date': tournaments_date,
		})
		
	except User.DoesNotExist:
		return redirect('home')

@login_required
@require_http_methods(["GET"])
def get_blocked(request, idPlayer):
	# Récupérer les IDs des utilisateurs bloqués par l'utilisateur spécifié (idPlayer)
	if not request.user.is_authenticated:
		return JsonResponse({'error': 'User not authenticated'}, status=401)
	current_user_profile = request.user.users
	
	all_users_id = [elmt.id for elmt in current_user_profile.blocked.all()]
	# Retourner la réponse JSON
	return JsonResponse({'blocked_users_ids': all_users_id})

""" @csrf_exempt
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
		return JsonResponse({'status': 'error', 'message': str(e)}, status=400) """
	

""" @csrf_exempt
@require_http_methods(["POST"])
def post_deblock(request):
	try:
		data = json.loads(request.body)
		BlockUsers.objects.filter(idUser=data["idUser"], idBlocked=data["idBlocked"]).delete()
		return JsonResponse({'status': 'success'})
	except (KeyError, json.JSONDecodeError) as e:
		return JsonResponse({'status': 'error'}) """

@require_GET
def check_pp(request, idU):
	try:
		user = get_object_or_404(Users, pk = idU)  # pk = primary key
		return JsonResponse({'status': 'success', 'img': user.image.url})  # Ensure 'image' is the correct field
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)
	

@require_GET
def is_chan_private(request, idChan):
		chan = get_object_or_404(Chans, id = idChan)
		return JsonResponse({'is_private': chan.private})

@require_GET
def get_chan_id(request, chanName):
	try:
		chan = get_object_or_404(Chans, name = chanName)
		return JsonResponse({'status': 'success', 'id': chan.id})
	except Chans.DoesNotExist:
		return JsonResponse({'error': 'Chans not found'}, status=404)


@require_GET
def doesUserHaveAccessToChan(request, idC, idU):
	try :
		priv_chan = PrivateChan.objects.get(id_chan = idC)
		if priv_chan.id_u1 == idU:
			return JsonResponse({'status': 'success', 'allowed': 'True', 'id_u1': idU, 'id_u2':priv_chan.id_u2})
		if priv_chan.id_u2 == idU:
			return JsonResponse({'status': 'success', 'allowed': 'True', 'id_u1': idU, 'id_u2': priv_chan.id_u1})
		return JsonResponse({'status': 'success', 'allowed': 'False', 'id_u1': idU, 'id_u1': priv_chan.id_u1, 'id_u2':priv_chan.id_u2})
	except:
		return JsonResponse({'status': 'error'})

def check_duplicate_private_channel(request, user1_id, user2_id):
	"""
	Vérifie si un canal privé existe déjà entre deux utilisateurs
	"""
	# Normalise les IDs (le plus petit en premier)
	id_u1, id_u2 = sorted([int(user1_id), int(user2_id)])
		
	# Cherche un canal existant avec ces utilisateurs dans n'importe quel ordre
	existing_channel = PrivateChan.objects.filter(
		(Q(id_u1=id_u1) & Q(id_u2=id_u2)) |
		(Q(id_u1=id_u2) & Q(id_u2=id_u1))
	).first()
		
	if existing_channel:
		return JsonResponse({
			'exists': True,
			'channel_id': existing_channel.id_chan
		})
	return JsonResponse({'exists': False})

@ensure_csrf_cookie
@require_http_methods(["POST"])
def	postPv(request):
	try:
		data = json.loads(request.body)
		new_pv = PrivateChan.objects.create(**data)
		return JsonResponse({'status': 'success', 'message': {
			"id_chan": new_pv.id_chan, 
			"id_u1": new_pv.id_u1,
			"id_u2": new_pv.id_u2,
		}}, status=201)
	except (KeyError, json.JSONDecodeError) as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

@require_GET
def getNameById(request, idU):
	try:
		user = get_object_or_404(Users, pk = idU)  # pk = primary key
		return JsonResponse({'status': 'success', 'name': user.name})  # Ensure 'image' is the correct field
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)

# import logging

# Configurez le logger
# logger = logging.getLogger(__name__)

@ensure_csrf_cookie
@login_required
def add_friend(request, username):
	if request.method == 'POST':
		current_user = request.user.users
		other_user = get_object_or_404(User, username=username)

		# logger.info(f"\033[31mUtilisateur actuel : {current_user}\033[0m")
		# logger.info(f"\033[31mAutre utilisateur : {other_user}\033[0m")
		# logger.info(f"\033[31mALL F.REQUEST From User : {current_user} : {current_user.friends_request.all()}\033[0m")
		
		if (other_user.users in current_user.blocked.all()):
			return JsonResponse({'status': 'unblockBefore'})
		
		# Si Current User in OtherUser Friend list
		if (current_user in other_user.users.friends.all()):
			return JsonResponse({'status': 'friend'})
		
		# Si Current User in OtherUser Blocked list
		if (current_user in other_user.users.blocked.all()):
			return JsonResponse({'status': 'blocked'})
		
		# Si Current User in OtherUser Friends_request list
		if (current_user in other_user.users.friends_request.all()):
			return JsonResponse({'status': 'waiting'})

		if other_user.users in current_user.friends_request.all():

				# Si l'utilisateur visité est dans la liste des demandes d'ami de l'utilisateur actuel
				current_user.friends.add(other_user)
				other_user.users.friends.add(current_user)
				current_user.friends_request.remove(other_user)
				return JsonResponse({'status': 'friend_added'})
		else:
			# logger.info(f"\033[33m #3 condition\033[0m")
			# Sinon, ajouter l'utilisateur actuel dans la liste des demandes d'ami de l'utilisateur visité
			other_user.users.friends_request.add(current_user)
			return JsonResponse({'status': 'friend_request_sent'})

	return JsonResponse({'status': 'error'}, status=400)


# --------------------------------------------------------------------------------------#

from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def notification_page(request):
	# Récupérer le profil de l'utilisateur connecté
	current_user_profile = request.user.users

	current_user_profile.has_unread_notifications = False
	current_user_profile.save()

	# Récupérer les demandes d'ami
	friend_requests = current_user_profile.friends_request.all()

	# Passer les demandes d'ami au template
	context = {
		'users': current_user_profile,  # Passer le profil de l'utilisateur
		'friend_requests': friend_requests,  # Passer les demandes d'ami
	}

	return render(request, 'notifications.html', context)

@ensure_csrf_cookie
@login_required
def accept_friend_request(request, username):
	if request.method == 'POST':
		try:
			current_user_profile = request.user.users
			other_user = get_object_or_404(User, username=username)

			if (other_user.users in current_user_profile.blocked.all()):
				return JsonResponse({'status': 'unblockBefore'})
			
			# Si Current User in OtherUser Blocked list
			if (current_user_profile in other_user.users.blocked.all()):
				return JsonResponse({'status': 'blocked'})
	
			# Ajouter l'utilisateur à la liste d'amis
			current_user_profile.friends.add(other_user.users)
			other_user.users.friends.add(current_user_profile)

			# Supprimer la demande d'ami
			current_user_profile.friends_request.remove(other_user.users)

			return JsonResponse({'status': 'friend_added'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	return JsonResponse({'status': 'error', 'message': 'Méthode non autorisée'}, status=405)

@ensure_csrf_cookie
@login_required
def decline_friend_request(request, username):
	if request.method == 'POST':
		try:
			current_user_profile = request.user.users
			other_user = get_object_or_404(User, username=username)

			# Supprimer la demande d'ami
			current_user_profile.friends_request.remove(other_user.users)

			return JsonResponse({'status': 'friend_request_declined'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	return JsonResponse({'status': 'error', 'message': 'Méthode non autorisée'}, status=405)

@ensure_csrf_cookie
@login_required
def block_user(request, username):
	if request.method == 'POST':
		try:
			current_user_profile = request.user.users
			other_user = get_object_or_404(User, username=username)

			# Ajouter l'utilisateur à la liste des utilisateurs bloqués
			if (other_user.users in current_user_profile.friends.all()):
				current_user_profile.friends.remove(other_user.users)
				other_user.users.friends.remove(current_user_profile)
			
			if (other_user.users in current_user_profile.friends_request.all()):
				current_user_profile.friends_request.remove(other_user.users)
				other_user.users.friends_request.remove(current_user_profile)

			if (other_user.users in current_user_profile.invite.all()):
				current_user_profile.invite.remove(other_user.users)
				other_user.users.invite.remove(current_user_profile)

			current_user_profile.blocked.add(other_user.users)

			# Supprimer la demande d'ami (si elle existe)
			current_user_profile.friends_request.remove(other_user.users)

			return JsonResponse({'status': 'user_blocked'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	return JsonResponse({'status': 'error', 'message': 'Méthode non autorisée'}, status=405)

@ensure_csrf_cookie
@login_required
def remove_friend(request, username):
	if request.method == 'POST':
		try:
			current_user_profile = request.user.users
			other_user = get_object_or_404(User, username=username)

			# Ajouter l'utilisateur à la liste des utilisateurs bloqués
			current_user_profile.friends.remove(other_user.users)
			other_user.users.friends.remove(current_user_profile)

			# Supprimer la demande d'ami (si elle existe)

			return JsonResponse({'status': 'user_removed'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	return JsonResponse({'status': 'error', 'message': 'Méthode non autorisée'}, status=405)

@ensure_csrf_cookie
@login_required
def remove_blocked_user(request, username):
	if request.method == 'POST':
		try:
			current_user_profile = request.user.users
			other_user = get_object_or_404(User, username=username)

			# Ajouter l'utilisateur à la liste des utilisateurs bloqués
			current_user_profile.blocked.remove(other_user.users)
			# Supprimer la demande d'ami (si elle existe)

			return JsonResponse({'status': 'blocked_user_removed'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	return JsonResponse({'status': 'error', 'message': 'Méthode non autorisée'}, status=405)

@ensure_csrf_cookie
@login_required
def invite_friend(request, username):
	if request.method == 'POST':
		try:
			current_user_profile = request.user.users
			other_user = get_object_or_404(User, username=username)

			if (current_user_profile in other_user.users.blocked.all()):
				return (JsonResponse({'status': 'blocked'}))

			# Ajouter l'utilisateur à la liste des utilisateurs bloqués
			other_user.users.invite.add(current_user_profile)
			# Supprimer la demande d'ami (si elle existe)

			return JsonResponse({'status': 'game_invitation_send'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	return JsonResponse({'status': 'error', 'message': 'Méthode non autorisée'}, status=405)

@ensure_csrf_cookie
@login_required
def invitation_declined(request, username):
	if request.method == 'POST':
		try:
			current_user_profile = request.user.users
			other_user = get_object_or_404(User, username=username)

			# Ajouter l'utilisateur à la liste des utilisateurs bloqués
			current_user_profile.invite.remove(other_user.users)
			# Supprimer la demande d'ami (si elle existe)

			return JsonResponse({'status': 'game_invitation_declined'})
		except Exception as e:
			return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	return JsonResponse({'status': 'error', 'message': 'Méthode non autorisée'}, status=405)

from django.http import JsonResponse
from .models import Users

def user_status(request):
	users = Users.objects.all().values('id', 'is_online')
	
	return JsonResponse(list(users), safe=False)


@login_required
def create_current_game(request, sender_id):
	try:
		created = CurrentGame.objects.get_or_create(game_id=sender_id)
		if created:
			return (render(request, 'game-distant.html', {'game_id':sender_id}))
		else:
			return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@login_required
def get_rooms(request):
	rooms = CurrentGame.objects.all().values("game_id")
	return JsonResponse({"rooms": list(rooms)})

# views.py
from django.http import JsonResponse
from .models import User

def get_online_users(request):
    online_users = Users.objects.filter(is_online=True)  # Assurez-vous d'avoir un champ is_online pour cela.
    users_data = [{"username": users.name, "image": users.image.url} for users in online_users]
	
    return JsonResponse({"online_users": users_data})
