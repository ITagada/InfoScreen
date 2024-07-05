import logging
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

SECRET_KEY = 'django-insecure-vbp@#i_y%^shl6@inn^1%ujdrftw^4xa34fgvv0@7#y9*d@+a_'

DEBUG = True

ALLOWED_HOSTS = ['192.168.1.55', '127.0.0.1', 'localhost', '0.0.0.0']

""" Обязательные настройки: добавление приложений channels, daphne. 
 Так же нужно прописать ASGI_APPLICATION для какого приложения будет доступно асинхронная структура"""

INSTALLED_APPS = [
    'channels',
    'daphne',
    'main',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]


ASGI_APPLICATION = 'infoscreen.asgi.application'

""" Добавление слоев и обработчика бэка """

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': "channels_redis.core.RedisChannelLayer",
        'CONFIG': {
            'hosts': [('localhost', 6379)],
        }
    },
}



MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

SESSION_ENGINE = 'django.contrib.sessions.backends.signed_cookies'
SESSION_COOKIES = 'sessionid'
SESSION_SAVE_EVERY_REQUEST = True

SESSION_COOKIE_SECURE = False
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_AGE = 60 * 60 * 24

ROOT_URLCONF = 'infoscreen.urls'

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

# WSGI_APPLICATION = 'video.wsgi.application'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


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


LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


STATIC_URL = '/static/'

STATIC_ROOT = BASE_DIR / 'static'

STATICFILES_DIRS = [
    BASE_DIR / 'main/static',
]


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

"""Установка инструмента логирования и его настройка"""

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{asctime} {levelname} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'infoscreen/debug.log',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        __name__: {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        '': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
