document.addEventListener('DOMContentLoaded', function() {
    let socket;
    let videoContainerCreated = false;
    let videoStarted = false;
    let videoElement;
    let syncInterval;
    let lastSyncTime = 0;

    function createSocket() {
        if (socket && socket.readyState === WebSocket.OPEN) {
            console.log('Socket already open');
            return; // Прекращаем создание нового соединения, если уже есть открытое
        }

        socket = new WebSocket('ws://' + window.location.host + '/ws/video_sync/');

        socket.onopen = function () {
            console.log('VideoSocket is open');
        }

        socket.onerror = function (error) {
            console.error('VideoSocket error:', error);
        };

        socket.onmessage = function (e) {
            const data = JSON.parse(e.data);
            const command = data.command;

            console.log(`Received command: ${command}`); // Логи для отладки

            if (command === "get_state") {
                handleState(data);
            } else if (command === "start") {
                handleStart(data);
            } else if (command === "sync" && videoStarted && !videoElement.paused) {
                handleSync(data);
            } else if (command === "stop" && videoStarted) {
                handleStop();
            }
        };

        socket.onclose = function (event) {
            console.log('VideoSocket closed', event);
            clearInterval(syncInterval);
            setTimeout(createSocket, 10000); // Пауза перед повторным подключением
        };
    }

    function handleState(data) {
        console.log(`Handling state: ${data.status}`); // Логи для отладки

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
        }

        const startTime = data.start_time;
        const serverTime = data.server_time;
        const clientTime = Date.now() / 1000;
        const syncStartTime = startTime + (clientTime - serverTime);
        videoElement.currentTime = syncStartTime;
        videoElement.muted = true;
        videoElement.play().then(() => {
            videoStarted = true;
        }).catch((error) => {
            console.error('Autoplay error:', error);
        });
        lastSyncTime = syncStartTime;
    }

    function handleSync(data) {
        console.log(`Handling sync: currentTime = ${data.current_time}`);
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
        }
    }

    function handleStop() {
        console.log('Handling stop');
        removeVideoElement();
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
            videoElement.src = '/media/video/sample-30s.mp4';
            videoElement.controls = true;

            videoElement.onEnded = function() {
                if (videoStarted) {
                    videoElement.currentTime = 0;
                    videoElement.addEventListener('seeked', function onSeeked() {
                        videoElement.removeEventListener('seeked', onSeeked);
                        videoElement.play();
                    });
                }
            };

            videoElement.onTimeUpdate = function() {
                if (videoStarted && !videoElement.paused && socket.readyState === WebSocket.OPEN) {
                    const currentTime = videoElement.currentTime;
                    const now = Date.now();

                    if (now - lastSyncTime > 10000) {
                        lastSyncTime = now;
                        socket.send(JSON.stringify({
                            'command': 'sync',
                            'current_time': currentTime
                        }));
                    }
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
            videoElement.removeEventListener('ended', videoElement.onEnded); // Убираем обработчик события
            videoElement.removeEventListener('timeupdate', videoElement.onTimeUpdate); // Убираем обработчик события
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
