from django.urls import path
from .views import home, theme1, theme2, theme3

urlpatterns = [
    path('', home, name='home'),
    path('theme1/', theme1, name='first-theme'),
    path('theme2/', theme2, name='second-theme'),
    path('theme3/', theme3, name='third-theme'),
]