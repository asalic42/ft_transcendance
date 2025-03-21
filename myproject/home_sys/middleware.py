# middleware.py
class SPAMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        # Assure que le cookie de session est conservé pour les requêtes AJAX
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest' and not request.session.session_key:
            request.session.save()
        return response