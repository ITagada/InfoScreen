document.addEventListener('DOMContentLoaded', function() {
    let socket;
    let videoContainerCreated = false;
    let videoStarted = false;
    let videoElement;
    let syncInterval;
    let serverTimeOffset = 0;  // Смещение времени сервера относительно клиента
    let videoStartTime = 0;

    function createSocket() {
        if (socket && socket.readyState === WebSocket.OPEN) {
            console.log('Socket already open');
            return;
        }

        socket = new WebSocket('ws://' + window.location.host + '/ws/video_sync/');

        socket.onopen = function () {
            console.log('VideoSocket is open');
            if (!syncInterval) {
                syncInterval = setInterval(syncTimeWithServer, 10000); // Периодическая синхронизация времени с сервером
            }
        }

        socket.onerror = function (error) {
            console.error('VideoSocket error:', error);
            clearInterval(syncInterval);
            syncInterval = null;
            setTimeout(createSocket, 10000);
        };

        socket.onmessage = function (e) {
            const data = JSON.parse(e.data);
            const command = data.command;

            if (command === "get_state") {
                handleState(data);
            } else if (command === "start") {
                videoStartTime = data.start_time;  // Получаем время начала от сервера
                handleStart(data);
            } else if (command === "sync_time") {
                syncServerTime(data.server_time); // Синхронизация времени с сервером
            } else if (command === "stop" && videoStarted) {
                handleStop();
            }
        };

        socket.onclose = function (event) {
            console.log('VideoSocket closed', event);
            clearInterval(syncInterval);
            syncInterval = null;
            setTimeout(createSocket, 10000);
        };
    }

    function syncTimeWithServer() {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({command: 'request_time'})); // Запрос текущего времени сервера
        }
    }

    function syncServerTime(serverTime) {
        const clientTime = Date.now() / 1000;
        serverTimeOffset = serverTime - clientTime; // Вычисляем смещение времени сервера относительно клиента
        console.log('Server time offset:', serverTimeOffset);
    }

    function handleState(data) {
        const status = data.status;

        if (status === 'start') {
            handleStart(data);
        } else if (status === 'stop') {
            handleStop();
        }
    }

    function handleStart(data) {
        if (!videoStarted) {
            createVideoElement();
            preloadVideo(); // Буферизация перед воспроизведением
        }

        const clientTime = Date.now() / 1000;
        const adjustedStartTime = videoStartTime - serverTimeOffset; // Корректируем время старта с учетом смещения
        const delay = adjustedStartTime - clientTime;

        if (delay > 0) {
            setTimeout(() => {
                startVideoPlayback();
            }, delay * 1000); // Ждем до начала воспроизведения
        } else {
            startVideoPlayback(); // Если задержка отрицательная, начинаем сразу
        }
    }

    function startVideoPlayback() {
        videoElement.currentTime = 0;
        videoElement.muted = true;
        videoElement.play().then(() => {
            videoStarted = true;
        }).catch((error) => {
            console.error('Autoplay error:', error);
        });
    }

    function handleStop() {
        removeVideoElement();
    }

    function preloadVideo() {
        if (videoElement) {
            videoElement.load(); // Буферизирует видео перед его воспроизведением
        }
    }

    createSocket();

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
            videoElement.src = '/media/video/Tried_Me_Mode.mp4';
            videoElement.controls = true;

            videoElement.onEnded = function() {
                if (videoStarted) {
                    videoElement.currentTime = 0;
                    videoElement.addEventListener('seeked', function onSeeked() {
                        videoElement.removeEventListener('seeked', onSeeked);
                        videoElement.play();
                        socket.send(JSON.stringify({
                            command: 'reset_time',
                        }));
                    });
                }
            };

            videoElement.addEventListener('ended', videoElement.onEnded);
            videoElement.addEventListener('timeupdate', videoElement.onTimeUpdate);

            videoContainer.appendChild(videoElement);
            videoContainerCreated = true;
            setTimeout(function () {
                videoElement.classList.remove('player-animation');
            }, 500);
        }
    }

    function removeVideoElement() {
        if (videoContainerCreated) {
            videoElement.pause();
            videoElement.removeEventListener('ended', videoElement.onEnded);
            videoElement.removeEventListener('timeupdate', videoElement.onTimeUpdate);
            videoElement.remove();
            videoElement = null;
            videoContainerCreated = false;
            videoStarted = false;
        }
    }

    window.addEventListener('beforeunload', function () {
        clearInterval(syncInterval);
    });
});
