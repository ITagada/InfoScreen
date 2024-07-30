import time

from celery import shared_task

@shared_task
def check_and_sync_video():
    from django.core.cache import cache
    # Логика проверки синхронизации
    client_times_keys = cache.get('client_times_keys', [])
    if not client_times_keys:
        return

    max_time = float('-inf')
    min_time = float('inf')

    for key in client_times_keys:
        client_data = cache.get(key)
        if client_data:
            client_send_time = client_data.get('client_time')
            server_receive_time = client_data.get('server_receive_time')
            current_time = client_data.get('current_time')
            if current_time is not None and client_send_time is not None:
                round_trip_delay = time.time() - client_send_time
                adjusted_time = current_time + (round_trip_delay / 2)
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
            }
        )
    # print(f'Times: {client_times_keys}')

# Эта задача будет запускаться каждые 5 секунд, если последняя команда на сокете не stop.
@shared_task
def schedule_check_and_sync_video():
    from django.core.cache import cache
    last_command = cache.get('global_status', {}).get('status')
    if last_command != 'stop':
        check_and_sync_video.apply_async(countdown=5)
