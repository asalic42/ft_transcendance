from django.urls import path
from .views import signin, signup

urlpatterns = [
    path('', signin, name='signin'),
    path('create_account/', signup, name='signup'),
]

