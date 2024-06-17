import json

from channels.generic.websocket import AsyncWebsocketConsumer


class ScreenConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'You have connected.'
        }))

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        pass
