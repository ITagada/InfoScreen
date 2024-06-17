from django.urls import re_path

from . import consumers


""" Тут мы описываем маршрут открытия сокета"""
websocket_urlpatterns = [
    re_path(r'ws/socket-server/$', consumers.ScreenConsumer.as_asgi()),
]