
import json

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

def index(request):
    return render(request, 'main/index.html')

@csrf_exempt
def get_screen_info(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            screen_width = data.get('screen_width')
            screen_height = data.get('screen_height')

            print(f"Screen width: {screen_width}, Screen height: {screen_height}")
            return JsonResponse({'status': 'success'})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'fail1', 'message': 'Invalid JSON1'}, status=400)

    return JsonResponse({'status': 'fail', 'message': 'Invalid JSON'}, status=400)
