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

# Creer une API django avec DRF (Django REST Framework)
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status 

# Import Serializers
from .serializers import SoloCasseBriqueSerializer


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
	return (redirect('signin'))

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
@api_view (['POST']) # Simplifie la gestion des requests HTTP
def addSoloCasseBrique(request):
	print("hello hello, je suis la bitch")
	if request.method == 'POST':

		# Deserialiser les donnees entrantes
		serializer = SoloCasseBriqueSerializer(data=request.data)

		if serializer.is_valid():
			# Save le nouvel objet dans la bdd
			new_game = serializer.save()

			# Reponse http sucess
			return Response({
				'status': 'success',
				'game': serializer.data
			}, status=status.HTTP_201_CREATED)
		else:
			# Reponse http echec
			return Response({
				'status': 'error',
				'message': 'Invalid data',
				'errors': serializer.errors
			}, status=status.HTTP_400_BAD_REQUEST)

# @csrf_exempt  # Désactive la protection CSRF pour cette vue (utile pendant les tests, mais à sécuriser en production)
# def add_solo_casse_brique(request):
# 	if request.method == 'POST':
# 		try:
# 			# Récupérer les données envoyées dans le corps de la requête
# 			data = json.loads(request.body)

# 			# Extraire les données spécifiques
# 			id_player = data['id_player']
# 			id_map = data['id_map']
# 			score = data['score']

# 			# Créer un nouvel enregistrement dans la base de données
# 			new_game = SoloCasseBrique.objects.create(
# 				id_player=id_player,
# 				id_map=id_map,
# 				score=score
# 			)

# 			# Retourner une réponse JSON avec un message de succès et les données du nouveau jeu
# 			response_data = {
# 				'id': new_game.id,
# 				'id_player': new_game.id_player,
# 				'id_map': new_game.id_map,
# 				'score': new_game.score,
# 				'date': new_game.date.isoformat(),  # La date doit être au format ISO
# 			}

# 			return JsonResponse({'status': 'success', 'game': response_data}, status=201)

# 		except KeyError:
# 			# Si certaines données sont manquantes, retourner une erreur 400
# 			return JsonResponse({'status': 'error', 'message': 'Missing required fields'}, status=400)
# 		except json.JSONDecodeError:
# 			# Si le JSON envoyé est invalide
# 			return JsonResponse({'status': 'error', 'message': 'Invalid JSON format'}, status=400)

# 	else:
# 		# Si la requête n'est pas de type POST, retourner une erreur 405 (Méthode non autorisée)
# 		return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
	
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



