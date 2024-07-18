import json

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from collections import defaultdict

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
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.video_times = {}

    # Присоединение клиента к общей группе
    async def connect(self):
        await self.channel_layer.group_add('video_sync_group', self.channel_name)
        await self.accept()

    # Отключение клиента от общей группы
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard('video_sync_group', self.channel_name)
        if self.channel_name in self.video_times:
            del self.video_times[self.channel_name]

    async def receive(self, text_data):
        data = json.loads(text_data)
        command = data.get("command")

        if command == "start":
            # Отправка команды синхронизации всем клиентам в группе
            start_time = data.get("start_time", 0)
            await self.channel_layer.group_send(
                'video_sync_group',
                {
                    'type': 'play_video',
                    'start_time': start_time,
                }
            )
        elif command == "sync":
            # Отправка команды начала воспроизведения
            current_time = data.get("current_time")
            self.video_times[self.channel_name] = current_time

            max_time = max(self.video_times.values())

            # await self.send(text_data=json.dumps({
            #     'command': 'max_time',
            #     'max_time': max_time,
            # }))

            if abs(max_time - current_time) > 0.5:
                await self.channel_layer.group_send(
                    'video_sync_group',
                    {
                        'type': 'sync_video',
                        'current_time': max_time,
                    }
                )
        elif command == "stop":
            await self.channel_layer.group_send(
                'video_sync_group',
                {
                    'type': 'stop_video',
                }
            )

    async def play_video(self, event):
        start_time = event["start_time"]
        await self.send(text_data=json.dumps({
            "command": "start",
            "start_time": start_time
        }))

    async def sync_video(self, event):
        current_time = event["current_time"]
        await self.send(text_data=json.dumps({
            "command": "sync",
            "current_time": current_time
        }))

    async def stop_video(self, event):
        await self.send(text_data=json.dumps({
            "command": "stop",
        }))

