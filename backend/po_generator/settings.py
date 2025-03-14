import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Determine which environment we're in
BASE_DB_NAME = os.getenv("BASE_DB_NAME")
ENVIRONMENT = os.getenv('ENVIRONMENT')

# Use the appropriate secret key based on environment
if ENVIRONMENT == 'production':
    SECRET_KEY = os.getenv('PRODUCTION_SECRET_KEY', 'django-insecure-default-key-for-production')
else:
    SECRET_KEY = os.getenv('DEVELOPMENT_SECRET_KEY', 'django-insecure-default-key-for-development')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DJANGO_DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,100.106.104.3,192.168.1.200').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'dj_rest_auth',
    
    # Local apps
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'po_generator.urls'

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

WSGI_APPLICATION = 'po_generator.wsgi.application'

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

# Database name includes environment to keep them separate

# Database settings with environment-specific configurations

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': f'{BASE_DB_NAME}_{ENVIRONMENT}',
        'USER': os.getenv('DB_USER', 'shaun'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

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
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/New_York'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Additional locations of static files
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    f'http://localhost:{os.getenv("DEV_FRONTEND_PORT", "3000")}',
    f'http://127.0.0.1:{os.getenv("DEV_FRONTEND_PORT", "3000")}',
    f'http://100.106.104.3:{os.getenv("DEV_FRONTEND_PORT", "3000")}',
    f'http://localhost:{os.getenv("PROD_FRONTEND_PORT", "4567")}',
    f'http://127.0.0.1:{os.getenv("PROD_FRONTEND_PORT", "4567")}',
    f'http://100.106.104.3:{os.getenv("PROD_FRONTEND_PORT", "4567")}',
    f'http://localhost:{os.getenv("DEV_BACKEND_PORT", "8000")}',
    f'http://127.0.0.1:{os.getenv("DEV_BACKEND_PORT", "8000")}',
    f'http://100.106.104.3:{os.getenv("DEV_BACKEND_PORT", "8000")}',
    f'http://localhost:{os.getenv("PROD_BACKEND_PORT", "8001")}',
    f'http://127.0.0.1:{os.getenv("PROD_BACKEND_PORT", "8001")}',
    f'http://100.106.104.3:{os.getenv("PROD_BACKEND_PORT", "8001")}',
    f'http://192.168.1.200:{os.getenv("PROD_FRONTEND_PORT", "4567")}',
    f'http://192.168.1.200:{os.getenv("PROD_BACKEND_PORT", "8001")}',
]

CORS_ALLOW_CREDENTIALS = True 