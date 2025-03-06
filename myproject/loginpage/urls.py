# loginpage/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),  # This renders your HTML
    path('signin/', views.signin, name='sign_in'),
    path('sign-up/', views.signup, name='sign_up'),
    path('check_username/', views.check_username, name='check_username'),
    path('check_email/', views.check_email, name='check_email'),
    path('check_password_solidity/', views.check_password_solidity, name='check_password_solidity'),
]
