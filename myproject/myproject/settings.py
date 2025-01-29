"""
Django settings for myproject project.

Generated by 'django-admin startproject' using Django 5.1.2.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/


import os
from dotenv import load_dotenv

load_dotenv()  # Charge les variables d'environnement à partir du fichier .env

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["www.transcendance.42.paris", "transcendance.42.paris"]
CSRF_TRUSTED_ORIGINS = ["https://www.transcendance.42.paris", "https://transcendance.42.paris"]
# SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
# Connexion SSL
SECURE_SSL_REDIRECT = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Application definition

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
	'django.db.migrations.migration',
    'rest_framework',
    'social_django',
    'loginpage',
    'home_sys',
    'channels',
    'corsheaders',
]

AUTHENTICATION_BACKENDS = (
    'loginpage.backends.OAuth2_42',
    'django.contrib.auth.backends.ModelBackend',  # Authentification standard Django
)

import environ

env = environ.Env()
environ.Env.read_env()  # Lire le fichier .env

# Configuration OAuth pour 42

SOCIAL_AUTH_42_KEY = env('42_CLIENT_ID')
SOCIAL_AUTH_42_SECRET = env('42_CLIENT_SECRET')
SOCIAL_AUTH_42_SCOPE = ['public']  # Vous pouvez ajuster les scopes selon vos besoins

# Exemple d'URL d'autorisation
OAUTH2_AUTHORIZE_URL = 'https://api.intra.42.fr/oauth/authorize'

# L'URL de redirection après autorisation
OAUTH2_REDIRECT_URL = 'http://127.0.0.1:8000/oauth/callback/complete/42/'

# Pour le petit délire de la map avec la localisation ip
IP_LOCALISATION= env('MAP_IP_LOCALISATION')

# URL de redirection après l'authentification
#LOGIN_REDIRECT_URL = '/'  # Ou l'URL de votre choix
#LOGOUT_REDIRECT_URL = '/'  # Ou l'URL de votre choix

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
   	 'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'social_django.middleware.SocialAuthExceptionMiddleware',  # Ce middleware est utilisé par social-auth-app-django
    'corsheaders.middleware.CorsMiddleware',
]

ROOT_URLCONF = 'myproject.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

#WSGI_APPLICATION = 'myproject.wsgi.application'
ASGI_APPLICATION = 'myproject.asgi.application'


CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(os.environ.get('REDIS_HOST', 'redis'), 6379)],
            'capacity': 100,
            'expiry': 60,
        },
    },
}

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases


import os
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL', 'postgres://user:admin%40123@localhost:5432/mysqldb')
    )
}

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = [
    "https://localhost:8000",
    "https://transcendance.42.paris:8000",  # Ajouter ici l'URL de ton frontend si besoin
]

CORS_ALLOW_ALL_ORIGINS = True
MEDIA_URL = '/media/'

# Répertoire physique sur le disque où les fichiers médias seront stockés
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

