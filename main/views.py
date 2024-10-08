
import json
import logging
import xml.etree.ElementTree as ET

from django.shortcuts import render
from django.http import JsonResponse
from django.core.cache import cache
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logger.propagate = True

tree = ET.parse('/home/andrew_q/PycharmProjects/BNT/Nekras_Nizheg.bnt')
root = tree.getroot()

# Иммитация распаршенных данных от главного сервера
temperature = {'inside': 22, 'outside': 31}

global_sw = None
global_sh = None

# Функция парсер данных xml, которые будут поступать от главного сервера
def parse_station(station):
    name = station.attrib.get('name')
    transitions = []
    pname = name.split('|')
    name = pname[0]
    name2 = pname[1]
    for transition in station.findall('transfer'):
        transition_name = transition.attrib.get('name')
        if transition_name != '|':
            names = transition_name.split('|')
            station = names[0]
            station2 = names[1]
            transitions.append({"station": station, "station2": station2,
                                "lane": 0})
    return {
        'name': name,
        'name2': name2,
        'transitions': transitions
    }

# Функция комплектовки данных парсера в формат - список словарей,
# с добавлением данных о позиции на маршруте
def get_stops():
    stops = []
    l = 100
    start = 0
    for stop in root.findall('station'):
        stop_info = parse_station(stop)
        stops.append(stop_info)
    n = len(stops)
    d = l / (n - 1)
    for stop_info in stops:
        stop_info["position"] = format(start, '.3f')
        start += d
    return stops

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
                return JsonResponse({'redirect_url': 'get_screen_info2'})
            elif global_sw == 3840 and global_sh == 456:
                return JsonResponse({'redirect_url': 'get_screen_info'})
            else:
                return JsonResponse({'redirect_url': 'get_screen_info2'})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'fail1', 'message': 'Invalid JSON'}, status=400)

    else:
        return render(request, 'main/index.html')

# Функция обработчик команды на обновление маршрута от головного сервера
def send_update_route_command(request):
    stops = get_stops()
    channel_layer = get_channel_layer()

    current_index = cache.get('current_index', 0)
    next_index = (current_index + 1) % len(stops)

    current_stop = stops[current_index]
    next_stop = stops[next_index]

    cache.set('current_stop_index', current_index)
    cache.set('current_index', next_index)

    try:
        async_to_sync(channel_layer.group_send)(
            'route_updates',
            {
                'type': 'send_command_to_client',
                'command': 'update_route',
                'current_stop': current_stop,
                'next_stop': next_stop,
            }
        )
    except Exception as e:
        return JsonResponse({'status': 'fail', 'message': str(e)})
    return render(request, 'main/send-update-route-command.html')

# Функция автоматического обновления данных у клиента при переподключении к
# сокету после потери конекта
def get_current_route_data(request):
    stops = get_stops()
    current_index = cache.get('current_stop_index', 0)
    next_index = (current_index + 1) % len(stops)

    current_stop = stops[current_index]
    next_stop = stops[next_index]

    return JsonResponse({'current_stop': current_stop, 'next_stop': next_stop})

# Функция обработчик страницы, передает в неё контекст в виде распаршенных
# данных от главного сервера
def get_screen_info(request):
    stops = get_stops()
    context = {
        'stops': stops,
        'final_stop': stops[-1],
        'temperature': temperature,
    }
    return render(request, 'main/get_screen_info.html', context)

# Функция обработчик страницы, передает в неё контекст в виде распаршенных
# данных от главного сервера
def get_screen_info2(request):
    stops = get_stops()
    context = {
        'stops': stops,
        'final_stop': stops[-1],
        'temperature': temperature,
    }
    return render(request, 'main/get_screen_info2.html', context)
