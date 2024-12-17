from django.shortcuts import render, redirect
from django.http import HttpResponse
from .models import User
from django.contrib.auth.hashers import make_password, check_password

def index(request):
    return (render(request, 'index.html'))

def signup(request):

    if (request.method == 'POST'):
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')

        hashed_password = make_password(password)
        hashed_email    = make_password(email)

        user = User(username=username, email=hashed_email, password=hashed_password)
        user.save()

        return (HttpResponse("Utilisateur enregistré avec succès !"))
    
    return (render(request, ''))

def signin(request):

    if (request.method == 'POST'):
        username = request.POST.get('username')
        password = request.POST.get('password')

        try:
            user = User.objects.get(username=username)
        
        except User.DoesNotExist:
            return HttpResponse("Identification échouée.", status=404)

        if (check_password(password, user.password)):
            return (HttpResponse("Identification réussie."))
        return (HttpResponse("Identification échouée."))
    
    return (render(request, ''))