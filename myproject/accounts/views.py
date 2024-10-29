from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages

# Create your views here.

def home(request):
    return (render(request, 'home.html'))

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

def signin(request):

    if (request.method == 'POST'):
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        if (user is not None):
            login(request, user)
            return (redirect('home'))
        else:
            messages.error(request, "Utilisateur inconnu au bataillon, veuillez vous inscrire.")
    return (render(request, 'signin.html'))

def signout(request):
    logout(request)
    return (redirect('signin'))
