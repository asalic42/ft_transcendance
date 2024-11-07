from django.urls import path
from . import views

urlpatterns = [
	path("", views.redirect_view, name="home"),
	path("home", views.home, name="home"),
	path("home2", views.home2, name="home2"),
	path("home3", views.home3, name="home3")
]