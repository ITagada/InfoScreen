from django.urls import path

from . import views

urlpatterns = [
    path('', views.index),
    path("get_screen_info/", views.get_screen_info, name='get_screen_info'),
]