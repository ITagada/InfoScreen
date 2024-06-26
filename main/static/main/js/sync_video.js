document.addEventListener('DOMContentLoaded', function() {
    const socket = new WebSocket('ws://' + window.location.host + '/ws/video_sync/');
    let videoContainerCreated = false;
    let videoStarted = false;
    let videoElement;

    socket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        const command = data.command;

        if (command === "start" && !videoStarted) {
            const startTime = data.start_time;
            videoElement.currentTime = startTime;
            videoElement.play();
            videoStarted = true;
        } else if (command === "sync" && videoStarted) {
            const currentTime = data.current_time;
            const diff = Math.abs(videoElement.currentTime - currentTime);
            if (diff > 0.5) {
                videoElement.currentTime = currentTime;
            }
        }
    };

    function createVideoElement() {
        if (!videoContainerCreated) {
            const videoContainer = document.querySelector('.col-3-2')

            videoElement = document.createElement('video');
            videoElement.className = 'video';
            videoElement.src = '/media/video/sample-30s.mp4';
            videoElement.controls = true;

            videoElement.addEventListener('click', function () {
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
        }
    }
    document.addEventListener('click', function (){
        createVideoElement();
    });

    setInterval(function () {
        if (videoStarted) {
            socket.send(JSON.stringify({
                'command': 'sync',
                'current_time': videoElement.currentTime
            }));
        }
    }, 2000);
});

