
import json

from django.shortcuts import render, redirect
from django.http import JsonResponse


def index(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            screen_width = data.get('screen_width')
            screen_height = data.get('screen_height')
            return JsonResponse({'screen_width': screen_width, 'screen_height': screen_height})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'fail1', 'message': 'Invalid JSON1'}, status=400)

    if JsonResponse({'screen_width': 1920}) and JsonResponse({'screen_height': 1080}):
        return redirect('get_screen_info')
    else:
        return redirect('get_screen_info2')

def get_screen_info(request):
    return render(request, 'main/get_screen_info.html')

def get_screen_info2(request):
    return render(request, 'main/get_screen_info2.html')
