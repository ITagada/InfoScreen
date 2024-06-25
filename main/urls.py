from django.urls import path, re_path

from . import views

urlpatterns = [
    path('', views.index),
    path('get_screen_info/', views.get_screen_info, name='get_screen_info'),
    path('get_screen_info2/', views.get_screen_info2, name='get_screen_info2'),
]