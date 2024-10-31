from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User

# Create your views here.

"""
|
|    Pour la page home,
|    autrement dit la page qui s'ouvre une fois qu'on est log.
|
"""

def home(request):
    users = User.objects.all()              # > Ici on récupe tous les users
    return (render(request, 'home.html', {'users': users}))

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
        
        return (redirect('delete_success'))

    return (render(request, 'delete_account.html'))

"""
|
|   Redirige sur la page correspondante quand le compte est effacé avec succès.
|
|
"""
def delete_success(request):
    return (render(request, 'delete_success.html'))