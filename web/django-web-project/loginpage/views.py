from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.views.decorators.cache import never_cache

# Page d'accueil
def index(request):
    return render(request, 'index.html')

# Inscription d'un utilisateur
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

        return HttpResponse("Utilisateur enregistré avec succès !")
    
    return render(request, 'signup.html')

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
            return redirect('index')
    
    return render(request, 'index.html')

# Déconnexion de l'utilisateur
def signout(request):
    logout(request)
    return HttpResponse("Déconnexion réussie.")
