
import json
import logging

from django.shortcuts import render, redirect
from django.http import JsonResponse

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logger.propagate = True


stops = [
    { "name": "Новокосино", "name2": "Novokosino", "position": 0 },
    { "name": "Новогиреево", "name2": "Novogireevo", "position": 14.2 },
    { "name": "Перово", "name2": "Perovo", "position": 28.4 },
    { "name": "Шоссе Энтузиастов", "name2": "Enthusiasts Highway", "position":
        42.6 },
    { "name": "Авиамоторная", "name2": "Aviamotornaya street", "position":
        56.8 },
    { "name": "Площадь Ильича", "name2": "Il'itch Square", "position": 71.2 },
    { "name": "Марксистская", "name2": "Marksistskaya street", "position":
        85.4 },
    { "name": "Третьяковская", "name2": "Tret'yakovskaya", "position": 100 },
]

def index(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            screen_width = data.get('screen_width')
            screen_height = data.get('screen_height')

            """Помещаем данные фронтенда в сессионные данные для их 
            дальнейшей обработки"""

            request.session['screen_width'] = screen_width
            request.session['screen_height'] = screen_height

            logger.info(f"Saved screen width={screen_width} and screen height={screen_height}")

            return JsonResponse({'screen_width': screen_width, 'screen_height': screen_height})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'fail1', 'message': 'Invalid JSON1'}, status=400)

    """Извлекаем сессионные данные и обрабатываем"""
    request.session['current_stop'] = stops[0]['name']
    request.session['next_stop'] = stops[1]['name']
    if (request.session.get('screen_width') == 1920) and (
            request.session.get('screen_height') == 1080):
        return redirect('get_screen_info')
    else: return redirect('get_screen_info2')



def get_screen_info(request):
    curent_stop = request.session.get('current_stop')
    next_stop = request.session.get('next_stop')
    context = {
        'current_stop': curent_stop,
        'next_stop': next_stop,
        'stops': stops
    }
    return render(request, 'main/get_screen_info.html', context)

def get_screen_info2(request):
    return render(request, 'main/get_screen_info2.html')
