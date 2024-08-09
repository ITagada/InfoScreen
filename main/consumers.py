import json
import time
import asyncio

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from django.core.cache import cache

from .views import get_global_status, set_global_status


class ScreenConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.group_name = None

    async def connect(self):
        self.group_name = 'route_updates'
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'You have connected.'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        command = text_data_json.get('command')

        if command == 'update_route':
            current_stop = text_data.get('current_stop')
            next_stop = text_data.get('next_stop')
            await self.send_command_to_client({
                'current_stop': current_stop,
                'next_stop': next_stop,
                })
        elif command == 'create_running_text':
            text = text_data_json.get('text')
            await self.send_command_to_client({
                'command': 'create_running_text',
                'text': text,
            })

    async def send_command_to_client(self, event):
        command = event.get('command')
        if command == 'update_route':
            current_stop = event.get('current_stop')
            next_stop = event.get('next_stop')
            current_status = event.get('status')
            await self.send(text_data=json.dumps({
                'command': 'update_route',
                'current_stop': current_stop,
                'next_stop': next_stop,
                'status': current_status
            }))
        elif command == 'create_running_text':
            text = event.get('text')
            await self.send(text_data=json.dumps({
                'command': 'create_running_text',
                'text': text,
            }))

class SyncVideoConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.client_cache_key = self.channel_name
        await self.channel_layer.group_add('video_sync_group', self.channel_name)
        await self.accept()

        # Инициализируем пустое состояние клиента в кэше
        client_data = cache.get('client_data', {})
        initial_data = {
            'start_time': 0,
            'server_time': None,
            'current_time': None,
            'client_time': None,
            'last_activity': time.time()
        }
        client_data[self.client_cache_key] = initial_data
        cache.set('client_data', client_data, timeout=None)

        self.cleanup_inactive_clients()

        # Отправляем последнее состояние всем новым клиентам
        last_state = get_global_status()
        await self.send(text_data=json.dumps({
            'command': 'get_state',
            **last_state  # Добавляем последнее состояние
        }))

    async def disconnect(self, close_code):
        # Удаляем ключ клиента из общего списка ключей
        client_data = cache.get('client_data', {})
        if self.client_cache_key in client_data:
            del client_data[self.client_cache_key]
            cache.set('client_data', client_data, timeout=None)

        await self.channel_layer.group_discard('video_sync_group', self.channel_name)

    def cleanup_inactive_clients(self, inactivity_threshold=20):
        # Получаем текущие данные клиентов из кэша
        client_data = cache.get('client_data', {})
        current_time = time.time()

        # Определяем, какие данные нужно удалить (по времени последней активности)
        keys_to_remove = [key for key, data in client_data.items()
                          if (current_time - data.get('last_activity')) > inactivity_threshold]

        # Удаляем устаревшие данные из словаря
        for key in keys_to_remove:
            del client_data[key]

        # Обновляем кэш с оставшимися данными
        cache.set('client_data', client_data, timeout=None)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if 'syncData' in data:
            data = data['syncData']
        command = data.get("command")

        if command == "start":
            await self.handle_start(data)
        elif command == "sync":
            await self.handle_sync(data)
        elif command == "stop":
            await self.handle_stop()
        elif command == "reset_time":
            await self.handle_reset_time()
        elif command == "get_state":
            await self.handle_get_state()
        else:
            await self.handle_sync(data)

    async def handle_start(self, data):
        start_time = data.get("start_time", 0)
        server_time = time.time()
        global_status = {
            'status': 'start',
            'start_time': start_time,
            'server_time': server_time,
        }
        set_global_status(global_status)
        await self.channel_layer.group_send(
            'video_sync_group',
            {
                'type': 'play_video',
                **global_status,
            }
        )

    async def handle_sync(self, data):
        client_send_time = data.get("client_time")
        current_time = data.get("current_time")
        client_data = cache.get('client_data', {})

        if client_send_time is not None and current_time is not None:
            client_data[self.client_cache_key] = {
                'current_time': current_time,
                'client_time': client_send_time,
                'server_time': time.time(),
                'last_activity': time.time()
            }
            cache.set('client_data', client_data, timeout=None)

    async def handle_stop(self):
        global_status = {
            'status': 'stop',
            'start_time': None,
            'server_time': None,
        }
        set_global_status(global_status)
        await self.channel_layer.group_send(
            'video_sync_group',
            {
                'type': 'stop_video',
                **global_status,
            }
        )

    async def handle_reset_time(self):
        await self.channel_layer.group_send(
            'video_sync_group',
            {
                'type': 'reset_video_time',
            }
        )

    async def handle_get_state(self):
        last_state = cache.get(self.client_cache_key)
        await self.send(text_data=json.dumps(last_state))

    async def play_video(self, event):
        self.cleanup_inactive_clients()
        start_time = event["start_time"]
        server_time = event["server_time"]

        await self.send(text_data=json.dumps({
            "command": "start",
            "start_time": start_time,
            "server_time": server_time,
        }))

    async def sync_video(self, event):
        current_time = event["current_time"]
        server_receive_time = event["server_time"]
        client_time = event["client_time"]

        await self.send(text_data=json.dumps({
            "command": "sync",
            "current_time": current_time,
            "server_time": server_receive_time,
            "client_time": client_time,
        }))

    async def stop_video(self, event):

        await self.send(text_data=json.dumps({
            "command": "stop",
        }))

    async def reset_video_time(self, event):

        await self.send(text_data=json.dumps({
            "command": "reset_time",
            "current_time": 0
        }))