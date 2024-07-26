from __future__ import absolute_import, unicode_literals

import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'infoscreen.settings')


app = Celery('infoscreen', broker='redis://redis:6379/1')

app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks('main.tasks')

app.conf.beat_schedule = {
    'check-and-sync-video-every-5-seconds': {
        'task': 'infoscreen.tasks.check_and_sync_video',
        'schedule': 5.0,
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')