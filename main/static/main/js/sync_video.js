document.addEventListener('DOMContentLoaded', function() {
    const socket = new WebSocket('ws://' + window.location.host + '/ws/video_sync/');
    let videoContainerCreated = false;
    let videoStarted = false;
    let videoElement;
    let syncInterval;

    socket.onopen = function () {
        console.log('VideoSocket is connected');
    };

    socket.onerror = function (error) {
        console.error('VideoSocket error:', error);
    };

    socket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        const command = data.command;

        // Отлавливаем пришедшую команду
        if (command === "start") {
            // Создаем контейнер для видеоплеера
            if (!videoStarted) {
                createVideoElement();
            }

            // Запускаем видео и фиксируем время
            const startTime = data.start_time;
            videoElement.currentTime = startTime;
            videoElement.muted = true;
            videoElement.play().then(() => {
                //videoElement.muted = false;
                videoStarted = true;
            }).catch((error) => {
                console.error('Autoplay error:', error);
            });
        } else if (command === "sync" && videoStarted) {
            // Запускаем синхронизацию
            const currentTime = data.current_time;
            const diff = Math.abs(videoElement.currentTime - currentTime);
            if (diff > 0.5) {
                videoElement.currentTime = currentTime;
            }
        } else if (command === "stop" && videoStarted) {
            removeVideoElement();
        }
    };

    socket.onclose = function () {
        console.log('VideoSocket closed');
        clearInterval(syncInterval);
    }

    // Функция создания контейнера для видеоплеера
    function createVideoElement() {
        if (!videoContainerCreated) {
            const videoContainer = document.querySelector('.col-3-2');

            if (!videoContainer) {
                console.error('Video container not found');
                return;
            }

            videoElement = document.createElement('video');
            videoElement.className = 'video';
            videoElement.classList.add('player-animation');
            videoElement.src = '/media/video/sample-30s.mp4';
            videoElement.controls = true;

            videoElement.addEventListener('ended', function () {
                if (videoStarted) {
                    videoElement.currentTime = 0;
                    videoElement.addEventListener('seeked', function onSeeked() {
                        videoElement.removeEventListener('seeked', onSeeked);
                        videoElement.play();
                    });
                }
            });

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

            // Отправка текущего времени при обновлении времени воспроизведения
            videoElement.addEventListener('timeupdate', function () {
                if (videoStarted && socket.readyState === WebSocket.OPEN) {
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
    }

    // Функция удаления контейнера
    function removeVideoElement() {
        if (videoContainerCreated) {
            videoElement.pause();
            videoElement.remove();
            videoElement = null;
            videoContainerCreated = false;
            videoStarted = false;
        }
    }

    // Установка интервала проверки синхронизации
    syncInterval = setInterval(function () {
        if (videoStarted && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                'command': 'sync',
                'current_time': videoElement.currentTime
            }));
        }
    }, 1000);

    window.addEventListener('beforeunload', function () {
        clearInterval(syncInterval);
    });
});