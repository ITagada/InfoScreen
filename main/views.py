
import json
import logging

from django.shortcuts import render
from django.http import JsonResponse
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logger.propagate = True

# Иммитация распаршенных данных от главного сервера
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

# Иммитация распаршенных данных от главного сервера
temperature = {'inside': 22, 'outside': 31}

global_sw = None
global_sh = None

# Функция обработчик стартового экрана, которая принимает в себя данные о
# подключенных устройствах и, исходя из этого перенаправляет на ту или иную
# страницу
def index(request):
    global global_sw, global_sh
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            global_sw = data.get('screen_width')
            global_sh = data.get('screen_height')

            logger.info(f"Received screen width={global_sw} and screen "
                        f"height={global_sh}")

            if global_sw == 1920 and global_sh == 1080:
                return JsonResponse({'redirect_url': 'get_screen_info'})
            elif global_sw == 3840 and global_sh == 456:
                return JsonResponse({'redirect_url': 'get_screen_info'})
            else:
                return JsonResponse({'redirect_url': 'get_screen_info2'})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'fail1', 'message': 'Invalid JSON'}, status=400)

    else:
        return render(request, 'main/index.html')




def send_update_route_command(request):
    channel_layer = get_channel_layer()

    current_index = request.session.get('current_index', 0)
    next_index = (current_index + 1) % len(stops)

    current_stop = stops[current_index]
    next_stop = stops[next_index]

    request.session['current_index'] = next_index
    request.session.save()

    try:
        async_to_sync(channel_layer.group_send)(
            'route_updates',
            {
                'type': 'send_command_to_client',
                'command': 'update_route',
                'current_stop': current_stop,
                'next_stop': next_stop,
                'session_key': request.session.session_key,
            }
        )
    except Exception as e:
        return JsonResponse({'status': 'fail', 'message': str(e)})
    return render(request, 'main/send-update-route-command.html')

def get_current_route_data(request):
    current_index = request.session.get('current_index', 0)
    next_index = (current_index + 1) % len(stops)

    current_stop = stops[current_index]
    next_stop = stops[next_index]

    return JsonResponse({'current_stop': current_stop, 'next_stop': next_stop})

# Функция обработчик страницы, передает в неё контекст в виде распаршенных
# данных от главного сервера
def get_screen_info(request):
    context = {
        'stops': stops,
        'final_stop': stops[-1],
        'temperature': temperature,
    }
    return render(request, 'main/get_screen_info.html', context)

# Функция обработчик страницы, передает в неё контекст в виде распаршенных
# данных от главного сервера
def get_screen_info2(request):
    return render(request, 'main/get_screen_info2.html')
