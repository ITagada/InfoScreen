import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

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
                }
            )

    async def send_command_to_client(self, event):
        current_stop = event.get('current_stop')
        next_stop = event.get('next_stop')
        await self.send(text_data=json.dumps({
            'command': 'update_route',
            'current_stop': current_stop,
            'next_stop': next_stop,
        }))




class SyncVideoConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
            # Присоединение клиента к общей группе
        async_to_sync(self.channel_layer.group_add)(
            "video_sync_group",
            self.channel_name
        )

    def disconnect(self, close_code):
        # Отключение клиента от общей группы
        async_to_sync(self.channel_layer.group_discard)(
            "video_sync_group",
            self.channel_name
        )

    def receive(self, text_data):
        data = json.loads(text_data)
        command = data.get("command")

        if command == "sync":
            # Отправка команды синхронизации всем клиентам в группе
            async_to_sync(self.channel_layer.group_send)(
                "video_sync_group",
                {
                    "type": "sync_video",
                    "current_time": data.get("current_time")
                }
            )
        elif command == "start":
            # Отправка команды начала воспроизведения
            async_to_sync(self.channel_layer.group_send)(
                "video_sync_group",
                {
                    "type": "start_video",
                    "start_time": data.get("start_time")
                }
            )

    def sync_video(self, event):
        current_time = event["current_time"]
        self.send(text_data=json.dumps({
            "command": "sync",
            "current_time": current_time
        }))

    def start_video(self, event):
        start_time = event["start_time"]
        self.send(text_data=json.dumps({
            "command": "start",
            "start_time": start_time
        }))

