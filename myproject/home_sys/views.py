from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.views.decorators.cache import never_cache

"""
|
|    Pour la page home,
|    autrement dit la page qui s'ouvre une fois qu'on est log.
|
"""

@login_required
@never_cache
def home(request):
    users = User.objects.all()              # > Ici on récupe tous les users
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
def game_page(request):
    return (render(request, 'game.html'))

@login_required
def game_mode_page(request):
    return (render(request, 'game_mode.html'))

@login_required
def game_bot_page(request):
    return (render(request, 'game_bot.html'))