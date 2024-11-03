from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User

from django.views.decorators.cache import never_cache

# Create your views here.

"""
|
|    Pour la page du sign up,
|    donc la création et l'enregistrement d'un nouvel utilisateur.
|
"""
def signup(request):


    if (request.method == 'POST'):
        form = UserCreationForm(request.POST)
        
        if form.is_valid():
            print("DEBUG --> form.save()")
            form.save()
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password1')
            user = authenticate(username=username, password=password)
            login(request, user)

            return (redirect('home'))
    
    else:
        form = UserCreationForm()
    return (render(request, 'signup.html', {'form': form}))

"""
|
|    Pour la page de sign in,
|    tester si un utilisateur est connu, si oui, on redirige sur home.
|
"""

@never_cache
def signin(request):

    if request.user.is_authenticated:
        return redirect('home')

    if (request.method == 'POST'):
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        if (user is not None):
            login(request, user)
            return (redirect('home'))
        else:
            messages.error(request, "Il semble que tu sois nouveau, inscris toi.")
    return (render(request, 'signin.html'))
