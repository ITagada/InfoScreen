
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
    { "name": "Шоссе Энтузиастов", "name2": "Enthusiasts Highway",
      "position": 42.6 },
    { "name": "Авиамоторная", "name2": "Aviamotornaya street", "position": 56.8 },
    { "name": "Площадь Ильича", "name2": "Il'itch Square", "transitions": [
        {"stantion": "Римская", "stantion2": "Rimskaya", "lane": 10,
         "lane_name": "Люблинско-Дмитровская"},
    ], "position": 71.2 },
    { "name": "Марксистская", "name2": "Marksistskaya street", "transitions":[
        {"stantion": "Таганская", "stantion2": "Taganskaya", "lane": 5,
         "lane_name": "Кольцевая линия"},
        {"stantion": "Таганская", "stantion2": "Taganskaya", "lane": 7,
         "lane_name": "Таганско-Краснопресненская"}
    ], "position": 85.4 },
    { "name": "Третьяковская", "name2": "Tret'yakovskaya", "transitions": [
        {"stantion": "Новокузнетская", "stantion2": "Novokuznetskaya",
         "lane": 2,
         "lane_name": "Замоскворецкая"},
        {"stantion": "Третьяковская", "stantion2": "Tret'yakovskaya", "lane": 6,
         "lane_name": "Калужско-Рижская"},
    ], "position": 100 },
]

temperature = {'inside': 22, 'outside': 31}

def index(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            screen_width = data.get('screen_width')
            screen_height = data.get('screen_height')

            logger.info(f"Saved screen width={screen_width} and screen height={screen_height}")

            return JsonResponse({'screen_width': screen_width, 'screen_height': screen_height})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'fail1', 'message': 'Invalid JSON1'}, status=400)

    if (request.session.get('screen_width') == 1920) and (
            request.session.get('screen_height') == 1080):
        return redirect('get_screen_info')
    else: return redirect('get_screen_info2')



def get_screen_info(request):
    context = {
        'temperature': temperature,
        'stops': stops,
        'final_stop': stops[-1],
    }
    return render(request, 'main/get_screen_info.html', context)

def get_screen_info2(request):
    return render(request, 'main/get_screen_info2.html')
