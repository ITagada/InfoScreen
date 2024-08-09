
import json
import logging
import time
import xml.etree.ElementTree as ET

from django.shortcuts import render
from django.http import JsonResponse
from django.core.cache import cache
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from celery import shared_task

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logger.propagate = True

tree = ET.parse('/app/Nekras_Nizheg.bnt')
root = tree.getroot()

text_tree = ET.parse('/app/textset3_3.bit')
text_root = text_tree.getroot()

# Иммитация распаршенных данных от главного сервера
temperature = {'inside': 22, 'outside': 31}

global_sw = None
global_sh = None

GLOBAL_STATUS_KEY = 'global_status'

# Функция парсер данных xml, которые будут поступать от главного сервера
def parse_station(station):
    name = station.attrib.get('name')
    side = station.attrib.get('side')
    up = station.attrib.get('up')
    skip = station.attrib.get('skip')
    pos = station.attrib.get('pos')
    cityexit = station.attrib.get('cityexit')
    metro_transfer = station.attrib.get('metro_transfer')

    pname = name.split('|')
    name = pname[0]
    name2 = pname[1]

    transfers = []

    for transfer in station.findall('transfer'):
        transfer_name = transfer.attrib.get('name')
        crossplatform = transfer.attrib.get('crossplatform')
        isshow = transfer.attrib.get('isshow')

        iconparts = []

        if transfer_name != "|":
            for icon in transfer.findall('icon/iconpart'):
                color = icon.attrib.get('color')
                symbol = icon.attrib.get('symbol')
                iconparts.append({'color': color, 'symbol': symbol})

            transfers.append({
                'transfer_name': transfer_name,
                'crossplatform': crossplatform,
                'isshow': isshow,
                'iconparts': iconparts,
            })
    return {
        'station': {
            'name': name,
            'name2': name2,
            'side': side,
            'up': up,
            'skip': skip,
            'pos': pos,
            'cityexit': cityexit,
            'metro_transfer': metro_transfer,
            'transfers': transfers
        }
    }

# Функция комплектовки данных парсера в формат - список словарей,
# с добавлением данных о позиции на маршруте
def get_stops():
    stops = []
    l = 100
    start = 0
    total_stops = len(root.findall('station'))

    if total_stops > 1:
        d = l / (total_stops - 1)
    else:
        d = 0

    for stop in root.findall('station'):
        stop_info = parse_station(stop)
        stops.append(stop_info)

    for i, stop_info in enumerate(stops):
        stop_info['station']["position"] = round(start, 3)
        start += d
    # print(stops)
    return stops

def parse_running_text(root):
    running_text = []
    for message in text_root.findall('message'):
        text = message.text.strip()
        color = message.attrib['color']
        type = message.attrib['type']
        time = message.attrib['time']
        speed = message.attrib['speed']
        running_text.append({
            'text': text,
            'color': color,
            'type': type,
            'time': time,
            'speed': speed
        })
    return running_text

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
    statuses = ['door_close', 'door_open', 'departure', 'moving_1', 'moving_2']

    current_index = cache.get('current_index', 0)
    next_index = (current_index + 1) % len(stops)
    update_count = cache.get('update_count', 0)
    current_status = cache.get('current_status', statuses[0])

    current_stop = stops[current_index]['station']
    next_stop = stops[next_index]['station']

    cache.set('current_stop_index', current_index)
    cache.set('current_index', next_index)

    if update_count == 4:
        current_status = statuses[(statuses.index(current_status) + 1) % len(statuses)]
        cache.set('update_count', 0)
    else:
        cache.set('update_count', update_count + 1)

    form_transfer = []

    for transfer in current_stop['transfers']:
        form_transfer.append({
            'transfer_name': transfer['transfer_name'],
            'crossplatform': transfer['crossplatform'],
            'isshow': transfer['isshow'],
            'iconparts': transfer['iconparts'],
        })

    current_stop_info = {
        'name': current_stop['name'],
        'name2': current_stop['name2'],
        'side': current_stop['side'],
        'up': current_stop['up'],
        'skip': current_stop['skip'],
        'pos': current_stop['pos'],
        'cityexit': current_stop['cityexit'],
        'metro_transfer': current_stop['metro_transfer'],
        'transfers': form_transfer,
        'position': current_stop['position'],
    }

    next_stop_info = {
        'name': next_stop['name'],
        'name2': next_stop['name2'],
        'position': next_stop['position'],
    }

    try:
        async_to_sync(channel_layer.group_send)(
            'route_updates',
            {
                'type': 'send_command_to_client',
                'command': 'update_route',
                'current_stop': current_stop_info,
                'next_stop': next_stop_info,
                'status': current_status,
            }
        )
    except Exception as e:
        return JsonResponse({'status': 'fail', 'message': str(e)})
    return render(request, 'main/send-update-route-command.html')

class RunningTextIterator:
    def __init__(self, running_text):
        self.running_text = running_text
        self.index = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.index < len(self.running_text):
            text_item = self.running_text[self.index]
            self.index += 1
            return text_item
        else:
            self.index = 0
            text_item = self.running_text[self.index]
            self.index += 1
            return text_item

running_text = parse_running_text(text_root)
iterator = RunningTextIterator(running_text)

def send_running_text_container_command(request):
    channel_layer = get_channel_layer()
    text_item = next(iterator)

    try:
        async_to_sync(channel_layer.group_send)(
            'route_updates',
            {
                'type': 'send_command_to_client',
                'command': 'create_running_text',
                'text': text_item['text'],
            }
        )
    except Exception as e:
        logger.error(f'Command send failed: {e}')
        return JsonResponse({'status': 'fail', 'message': str(e)})
    return render(request, 'main/send-update-route-command.html')

# Функция автоматического обновления данных у клиента при переподключении к
# сокету после потери конекта
def get_current_route_data(request):
    stops = get_stops()
    current_index = cache.get('current_stop_index', 0)
    next_index = (current_index + 1) % len(stops)

    current_stop = stops[current_index]['station']
    next_stop = stops[next_index]['station']

    return JsonResponse({'current_stop': current_stop, 'next_stop': next_stop})

# Функция обработчик страницы, передает в неё контекст в виде распаршенных
# данных от главного сервера
def get_screen_info(request):
    stops = get_stops()
    context = {
        'stops': [stop['station'] for stop in stops],
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
        'final_stop': stops[-1]['station'],
        'temperature': temperature,
    }
    return render(request, 'main/get_screen_info2.html', context)

def send_play_video_command(request):
    channel_layer = get_channel_layer()

    try:
        server_time = time.time()
        global_status = {
            'status': 'start',
            'start_time': 0,
            'server_time': server_time,
        }
        set_global_status(global_status)
        message = {
            'type': 'play_video',
            **global_status,
        }
        async_to_sync(channel_layer.group_send)('video_sync_group', message)
        return JsonResponse({'status': 'ok'})
    except Exception as e:
        logger.error(f'Command send failed: {e}')
        return JsonResponse({'status': 'fail', 'message': str(e)})
    return render(request, 'main/send-update-route-command.html')

def send_stop_video_command(request):
    channel_layer = get_channel_layer()

    try:
        global_status = {
            'status': 'stop',
            'start_time': None,
            'server_time': None,
        }
        set_global_status(global_status)
        message = {
            'type': 'stop_video',
            **global_status,
        }
        async_to_sync(channel_layer.group_send)('video_sync_group', message)
        return JsonResponse({'status': 'ok'})
    except Exception as e:
        logger.error(f'Command send failed: {e}')
        return JsonResponse({'status': 'fail', 'message': str(e)})
    return render(request, 'main/send-update-route-command.html')

def get_global_status():
    return cache.get(GLOBAL_STATUS_KEY, {
        'status': None,
        'start_time': None,
        'server_time': None,
    })

def set_global_status(status_data):
    cache.set(GLOBAL_STATUS_KEY, status_data, timeout=None)


# {
#     'stantion': {
#         'name': name,
#         'name2': name2,
#         'side': side,
#         'up': up,
#         'skip': skip,
#         'pos': pos,
#         'cityexit': cityexit,
#         'metro_transfer': metro_transfer,
#         'transfer': {
#             'transfer_name': transfer_name,
#             'crossplatform': crossplatform,
#             'isshow': isshow,
#             'iconpart': [color, symbol]
#         }
#     }
# }