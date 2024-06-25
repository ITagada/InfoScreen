const videoElement = document.getElementById('video');
        const socket = new WebSocket('ws://' + window.location.host + '/ws/video_sync/');

        socket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            const command = data.command;

            if (command === "start") {
                const startTime = data.start_time;
                videoElement.currentTime = startTime;
                videoElement.play();
            } else if (command === "sync") {
                const currentTime = data.current_time;
                const diff = Math.abs(videoElement.currentTime - currentTime);
                if (diff > 0.5) {
                    videoElement.currentTime = currentTime;
                }
            }
        };

        socket.onopen = function(e) {
            // Начало воспроизведения видео
            socket.send(JSON.stringify({
                'command': 'start',
                'start_time': 0
            }));
        };

        // Периодическая синхронизация времени воспроизведения
        setInterval(function() {
            if (!videoElement.paused) {
                socket.send(JSON.stringify({
                    'command': 'sync',
                    'current_time': videoElement.currentTime
                }));
            }
        }, 5000);