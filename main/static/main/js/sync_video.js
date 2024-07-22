document.addEventListener('DOMContentLoaded', function() {
    const socket = new WebSocket('ws://' + window.location.host + '/ws/video_sync/');
    let videoContainerCreated = false;
    let videoStarted = false;
    let videoElement;
    let syncInterval;
    let lastSyncTime = 0;
    let lastReceivedTime = 0;

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
            const serverTime = data.server_time;
            const clientTime = Date.now() / 1000;
            const syncStartTime = startTime + (clientTime - serverTime);
            videoElement.currentTime = syncStartTime;
            videoElement.muted = true;
            videoElement.play().then(() => {
                //videoElement.muted = false;
                videoStarted = true;
            }).catch((error) => {
                console.error('Autoplay error:', error);
            });
        // } else if (command === "max_time") {
        //   console.log('Max time: ', data.max_time);
        } else if (command === "sync" && videoStarted && !videoElement.paused) {
            const currentTime = data.current_time;
            const diff = Math.abs(videoElement.currentTime - currentTime);
            if (diff > 0.5) {
                videoElement.pause();
                videoElement.currentTime = currentTime;
                videoElement.play().then(() => {
                    console.log('Video synced and started again');
                }).catch((error) => {
                    console.error('Resyncing error:', error);
                });
                lastReceivedTime = currentTime;
            }
        } else if (command === "stop" && videoStarted) {
            console.log('Stop command received'); // Добавлен лог
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

            // Отправка текущего времени при обновлении времени воспроизведения
            videoElement.addEventListener('timeupdate', function () {
                if (videoStarted && !videoElement.paused && socket.readyState === WebSocket.OPEN) {
                    const currentTime = videoElement.currentTime;
                    const now = Date.now();

                    if (now - lastSyncTime > 1000) {
                        lastSyncTime = now;
                        socket.send(JSON.stringify({
                            'command': 'sync',
                            'current_time': currentTime
                        }));
                    }
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
            const currentTime = videoElement.currentTime;
            const now = Date.now();

            if (now - lastSyncTime > 1000) {
                lastSyncTime = now;
                socket.send(JSON.stringify({
                    'command': 'sync',
                    'current_time': currentTime
                }));
            }
        }
    }, 1000);

    window.addEventListener('beforeunload', function () {
        clearInterval(syncInterval);
    });
});
