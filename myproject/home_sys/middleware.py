""" SPA MIDDLEWARE """

class SPAMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        # Assure que le cookie de session est conservé pour les requêtes AJAX
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest' and not request.session.session_key:
            request.session.save()
        return response

""" NO CACHE MIDDLEWARE """

class NoCacheMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Ajouter les en-têtes pour empêcher la mise en cache
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        return response