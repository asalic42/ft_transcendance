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
    storage = messages.get_messages(request)
    storage.used = True
    return render(request, 'index.html')


# Inscription d'un utilisateur
@never_cache
def signup(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')

        # Vérifier si un utilisateur existe déjà avec ce nom d'utilisateur ou cet email
        if User.objects.filter(username=username).exists():
            return HttpResponse("Ce nom d'utilisateur est déjà pris.", status=400)
        if User.objects.filter(email=email).exists():
            return HttpResponse("Cet email est déjà utilisé.", status=400)

        # Créer un nouvel utilisateur
        user = User.objects.create_user(username=username, email=email, password=password)
        user.save()

        userauth = authenticate(request, username=username, password=password)
        login(request, userauth)
        return (redirect('home'))
    
    return redirect('index')

# Connexion d'un utilisateur
@never_cache
def signin(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        # Utiliser la fonction authenticate pour vérifier les informations d'identification
        user = authenticate(request, username=username, password=password)

        if user is not None:
            # L'utilisateur existe et les informations sont correctes, se connecter
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, 'Login failed')
            return redirect('index')

    return redirect('index')

# Déconnexion de l'utilisateur
def signout(request):
    logout(request)
    return HttpResponse("Déconnexion réussie.")


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