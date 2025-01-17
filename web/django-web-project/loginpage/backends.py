from social_core.backends.oauth import BaseOAuth2
from urllib.parse import urlencode

class OAuth2_42(BaseOAuth2):
    """Backend OAuth2 pour 42."""
    name = '42'
    AUTHORIZATION_URL = 'https://api.intra.42.fr/oauth/authorize'
    ACCESS_TOKEN_URL = 'https://api.intra.42.fr/oauth/token'
    ACCESS_TOKEN_METHOD = 'POST'
    REFRESH_TOKEN_URL = 'https://api.intra.42.fr/oauth/token'
    REDIRECT_STATE = False
    SCOPE = ['public', 'profile', 'email']
    ID_KEY = 'id'

    def get_user_details(self, response):
        """Récupérer les informations de l'utilisateur depuis la réponse de l'API."""
        return {
            'username': response.get('login'),
            'email': response.get('email'),
        }

    def user_data(self, access_token, *args, **kwargs):
        """Obtenir les données utilisateur depuis l'API de 42."""
        url = 'https://api.intra.42.fr/v2/me'
        return self.get_json(url, params={'access_token': access_token})
