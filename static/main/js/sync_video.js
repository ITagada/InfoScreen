document.addEventListener('DOMContentLoaded', function() {
    const socket = new WebSocket('ws://' + window.location.host + '/ws/video_sync/');
    let videoContainerCreated = false;
    let videoStarted = false;
    let videoElement;

    socket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        const command = data.command;
    // Отлавливаем пришедшую команду
        if (command === "start" && !videoStarted) {
            // Запускаем видео и фиксируем время
            const startTime = data.start_time;
            videoElement.currentTime = startTime;
            videoElement.play();
            videoStarted = true;
        } else if (command === "sync" && videoStarted) {
            // Запускаем синхронизацию
            const currentTime = data.current_time;
            const diff = Math.abs(videoElement.currentTime - currentTime);
            if (diff > 0.5) {
                videoElement.currentTime = currentTime;
            }
        }
    };

    //Функция создания контейнера для видеоплеера
    function createVideoElement() {
        setTimeout(() => {
            if (!videoContainerCreated) {
                const videoContainer = document.querySelector('.col-3-2')

                videoElement = document.createElement('video');
                videoElement.className = 'video';
                videoElement.classList.add('player-animation');
                videoElement.src = '/media/video/sample-30s.mp4';
                videoElement.controls = true;

                videoElement.addEventListener('pointerup', function () {
                    if (!videoStarted) {
                        socket.send(JSON.stringify({
                            'command': 'start',
                            'start_time': 0
                        }));
                        videoStarted = true;
                    } else {
                        socket.send(JSON.stringify({
                            'command': 'sync',
                            'current_time': videoElement.currentTime
                        }));
                    }
                });
                videoContainer.appendChild(videoElement);
                videoContainerCreated = true;
                setTimeout(function () {
                    videoElement.classList.remove('player-animation');
                }, 500);
            }
        }, 10);
    }
        //Функция удаления контейнера
        function removeVideoElement() {
            if (videoContainerCreated) {
                videoElement.pause();
                videoElement.remove();
                videoElement = null;
                videoContainerCreated = false;
                videoStarted = false;
            }
    }
    // Условия создания и удаления контейнера
    document.addEventListener('pointerup', function (){
        if (!videoContainerCreated) {
            createVideoElement();
        } else {
            removeVideoElement();
        }
    });

    // Установка интервала проверки синхронизации
    setInterval(function () {
        if (videoStarted) {
            socket.send(JSON.stringify({
                'command': 'sync',
                'current_time': videoElement.currentTime
            }));
        }
    }, 2000);
});

