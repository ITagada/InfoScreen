
import json
import logging

from django.shortcuts import render, redirect
from django.http import JsonResponse

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logger.propagate = True

def index(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            screen_width = data.get('screen_width')
            screen_height = data.get('screen_height')

            """Помещаем данные фронтенда в сессионные данные для их 
            дальнейшей обработки"""

            request.session['screen_width'] = screen_width
            request.session['screen_height'] = screen_height

            logger.info(f"Saved screen width={screen_width} and screen height={screen_height}")

            return JsonResponse({'screen_width': screen_width, 'screen_height': screen_height})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'fail1', 'message': 'Invalid JSON1'}, status=400)

    """Извлекаем сессионные данные и обрабатываем"""

    if (request.session.get('screen_width') == 1920) and (
            request.session.get('screen_height') == 1080):
        return redirect('get_screen_info')
    else: return redirect('get_screen_info2')



def get_screen_info(request):
    return render(request, 'main/get_screen_info.html')

def get_screen_info2(request):
    return render(request, 'main/get_screen_info2.html')
