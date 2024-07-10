document.addEventListener('DOMContentLoaded', function(){
    // Создание контейнеров динамически
    var container2 = document.getElementById('container-2');
    var container1 = document.getElementById('container-1');

    var col2_1 = document.createElement('div');
    col2_1.className = 'col-2-1';
    container2.appendChild(col2_1);

    var currentStopElement = document.createElement('div');
    currentStopElement.className = 'current-stop';
    currentStopElement.id = 'current-stop';
    currentStopElement.innerText = 'Current stop: ';
    col2_1.appendChild(currentStopElement);

    var nextStopElement = document.createElement('div');
    nextStopElement.className = 'next-stop';
    nextStopElement.id = 'next-stop';
    nextStopElement.innerText = 'Next stop: ';
    col2_1.appendChild(nextStopElement);

    var col2_2 = document.createElement('div');
    col2_2.className = 'col-2-2';
    container2.appendChild(col2_2);

    var linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = '/static/main/css/map_style.css';
    col2_2.appendChild(linkElement);

    var routeElement = document.createElement('div');
    routeElement.className = 'route';
    routeElement.id = 'route';
    col2_2.appendChild(routeElement);

    var completedSegment = document.createElement('div');
    completedSegment.className = 'completed-segment';
    completedSegment.id = 'completed-segment';
    routeElement.appendChild(completedSegment);

    // Получение данных остановок из контейнера
    var stops = JSON.parse(document.getElementById('stops-data').textContent);

    var headerChange = document.createElement('div');
    headerChange.className = 'col-1-1-1';
    headerChange.id = 'col-1-1-1';
    container1.appendChild(headerChange);

    var headerText = document.createElement('h2');
    headerText.innerText = 'Пересадки / Change here for';
    headerChange.appendChild(headerText);

    var transitionsContainer = document.createElement('div');
    transitionsContainer.className = 'col-1-1';
    transitionsContainer.id = 'col-1-1';
    container1.appendChild(transitionsContainer);

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

    function createRunningTextContainer(text) {
        var col2_2 = document.querySelector('.col-2-2');
        if (col2_2) {
            var runningText = document.createElement('div');
            runningText.className = 'running-text';
            runningText.innerText = text;
            col2_2.appendChild(runningText);
        }
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

            //Команда создания контейнера бегущей строки
            if (data.command === "create_running_text") {
                createRunningTextContainer(data.text);
            }
        };

        mainSocket.onopen = function (e) {
            console.log('WebSocket connection opened');
            startPing();
            fetch('/get-current-route-data/')
                .then(response => response.json())
                .then(data => {
                    updateRoute(data.current_stop, data.next_stop)
                })
                .catch(error => console.error('Fetching data: ', error));
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
