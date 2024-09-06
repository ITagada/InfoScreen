document.addEventListener('DOMContentLoaded', function() {
    let socket;
    let videoElement;
    let timeOffset = 0;
    let videoReady = false;
    let playbackStarted = false;
    let playbackScheduled = false;
    const videoSrc = '/media/video/Tried_Me_Mode.mp4';
    const SYNC_REQUESTS = 10;
    const SYNC_INTERVAL = 60 * 1000;
    const START_DELAY = 2;

    async function init() {
        await syncTimeWithServer();
        createSocket();
        createVideoElement();  // Создание видео элемента заранее
        preloadVideo();  // Предварительная загрузка видео
        setInterval(syncTimeWithServer, SYNC_INTERVAL);
    }

    async function syncTimeWithServer() {
        let offsets = [];
        for (let i = 0; i < SYNC_REQUESTS; i++) {
            const offset = await getServerTimeOffset();
            offsets.push(offset);
        }
        offsets.sort();
        offsets = offsets.slice(1, -1);
        timeOffset = offsets.reduce((sum, val) => sum + val, 0) / offsets.length;
    }

    function getServerTimeOffset() {
        return new Promise((resolve, reject) => {
            const start = performance.now();
            fetch('/get_server_time')
                .then(response => response.json())
                .then(data => {
                    const end = performance.now();
                    const roundTrip = end - start;
                    const serverTime = data.server_time * 1000;
                    const clientTime = (start + end) / 2;
                    const offset = serverTime - clientTime;
                    resolve(offset);
                })
                .catch(err => reject(err));
        });
    }

    function createSocket() {
        socket = new WebSocket(`ws://${window.location.host}/ws/video_sync/`);

        socket.onopen = () => {
            console.log('WebSocket connection opened');
        };

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.command === 'start') {
                handleStartCommand(data.start_time);
            } else if (data.command === 'stop') {
                handleStopCommand();
            }
        };

        socket.onerror = (e) => {
            console.error('WebSocket error:', e);
        };

        socket.onclose = (e) => {
            console.log('WebSocket connection closed:', e);
            setTimeout(createSocket, 5000);
        };
    }

    function handleStartCommand(serverStartTime) {
        if (playbackStarted || playbackScheduled) return;
        const clientStartTime = serverStartTime * 1000 - timeOffset;
        const now = performance.now();
        const delay = clientStartTime - now;

        console.log(`Получена команда старт. Запуск через ${delay} ms`);

        if (delay < 0) {
            startPlayback();
        } else {
            playbackScheduled = true;
            startTimeoutId = setTimeout(() => {
                playbackScheduled = false;
                startPlayback();
            }, delay);
        }
    }

    function handleStopCommand() {
        if (playbackScheduled) {
            clearTimeout(startTimeoutId);
            playbackScheduled = false;
            console.log('Запланированное воспроизведение отменено');
        }

        if (videoElement) {
            videoElement.pause();
            videoElement.currentTime = 0;
            playbackStarted = false;
            hideVideoElement();
        }
    }

    function createVideoElement() {
        const videoContainer = document.querySelector('.col-3-2');

        if (!videoContainer) {
            console.error('Video container not found');
            return;
        }

        videoElement = document.createElement('video');
        videoElement.className = 'video';
        videoElement.classList.add('player-animation');
        videoElement.src = videoSrc;
        videoElement.controls = true;
        videoElement.muted = true; // Отключаем звук для возможности автостарта

        videoElement.onended = function() {
            if (playbackStarted) {
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

        videoContainer.appendChild(videoElement);
        hideVideoElement();
    }

    function preloadVideo() {
        videoElement.load();
        videoElement.addEventListener('canplaythrough', () => {
            videoReady = true;
        });
    }

    function startPlayback() {
        if (!videoReady) {
            console.log('Видео еще не готово, ожидание...');
            videoElement.oncanplaythrough = () => {
                videoReady = true;
                showVideoElement();
                videoElement.play().then(() => {
                    playbackStarted = true;
                    console.log('Video playback started');
                }).catch(err => console.error('Ошибка при воспроизведении:', err));
            };
        } else {
            showVideoElement();
            videoElement.play().then(() => {
                playbackStarted = true;
                console.log('Video playback started');
            }).catch(err => console.error('Ошибка при воспроизведении:', err));
        }
    }

    function showVideoElement() {
        if (videoElement) {
            videoElement.style.display = 'block';
        }
    }

    function hideVideoElement() {
        if (videoElement) {
            videoElement.style.display = 'none';
        }
    }

    init();
});
