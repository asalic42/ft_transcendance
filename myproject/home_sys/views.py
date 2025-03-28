import os
import sys
import json
import uuid
import logging
import requests

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import logout, authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.views.decorators.cache import never_cache
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods, require_GET
from django.conf import settings
from django.db.models import Q
from django.template.loader import render_to_string
from django.urls import reverse
from django.contrib import messages
from django.contrib.sessions.models import Session
from django.utils import timezone

from zxcvbn import zxcvbn as passwordscore

from .models import * 
from .utils import add_pong_logic, send_notification_to_user

logger = logging.getLogger(__name__)

"""

							|>	 AUTHENTICATION	  <|
							|>	 PROFILE MANAGEMENT  <|
							|>   CHANNELS/MESSAGES   <|
							|>	 GAME MANAGEMENT	 <|
							|>	 SOCIAL FEATURES	 <|
							|>	 UTILITIES/MISC	  <|
"""



"""
							[=================================================================]
							|																 |
							|						> AUTHENTICATION <					   |
							|																 |
							|			auth.1) index		   auth.5) check_username	   |
							|			auth.2) signup		  auth.6) check_email		  |
							|			auth.3) signin		  auth.7) check_password	   |
							|			auth.4) signout									  |
							|																 |
							[=================================================================]
"""


"""
												auth.1)	[index]
							[---------------------------------------------------------------]

								- Index, autrement dit la toute première page de connexion

							[---------------------------------------------------------------]

"""

# Page d'accueil
@never_cache
def index(request):
	if request.user.is_authenticated:
		return redirect('home')
		
	storage = messages.get_messages(request)
	storage.used = True
	return render(request, 'login.html')


"""
												auth.2)	[signup]
							[---------------------------------------------------------------]

								- Permet de créer un nouveau compte si l'utilisateur
								  n'en a pas.

							[---------------------------------------------------------------]

"""

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
				'message': 'Username already taken'
			}, status=400)
			
		if User.objects.filter(email=email).exists():
			return JsonResponse({
				'status': 'error',
				'message': 'Email already taken'
			}, status=400)
			
		# Create a new user
		user = User.objects.create_user(username=username, email=email, password=password)
		
		user = authenticate(request, username=username, password=password)
		
		user_profile = Users.objects.get(user=user)
		
		if user is not None:
			login(request, user)

			user_profile.logstatus = True
			user_profile.is_online = True
			user_profile.session_key = request.session.session_key
			user_profile.save()

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
			
	# GET requests can return minimal data needed for the signup form
	return JsonResponse({'status': 'unauthenticated'})


"""
												auth.3)	[signin]
							[---------------------------------------------------------------]

								- Permet de se log à son compte utilisateur.

							[---------------------------------------------------------------]

"""


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
			
			user_profile = Users.objects.get(user=user)

			# Récupérer toutes les sessions actives de l'utilisateur
			sessions = Session.objects.filter(
				expire_date__gte=timezone.now(),
				session_key__in=Users.objects.filter(user=user).values_list('session_key', flat=True)
			)
			# Supprimer toutes les sessions sauf la nouvelle
			for session in sessions:
				if session.session_key != request.session.session_key:
					session.delete()

			login(request, user)

			try:
				user_profile.session_key = request.session.session_key
				user_profile.logstatus = True
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
			return JsonResponse({'status': 'unauthenticated', 'message': 'Wrong user/password'})
	return JsonResponse({'status': 'unauthenticated'})


"""
												auth.4)	[SIGNOUT]
							[---------------------------------------------------------------]
							
								- Permet de se logout de son compte utilisateur.
							
							[---------------------------------------------------------------]

"""


# Déconnexion de l'utilisateur
def signout(request):
		
	if request.user.is_authenticated:
		try:
			user_profile = Users.objects.get(user=request.user)
			user_profile.is_online = False
			user_profile.logstatus = False
			user_profile.save()
			
			# Déconnecter l'utilisateur
			logout(request)

			print("\033[34m1-FLUSH\033[0m")
			sys.stdout.flush()
			return redirect(f'https://{settings.IP_ADDR}:5000/')

		except Users.DoesNotExist:
			pass  # Ne rien faire si le profil de l'utilisateur n'est pas trouvé

	print("\033[34m3-FLUSH\033[0m")
	sys.stdout.flush()
	return redirect(f'https://{settings.IP_ADDR}:5000/')
	#return render(request, 'login.html')
	
	
"""
												auth.5)	[CHECK_USERNAME]
							[---------------------------------------------------------------]

								- Permet de regarder si le nom utilisateur est
								  déjà connu dans la bdd

							[---------------------------------------------------------------]

"""


@require_GET
def check_username(request):
	username = request.GET.get('username', '')
	if (User.objects.filter(username=username).exists()):
		return (JsonResponse({'is_taken' : True}))
	return (JsonResponse({'data' : False}))



"""
												auth.6)	[CHECK_EMAIL]
							[---------------------------------------------------------------]

								- Permet de regarder si l'email utilisateur est
								  déjà connu dans la bdd

							[---------------------------------------------------------------]

"""

@require_GET
def check_email(request):
	email = request.GET.get('email', '')
	if (User.objects.filter(email=email).exists()):
		return (JsonResponse({'is_taken' : True}))
	return (JsonResponse({'data' : False}))



"""
											auth.7)	[CHECK_PASSWORD_SOLIDITY]
							[---------------------------------------------------------------]

								- Permet de tester la solidité du mot de passe proposé

							[---------------------------------------------------------------]

"""

@require_GET
def check_password_solidity(request):
	password = request.GET.get('password', '')
	return (JsonResponse({'data' : passwordscore(password)['score']}))

#######################################################################################################


"""
							[=================================================================]
							|																 |
							|					  > PROFILE MANAGEMENT <					 |
							|																 |
							|	   profile.1) load_template	   profile.5) upload_avatar   |
							|	   profile.2) home				profile.6) settings_user   |
							|	   profile.3) delete_account	  							  |
							|	   profile.4) update_user_info							   |
							|																 |
							[=================================================================]
"""


"""
											profile.1)	[load_template]
							[---------------------------------------------------------------]

								- Permet de charger les templates

							[---------------------------------------------------------------]

"""
@never_cache
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
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
			user = request.user
			users_profile = Users.objects.get(user=user)

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
		tournaments_winner = {}
		games_T_CB_SEND = []
		for tournament_id in games_T_CB:
			tournament = Tournaments.objects.get(id=tournament_id)
			print(f'\033[34musers_profile.pk\033[0m {users_profile.pk} tournament.ids {tournament.ids}')
			sys.stdout.flush()
			if (users_profile.pk in tournament.ids):
				games_T_CB_SEND.append(tournament_id)
				winner = tournament.winner
				if users_profile == winner:
					tournament_color = 'green'
				else:
					tournament_color = 'red'
				tournaments_colors[tournament_id] = tournament_color
				tournaments_date[tournament_id] = tournament.date
				users_img = get_users_of_one_tournament(users_profile, tournament_id)
				tournaments_users[tournament_id] = users_img
				tournaments_winner[tournament_id] = tournament.winner.name if tournament.winner else "Inconnu"

		context = {
			'user': user,
			'games_P': games_P,
			'games_S_CB': games_S_CB,
			'games_M_CB': games_M_CB,
			'games_T_CB': games_T_CB_SEND,
			'tournaments_users': tournaments_users,
			'tournaments_colors': tournaments_colors,
			'tournaments_date': tournaments_date,
			'tournaments_winner': tournaments_winner
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
	
	elif page == "other_game_multi_room":
		all_games = casse_brique_room.objects.all() 
		context = {
			'all_games': all_games
		}

	elif page == "other_game_multi":
		context = {
			'game_id': kwargs.get('game_id'),
			'map_id': kwargs.get('map_id')
		}
	
	elif page == "game-distant":
		context = {
			'game_id': kwargs.get('game_id'),
			'id_t': kwargs.get('id_t')
		}

	elif page == "tournament_choice":
		context = {
			'all_games': tournament_room.objects.all(),
		}


	elif page == "tournament":
		existing_ids = set(Tournaments.objects.values_list('id', flat=True))
		waiting_room = set(tournament_room.objects.values_list('tournament_id', flat=True))
		next_id = 1
		print(f'setting {template_name}')

		while next_id in existing_ids or next_id in waiting_room:
			next_id += 1
	
		context = {
			'id_t': next_id
		}
	elif page == "tournament_page_id":
		print(f"Chargement du tournoi {kwargs.get('id_t')}")
		sys.stdout.flush()  # Force l'affichage du print si le serveur bufferise les logs
		template_name = "tournament.html"
		page = "tournament"
		context = {
			'id_t': kwargs.get('id_t')
		}	
	elif page == 'delete_success':
		if request.user.is_authenticated:
			user = request.user
			# Stocker des informations pour afficher dans le template si nécessaire
			username = user.username  # ou autre info que vous voulez conserver

			user_profile = Users.objects.get(user=request.user)
			user_profile.is_online = False
			user_profile.logstatus = False
			user_profile.has_been_cut = True
			user_profile.save()

			# Désactiver le mot de passe
			user.set_unusable_password()
			user.save()
			
			# Déconnecter l'utilisateur
			logout(request)
			
			# Passer les informations au template
			# page = '';
			context = {
				'username': kwargs.get('username')
			}
	else:
		context = {
		}

	# Vérifier l'existence du template dans le répertoire
	template_path = os.path.join(settings.BASE_DIR, 'home_sys', 'templates', f"{page}.html")
	if not os.path.exists(template_path):
		return JsonResponse({"error": "Page not found"}, status=404)

	return render(request, template_name, context)


"""
											profile.2)	[load_template]
							[---------------------------------------------------------------]

								- Charge le home

							[---------------------------------------------------------------]

"""

@never_cache
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def home(request):

	if (not request.user.is_authenticated):
		redirect('index')
	
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
											profile.3)	[delete_account]
							[---------------------------------------------------------------]

								- Permet de supprimer son compte utilisateur

							[---------------------------------------------------------------]

"""
""" @ensure_csrf_cookie
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def delete_account(request):
	return render(request, 'delete_account.html') """



"""
											profile.4)	[update_user_info]
							[---------------------------------------------------------------]

								- Permet de modifier son profil utilisateur

							[---------------------------------------------------------------]

"""
@ensure_csrf_cookie
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
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


	
"""
											profile.5)	[upload_avatar]
							[---------------------------------------------------------------]

								- Permet d'uploader une image de profil

							[---------------------------------------------------------------]

"""
	
@ensure_csrf_cookie
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def upload_avatar(request):
	if request.method == 'POST':
		try:
			user = request.user
			avatar_file = request.FILES.get('avatar')

			if not avatar_file:
				return JsonResponse({"status": "error", "message": "Aucun fichier sélectionné."})

			# Vérification du type de fichier (PNG ou JPG)
			allowed_extensions = ['.png', '.jpg', '.jpeg']
			file_extension = os.path.splitext(avatar_file.name)[1].lower()
			
			if file_extension not in allowed_extensions:
				return JsonResponse({
					"status": "error",
					"message": "Format de fichier non supporté. Utilisez .png ou .jpg."
				})

			# Vérification de la taille du fichier (max 4 Mo)
			max_size = 4 * 1024 * 1024  # 4 Mo en octets
			if avatar_file.size > max_size:
				return JsonResponse({
					"status": "error",
					"message": "Le fichier est trop lourd (max 4 Mo)."
				})

			# Récupère le profil utilisateur
			user_profile = Users.objects.get(user=user)
			user_profile.image = avatar_file
			user_profile.save()

			return JsonResponse({
				"status": "success",
				"message": "Avatar mis à jour.",
				"new_avatar_url": user_profile.image.url
			})

		except Users.DoesNotExist:
			return JsonResponse({"status": "error", "message": "Profil utilisateur non trouvé."})

	return JsonResponse({"status": "error", "message": "Requête invalide."})


"""
											profile.5)	[settings_user]
							[---------------------------------------------------------------]

								- Charge la page du profil utilisateur modifiable

							[---------------------------------------------------------------]

"""

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def settings_user(request):
	return (render(request, 'user-settings.html'))


"""
							[=================================================================]
							|																 |
							|					  > CHANNELS/MESSAGES <					  |
							|																 |
							|		chan.1) channels_page			chan.6) get_chans	   |
							|		chan.2) live_chat				chan.7) get_messages	|
							|		chan.3) does_channel_exist	   chan.8) post_message	|
							|		chan.4) post_chan										|
							|		chan.5) check_duplicate_private_channel				  |
							|																 |
							[=================================================================]
"""




"""
											chan.1)	[channels_page]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
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


"""
											chan.2)	[live_chat]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

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

"""
											chan.3)	[does_channel_exist]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@require_http_methods(["GET"])
def does_channel_exist(request, asked_name):

	try:
		listing = Chans.objects.get(name=asked_name)
		return JsonResponse({'status': 'success', 'private' : listing.private, 'id': listing.id})
	except Chans.DoesNotExist:
		return JsonResponse({'status': 'error'})
	
"""
											chan.4)	[post_chan]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
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

"""
											chan.5)	[check_duplicate_private_channel]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
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


"""
											chan.6)	[get_chans]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@require_http_methods(["GET"])
def get_chans(request):
	try:
		channels = list(Chans.objects.values('id', 'name', 'private'))
		
		return JsonResponse({'status': 'success', 'channels': channels}, status=200)
	except Exception as e:
		print(f"Erreur serveur: {str(e)}")
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	
"""
											chan.7)	[get_messages]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
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

"""
											chan.8)	[post_message]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
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
				send_notification_to_user(data.get('user2'), data.get('channel_name'))
		else:
			for user in Users.objects.all():
				if user.id != new_message.idSender:
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
	

"""
							[=================================================================]
							|																 |
							|					  > GAME MANAGEMENT <						|
							|																 |
							|	 game.1) add_solo_casse_brique	 game.5) tournament_page   |
							|	 game.2) add_pong				  game.6) map_view		  |
							|	 game.3) create_current_game	   game.7) get_rooms		 |
							|	 game.4) create_room			   game.8) get_online_users  |
							|																 |
							[=================================================================]
"""


"""
											game.1)	[add_solo_casse_brique]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

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
	

"""
											game.2)	[add_pong]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
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
											game.3)	[create_current_game]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def create_current_game(request, sender_id):
	try:
		created = CurrentGame.objects.create(game_id=sender_id)
		if created:
			return (render(request, 'game-distant.html', {'game_id':sender_id}))
		else:
			return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	
"""
											game.4)	[create_room]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
@require_http_methods(["POST"])
def create_room(request):
	try:
		data = json.loads(request.body)
		game_id = data.get('gameId')

		print("DEBUG 1")
		sys.stdout.flush()
		if not game_id:
			return JsonResponse({'error': 'gameId manquant'}, status=400)
		
		print("DEBUG 2")
		sys.stdout.flush()
		new_room, _ = CurrentGame.objects.get_or_create(
			game_id=game_id
		)

		return JsonResponse({
			'game_id': str(new_room.game_id)
		})
	
	except json.JSONDecodeError:
		return JsonResponse({'error': 'Donnes JSON invalides'}, status=400)
	except Exception as e:
		return JsonResponse({'error': str(e)}, status=500)
	return JsonResponse({"rooms": list(rooms)})

"""
											game.5)	[tournament_page]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def tournament_page(request):
	existing_ids = set(Tournaments.objects.values_list('id', flat=True))
	waiting_room = set(tournament_room.objects.values_list('tournament_id', flat=True))
	next_id = 1
	while next_id in existing_ids or next_id in waiting_room:
		next_id += 1
	
	return (render(request, 'tournament.html', {'id_t': next_id}))


"""
											game.6)	[map_view]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

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

"""
											game.7)	[get_rooms]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def get_rooms(request):
	rooms = CurrentGame.objects.all().values("game_id")
	return JsonResponse(list(rooms), safe=False)


"""
											game.8)	[get_online_users]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
def get_online_users(request):
	online_users = Users.objects.filter(is_online=True)
	offline_users = Users.objects.filter(is_online=False)

	users_online_data = [{"id": users.id, "username": users.name, "image": users.image.url, "deleted": users.has_been_cut} for users in online_users]
	users_offline_data = [{"id": users.id, "username": users.name, "image": users.image.url, "deleted": users.has_been_cut} for users in offline_users]
	print(f"{users_offline_data[0]}")
	sys.stdout.flush()
	return JsonResponse({"online_users": users_online_data, "offline_users" : users_offline_data})


"""
							[=================================================================]
							|																 |
							|					  > SOCIAL FEATURES <						|
							|																 |
							|	  social.1) add_friend			  social.5) block_user	 |
							|	  social.2) accept_friend		   social.6) remove_friend  |
							|	  social.3) decline_friend		  social.7) invite_friend  |
							|	  social.4) notification_page	   social.8) user_status	|
							|																 |
							[=================================================================]
"""

"""
											social.1)	[add_friend]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@ensure_csrf_cookie
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def add_friend(request, username):
	if request.method == 'POST':
		current_user = request.user.users
		other_user = get_object_or_404(User, username=username)

		
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
			# Sinon, ajouter l'utilisateur actuel dans la liste des demandes d'ami de l'utilisateur visité
			other_user.users.friends_request.add(current_user)
			return JsonResponse({'status': 'friend_request_sent'})

	return JsonResponse({'status': 'error'}, status=400)


"""
											social.2)	[accept_friend_request]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@ensure_csrf_cookie
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
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


"""
											social.3)	[decline_friend_request]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@ensure_csrf_cookie
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
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


"""
											social.4)	[notification_page]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
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



"""
											social.5)	[block_user]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@ensure_csrf_cookie
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
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



"""
											social.6)	[remove_friend]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@ensure_csrf_cookie
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
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


"""
											social.7)	[invite_friend]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@ensure_csrf_cookie
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
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

"""
											social.8)	[user_status]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
def user_status(request):
	users = Users.objects.all().values('id', 'is_online')
	
	return JsonResponse(list(users), safe=False)


"""
							[=================================================================]
							|																 |
							|						> UTILITIES/MISC <					   |
							|																 |
							|	  util.1) get_ip_info			  util.5) is_chan_private   |
							|	  util.2) check_pp				 util.6) postPv			|
							|	  util.3) getNameById			  util.7) get_chan_id	   |
							|	  util.4) doesUserHaveAccessToChan						   |
							|																 |
							[=================================================================]
"""

"""
											util.1)	[get_ip_info]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
def get_ip_info(request):
	url = f'https://ipinfo.io/json?token={settings.IP_LOCALISATION}'
	response = requests.get(url)
	return JsonResponse(response.json())


"""
											util.2)	[check_pp]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@require_GET
def check_pp(request, idU):
	try:
		user = get_object_or_404(Users, pk = idU)  # pk = primary key
		return JsonResponse({'status': 'success', 'img': user.image.url})
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)
	

"""
											util.3)	[getNameById]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@require_GET
def getNameById(request, idU):
	try:
		user = get_object_or_404(Users, pk = idU)  # pk = primary key
		return JsonResponse({'status': 'success', 'name': user.name})
	except User.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404)

"""
											util.4)	[doesUserHaveAccessToChan]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
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

"""
											util.5)	[is_chan_private]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@require_GET
def is_chan_private(request, idChan):
		chan = get_object_or_404(Chans, id = idChan)
		return JsonResponse({'is_private': chan.private})


"""
											util.6)	[postPv]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
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
	

"""
											util.7)	[get_chan_id]
							[---------------------------------------------------------------]

														...

							[---------------------------------------------------------------]

"""
@require_GET
def get_chan_id(request, chanName):
	try:
		chan = get_object_or_404(Chans, name = chanName)
		return JsonResponse({'status': 'success', 'id': chan.id})
	except Chans.DoesNotExist:
		return JsonResponse({'error': 'Chans not found'}, status=404)


""" ---------------------------------------- AUTRE ---------------------------------------------- """

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def game_page(request):
	return (render(request, 'game.html'))

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def game_choice_page(request):
	return (render(request, 'game-choice.html'))

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def game_mode_pong_page(request):
	return (render(request, 'game-mode-pong.html'))

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def game_type_pong_page(request):
	return (render(request, 'game-type-pong.html'))


@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def game_distant_page(request, game_id):
	return (render(request, 'game-distant.html', {'game_id':game_id}))

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def game_distant_page_t(request, game_id, id_t):
	return (render(request, 'game-distant-t.html', {'game_id':game_id, 'id_t':id_t}))

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def game_bot_page(request):
	return (render(request, 'game-bot.html'))

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def other_game(request):
	return (render(request, 'other_game.html'))

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def map_choice(request):
	return (render(request, 'map_choice.html'))

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def tournament_choice(request):
	tour = tournament_room.objects.all()
	return render(request, 'tournament_choice.html', {'all_games':tour})

""" @login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def casse_brique_room_choice(request):
	tour = casse_brique_room.objects.all()
	return render(request, 'other_game_multi_room.html', {'all_games':tour}) """

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def other_game_choice(request):
	return (render(request, 'other_game_choice.html'))

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def other_game_multi(request, game_id, map_id):
	return (render(request, 'other_game_multi.html', {'game_id':game_id, 'map_id':map_id}))



@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def tournament_page_id(request, id_t):
	return (render(request, 'tournament.html', {'id_t':id_t}))

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def button_test_page():
	users_list = User.objects.all()
	return JsonResponse({'users_list': users_list})

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def get_current_user_id(request):
	"""Renvoie l'ID de l'utilisateur actuellement connecté"""
	return JsonResponse({'userId': request.user.id})


@require_GET
def check_pseudo(request):
	pseudo = request.GET.get('pseudo', '')
	if (Users.objects.filter(pseudo=pseudo).exists()):
		return (JsonResponse({'is_taken' : True}))
	return (JsonResponse({'data' : False}))


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

"""
											[get_blocked]
							[---------------------------------------------------------------]

								- Permet de recup la liste des utilisateurs bloqués

							[---------------------------------------------------------------]

"""
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
@require_http_methods(["GET"])
def get_blocked(request, idPlayer):
	# Récupérer les IDs des utilisateurs bloqués par l'utilisateur spécifié (idPlayer)
	if not request.user.is_authenticated:
		return JsonResponse({'error': 'User not authenticated'}, status=401)
	current_user_profile = request.user.users
	
	all_users_id = [elmt.id for elmt in current_user_profile.blocked.all()]
	return JsonResponse({'blocked_users_ids': all_users_id})



"""
											[remove_blocked_user]
							[---------------------------------------------------------------]

								- Permet d enlever le status "blocked" d un utilisateur

							[---------------------------------------------------------------]

"""
@ensure_csrf_cookie
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
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


"""
											[invitation_declined]
							[---------------------------------------------------------------]

								- Permet de decliner une demande d ami

							[---------------------------------------------------------------]

"""
@ensure_csrf_cookie
@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
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


@login_required
def get_cb_rooms(request):
	rooms = casse_brique_room.objects.all().values('game_id', 'map_id')
	return JsonResponse(list(rooms), safe=False)

"""
											[delete_success]
							[---------------------------------------------------------------]
								- Permet de revoyer une réponse suite à la demande
								  de suppression du compte utilisateur			
							[---------------------------------------------------------------]

"""

""" def delete_success(request):
	# Vérifier si l'utilisateur est authentifié avant de continuer
	if request.user.is_authenticated:
		user = request.user
		# Stocker des informations pour afficher dans le template si nécessaire
		username = user.username  # ou autre info que vous voulez conserver
		
		# Désactiver le mot de passe
		user.set_unusable_password()
		user.save()
		
		# Déconnecter l'utilisateur
		logout(request)
		
		# Passer les informations au template
		return render(request, 'delete_success.html', {'username': username})
	else:
		# Rediriger vers une page publique si non authentifié
		return render(request, 'delete_success.html') """
	
@login_required
@require_http_methods(["POST"])
def create_cb_room(request):
	try:
		print("JE METS DANS LA DB LA ROOM")
		sys.stdout.flush()

		data = json.loads(request.body)
		game_id = data.get('gameId')
		map_id = data.get('mapId')

		if not game_id:
			return JsonResponse({'error': 'gameId manquant'}, status=400)
		if not map_id:
			return JsonResponse({'error': 'mapId manquant'}, status=400)

		
		new_room, _ = casse_brique_room.objects.get_or_create(
			game_id=game_id,
			map_id=map_id
		)

		return JsonResponse({
			'game_id': str(new_room.game_id),
			'map_id': str(new_room.map_id)
		})
	
	except json.JSONDecodeError:
		return JsonResponse({'error': 'Donnes JSON invalides'}, status=400)
	except Exception as e:
		return JsonResponse({'error': str(e)}, status=500)
	return JsonResponse({"rooms": list(rooms)})

# views.py
from django.http import JsonResponse
from .models import User

"""
													[profile_page]
							[---------------------------------------------------------------]

								- Charge la page du profile utilisateur NON modifiable

							[---------------------------------------------------------------]

"""

@login_required(login_url=f'https://{settings.IP_ADDR}:5000/')
def profile_page(request):
	return (render(request, 'profile.html'))


def check_user_authenticated(request):
	if request.user.is_authenticated:
		return JsonResponse({'authenticated': True, 'username' : request.user.username})
	else:
		return JsonResponse({'authenticated': False, 'username' : 'undefined'})