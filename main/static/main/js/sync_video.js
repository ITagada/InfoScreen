document.addEventListener('DOMContentLoaded', function() {
    let socket;
    let videoContainerCreated = false;
    let videoStarted = false;
    let videoElement;
    let syncInterval;
    let lastCommand = null;
    let lastSyncTime = 0;
    let lastReceivedTime = 0;
    let lastVideoTime = 0;

    function createSocket() {
        socket = new WebSocket('ws://' + window.location.host + '/ws/video_sync/');

        socket.onopen = function () {
            console.log('VideoSocket is open');
            socket.send(JSON.stringify({
                'command': 'get_state'
            }));
        }

        socket.onerror = function (error) {
            console.error('VideoSocket error:', error);
        };

        socket.onmessage = function (e) {
            const data = JSON.parse(e.data);
            const command = data.command;

            if (command === "state") {
                if (videoStarted && (lastCommand === "start" || lastCommand === "sync")) {
                    socket.send(JSON.stringify({
                        'command': 'start',
                        'startTime': lastVideoTime,
                    }));
                } else if (command === "stop") {
                    removeVideoElement();
                }
            } else if (command === "start") {
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
                lastCommand = 'start';
                lastSyncTime = syncStartTime;
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
                console.log('Stop command received');
                removeVideoElement();
                lastCommand = 'stop';
            }
        };

        socket.onclose = function () {
            console.log('VideoSocket closed');
            clearInterval(syncInterval);
            setTimeout(createSocket, 1000); // Пауза перед повторным подключением
        };
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

            videoElement.addEventListener('ended', function () {
                if (videoStarted) {
                    videoElement.currentTime = 0;
                    videoElement.addEventListener('seeked', function onSeeked() {
                        videoElement.removeEventListener('seeked', onSeeked);
                        videoElement.play();
                    });
                }
            });

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

    function removeVideoElement() {
        if (videoContainerCreated) {
            videoElement.pause();
            videoElement.remove();
            videoElement = null;
            videoContainerCreated = false;
            videoStarted = false;
        }
    }

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
