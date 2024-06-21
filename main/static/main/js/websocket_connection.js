let url = `ws://${window.location.host}/ws/socket-server/`

            const mainSocket = new WebSocket(url)

            mainSocket.onmessage = function(e){
                let data = JSON.parse(e.data)
                console.log('Data:', data);
            }

            mainSocket.onopen = function(e) {
                console.log('WebSocket connection opened');
            }

            mainSocket.onerror = function(e) {
                console.error('WebSocket error observed:', e);
            }

            mainSocket.onclose = function(e) {
                console.log('WebSocket connection closed.');
            }