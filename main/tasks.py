import time

from celery import shared_task

@shared_task
def check_and_sync_video():
    from django.core.cache import cache
    # Логика проверки синхронизации
    client_data = cache.get('client_data', {})
    if not client_data:
        return

    current_list = []

    for key, data in client_data.items():
        current_time = data.get('current_time')
        if current_time is not None:
            current_list.append(data.get('current_time'))

    max_time = max(current_list)
    min_time = min(current_list)
    current_server_time = time.time()

    for key, data in client_data.items():
        client_send_time = data.get('client_time')
        current_time = data.get('current_time')
        if current_time is not None and client_send_time is not None:
            round_trip_delay = current_server_time - client_send_time
            adjusted_time = current_time + round_trip_delay
            max_time = max(max_time, adjusted_time)
            min_time = min(min_time, adjusted_time)
    print(f'Client data: {client_data}')

    # Проверка рассинхронизации
    if abs(max_time - min_time) > 0.3:
        # Отправка сообщения на синхронизацию видео
        print('Syncing video to', max_time)
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'video_sync_group',
            {
                'type': 'sync_video',
                'current_time': max_time,
                'server_time': current_server_time,
                'client_time': list(client_data.values())[-1].get('client_time', 0),
            }
        )
    else:
        print('No sync needed')
    # print(f'Times: {list(client_data.keys())}')

# Эта задача будет запускаться каждые 5 секунд, если последняя команда на сокете не stop.
@shared_task
def schedule_check_and_sync_video():
    from .views import get_global_status
    last_command = get_global_status()
    if last_command['status'] != 'stop':
        check_and_sync_video.apply_async(countdown=5)
