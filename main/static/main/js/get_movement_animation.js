//Анимация имитации передвижения по маршруту
document.addEventListener('DOMContentLoaded', function(){
    var stops = JSON.parse(document.getElementById('stops-data').textContent);

    var routeElement = document.getElementById('route');
    var completedSegment = document.getElementById('completed-segment');
    var transitionsContainer = document.getElementById('col-1-1');
    var currentStopElement = document.getElementById('current-stop');
    var nextStopElement = document.getElementById('next-stop');

    // Создание необходимых контейнеров и наполнение их данными
    stops.forEach(function(stop, index) {
        var stopElement = document.createElement('div');
        stopElement.className = 'stop';
        stopElement.style.left = stop.position + '%';
        stopElement.dataset.index = index;
        stopElement.title = stop.name;
        routeElement.appendChild(stopElement);

        var labelWrapper = document.createElement('div');
        labelWrapper.className = 'label-wrapper';
        labelWrapper.style.left = stop.position + '%';

        var labelElement = document.createElement('div');
        labelElement.className = 'label';
        labelElement.style.left = stop.position + '%';
        labelElement.innerText = stop.name;
        labelElement.dataset.index = index;
        labelWrapper.appendChild(labelElement);
        routeElement.appendChild(labelWrapper);
    });

    var currentIndex = 0;

    // Основная логика иммитации передвижения
    function updateRoute(currentStop) {
        var stopElements = document.querySelectorAll('.stop');
        var labelWrappers = document.querySelectorAll('.label-wrapper');

        currentIndex = stops.findIndex(stop => stop.name === currentStop.name);

        stopElements.forEach(function(stopElement, index) {
            stopElement.classList.remove('completed', 'highlight');
            if (index < currentIndex) {
                stopElement.classList.add('completed');
            } else if (index === currentIndex) {
                stopElement.classList.add('highlight');
            }
        });

        // Функция обертки для анимации
        labelWrappers.forEach(function(labelWrapper, index) {
            var labelElement = labelWrapper.querySelector('.label');
            labelElement.classList.remove('completed-label', 'highlight-label');
            labelWrapper.classList.remove('highlight-label');
            if (index < currentIndex) {
                labelElement.classList.add('completed-label');
            } else if (index === currentIndex) {
                labelElement.classList.add('highlight-label');
                labelWrapper.classList.add('highlight-label');
            }
        });

        // Проверка текущего положения указателя остановки
        if (currentIndex >= 0 && currentIndex < stops.length) {
            completedSegment.style.width = stops[currentIndex].position + '%';
        } else {
            completedSegment.style.width = '0%';
        }

        // Добавляем класс анимации перед обновлением текста
        currentStopElement.classList.add('change-station-animation');
        nextStopElement.classList.add('change-station-animation');

        // Функция создания контейнера под передаваемые данные и передача в
        // него данных
        setTimeout(() => {
            currentStopElement.innerText = stops[currentIndex].name.toUpperCase() + " / " + stops[currentIndex].name2.toUpperCase();
            if (currentIndex === stops.length - 1) {
                nextStopElement.innerText = 'Конечная остановка / Ending station';
            } else {
                nextStopElement.innerText = 'Следующая остановка ' + stops[(currentIndex + 1) % stops.length].name +
                    " / Next station is " + stops[(currentIndex + 1) % stops.length].name2;
            }
            displayTransitions(stops[currentIndex].transitions);

            // Удаляем класс анимации после завершения анимации
            setTimeout(function () {
                currentStopElement.classList.remove('change-station-animation');
                nextStopElement.classList.remove('change-station-animation');
            }, 500);
        }, 10);
    }

    // Функция создания контейнера под передаваемые данные и передача в него
    // данных
    function displayTransitions(transitions) {
        transitionsContainer.innerHTML = '';
        setTimeout(() => {
            if (transitions && transitions.length > 0) {
                transitions.forEach(function (transition){
                   var transitionElement = document.createElement('div');
                   transitionElement.className = 'transition';
                   transitionElement.classList.add('change-station-animation');

                   var icoTransitionElement = document.createElement('div');
                   icoTransitionElement.className = 'ico';
                   icoTransitionElement.id = 'ico';
                   icoTransitionElement.innerText = `${transition.lane} `;
                   const text = icoTransitionElement.innerText.trim().toLowerCase();
                   switch (text) {
                       case '1':
                           icoTransitionElement.style.backgroundColor = '#ff0000';
                       break;
                       case '2':
                           icoTransitionElement.style.backgroundColor = '#00bb09';
                       break;
                       case '3':
                           icoTransitionElement.style.backgroundColor = '#0060e0';
                       break;
                       case '4':
                           icoTransitionElement.style.backgroundColor = '#51c7ff';
                       break;
                       case '5':
                           icoTransitionElement.style.backgroundColor = '#881616';
                       break;
                       case '6':
                           icoTransitionElement.style.backgroundColor = '#ff9326';
                       break;
                       case '7':
                           icoTransitionElement.style.backgroundColor = '#8802cd';
                       break;
                       case '8':
                           icoTransitionElement.style.backgroundColor = '#ffff24';
                       break;
                       case '9':
                           icoTransitionElement.style.backgroundColor = '#8a8a8a';
                       break;
                       case '10':
                           icoTransitionElement.style.backgroundColor = '#98fe69';
                       break;
                       case '11':
                           icoTransitionElement.style.backgroundColor = '#69fee7';
                       break;
                       case '12':
                           icoTransitionElement.style.backgroundColor = '#51afc1';
                       break;
                       default:
                           icoTransitionElement.style.backgroundColor = 'gray'
                   }
                   transitionElement.appendChild(icoTransitionElement);

                   var transitionText = document.createElement('div');
                   transitionText.className = 'transition-text';
                   transitionText.innerText = `${transition.stantion} / ${transition.stantion2}`;
                   transitionElement.appendChild(transitionText);

                   transitionsContainer.appendChild(transitionElement)

                   setTimeout(function (){
                       transitionElement.classList.remove('change-station-animation');
                   }, 500);
                });
            } else {
                var noTransitionElement = document.createElement('div');
                noTransitionElement.className = 'picture';
                noTransitionElement.classList.add('change-station-animation')
                noTransitionElement.innerText = 'THIS IS YOUR PICTURE';
                transitionsContainer.appendChild(noTransitionElement);

                setTimeout(function (){
                    noTransitionElement.classList.remove('change-station-animation');
                }, 500);
            }
        }, 10)
    }

    let url = `ws://${window.location.host}/ws/socket-server/`;
    let mainSocket;
    let pingInterval;
    let reconnectTimeout;

    function connectWebSocket() {
        mainSocket = new WebSocket(url);

        mainSocket.onmessage = function (e) {
            let data = JSON.parse(e.data);
            console.log('Data:', data);

            // Проверка команды и обновление маршрута
            if (data.command === "update_route") {
                updateRoute(data.current_stop, data.next_stop);
            }
        };

        mainSocket.onopen = function (e) {
            console.log('WebSocket connection opened');
            startPing();
        };

        mainSocket.onerror = function (e) {
            console.error('WebSocket error observed:', e);
            mainSocket.close();
        };

        mainSocket.onclose = function (e) {
            console.log('WebSocket connection closed.');
            mainSocket.close();
            stopPing();
            socketReconnect();
        };
    }

    function startPing() {
        pingInterval = setInterval(() => {
            if (mainSocket.readyState === WebSocket.OPEN) {
                mainSocket.send(JSON.stringify({'command': 'ping'}));
                console.log('Ping sent')
            }
        }, 1000);
    }

    function stopPing() {
        if (pingInterval) {
            clearInterval(pingInterval);
        }
    }

    function socketReconnect() {
        reconnectTimeout = setTimeout(() => {
            console.log('Reconnecting...');
            connectWebSocket();
        }, 1000);
    }

    connectWebSocket()

    if (stops.length > 0) {
        updateRoute(stops[0], stops[1]);
    }
});