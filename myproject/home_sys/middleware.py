from django.contrib.sessions.models import Session
from django.contrib.auth import logout

class SPAMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        # Assure que le cookie de session est conservé pour les requêtes AJAX
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest' and not request.session.session_key:
            request.session.save()
        return response

""" class MultiSessionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            session_key = request.session.session_key
            if session_key not in request.user.active_sessions:
                # Déconnecter l'utilisateur si l'ID de session n'est pas dans la liste des sessions actives
                logout(request)
        response = self.get_response(request)
        return response
 """