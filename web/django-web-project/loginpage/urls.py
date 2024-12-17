# loginpage/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),  # This renders your HTML
    path('sign-in/', views.signin, name='sign_in'),
    path('sign-up/', views.signup, name='sign_up'),
]
