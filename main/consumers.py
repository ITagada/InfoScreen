import json
import time
import asyncio

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from django.core.cache import cache

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
            await self.send(text_data=json.dumps({
                'command': 'update_route',
                'current_stop': current_stop,
                'next_stop': next_stop,
            }))
        elif command == 'create_running_text':
            text = event.get('text')
            await self.send(text_data=json.dumps({
                'command': 'create_running_text',
                'text': text,
            }))

class SyncVideoConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.client_cache_key = f'client_{self.channel_name}'
        await self.channel_layer.group_add('video_sync_group', self.channel_name)
        await self.accept()

        # Инициализируем пустое состояние клиента в кэше
        cache.set(self.client_cache_key, {
            'status': None,
            'start_time': None,
            'server_time': None,
            'current_time': None,
            'last_activity': time.time()
        }, timeout=None)

        # Добавляем ключ клиента в общий список ключей
        keys = cache.get('client_times_keys', [])
        if self.client_cache_key not in keys:
            keys.append(self.client_cache_key)
            cache.set('client_times_keys', keys, timeout=None)

        # Отправляем последнее состояние всем новым клиентам
        last_state = cache.get(self.client_cache_key)
        await self.send(text_data=json.dumps({
            'command': 'get_state',
            **last_state  # Добавляем последнее состояние
        }))

    async def disconnect(self, close_code):
        # Удаляем ключ клиента из общего списка ключей
        keys = cache.get('client_times_keys', [])
        if self.client_cache_key in keys:
            keys.remove(self.client_cache_key)
            cache.set('client_times_keys', keys, timeout=None)

        # Удаляем состояние клиента из кэша
        cache.delete(self.client_cache_key)
        await self.channel_layer.group_discard('video_sync_group', self.channel_name)

    def get_all_client_times(self):
        keys = cache.get('client_times_keys', [])
        client_times = {}
        for key in keys:
            client_data = cache.get(key)
            if client_data is not None and client_data['current_time'] is not None:
                client_times[key] = client_data['current_time']
        return client_times

    def cleanup_inactive_clients(self, inactivity_threshold=20):
        keys = cache.get('client_times_keys', [])
        current_time = time.time()
        for key in keys:
            client_data = cache.get(key)
            if client_data and (current_time - client_data.get('last_activity', 0)) > inactivity_threshold:
                cache.delete(key)
                keys.remove(key)
        cache.set('client_times_keys', keys, timeout=None)

    async def receive(self, text_data):
        data = json.loads(text_data)
        command = data.get("command")

        if command == "start":
            start_time = data.get("start_time", 0)
            server_time = time.time()
            await self.channel_layer.group_send(
                'video_sync_group',
                {
                    'type': 'play_video',
                    'start_time': start_time,
                    'server_time': server_time,
                }
            )
        elif command == "sync":
            current_time = data.get("current_time")
            client_data = cache.get(self.client_cache_key)
            if client_data:
                client_data['current_time'] = current_time
                client_data['last_activity'] = time.time()
                cache.set(self.client_cache_key, client_data, timeout=None)

            self.cleanup_inactive_clients()

            client_times = self.get_all_client_times()

            max_time = max(client_times.values(), default=current_time)
            min_time = min(client_times.values(), default=current_time)

            if abs(max_time - min_time) > 0.3:
                await self.channel_layer.group_send(
                    'video_sync_group',
                    {
                        'type': 'sync_video',
                        'current_time': max_time,
                    }
                )
            print('Its receive', max_time, min_time)
            # print('Fullie: ', client_times)
        elif command == "stop":
            await self.channel_layer.group_send(
                'video_sync_group',
                {
                    'type': 'stop_video',
                }
            )
        elif command == "get_state":
            last_state = cache.get(self.client_cache_key)
            await self.send(text_data=json.dumps(last_state))

    async def play_video(self, event):
        start_time = event["start_time"]
        server_time = event["server_time"]
        last_state = cache.get(self.client_cache_key)
        if last_state:
            last_state.update({
                'status': 'start',
                'start_time': start_time,
                'server_time': server_time,
            })
            cache.set(self.client_cache_key, last_state, timeout=None)

        await self.send(text_data=json.dumps({
            "command": "start",
            "start_time": start_time,
            "server_time": server_time,
        }))

    async def sync_video(self, event):
        current_time = event["current_time"]
        last_state = cache.get(self.client_cache_key)
        if last_state:
            cache.set(self.client_cache_key, last_state, timeout=None)

        await self.send(text_data=json.dumps({
            "command": "sync",
            "current_time": current_time
        }))

    async def stop_video(self, event):
        last_state = cache.get(self.client_cache_key)
        if last_state:
            last_state.update({
                'status': 'stop',
                'start_time': None,
                'server_time': None,
            })
            cache.set(self.client_cache_key, last_state, timeout=None)

        await self.send(text_data=json.dumps({
            "command": "stop",
        }))
