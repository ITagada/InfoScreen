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
    console.log('Stops data', stops);

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

        var stopData = stop.station;

        var stopElement = document.createElement('div');
        stopElement.className = 'stop';
        stopElement.style.left = stopData.position + '%';
        stopElement.dataset.index = index;
        stopElement.title = stopData.name;
        routeElement.appendChild(stopElement);

        var labelWrapper = document.createElement('div');
        labelWrapper.className = 'label-wrapper';
        labelWrapper.style.left = stopData.position + '%';

        var labelElement = document.createElement('div');
        labelElement.className = 'label';
        labelElement.style.left = stopData.position + '%';
        labelElement.innerText = stopData.name;
        labelElement.dataset.index = index;
        labelWrapper.appendChild(labelElement);
        routeElement.appendChild(labelWrapper);
    });

    var currentIndex = 0;

    // Основная логика иммитации передвижения
    function updateRoute(currentStop, nextStop) {
        var stopElements = document.querySelectorAll('.stop');
        var labelWrappers = document.querySelectorAll('.label-wrapper');

        currentIndex = stops.findIndex(stop => stop.station.name === currentStop.name);

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
            completedSegment.style.width = stops[currentIndex].station.position + '%';
        } else {
            completedSegment.style.width = '0%';
        }

        // Добавляем класс анимации перед обновлением текста
        currentStopElement.classList.add('change-station-animation');
        nextStopElement.classList.add('change-station-animation');

        // Функция создания контейнера под передаваемые данные и передача в
        // него данных
        setTimeout(() => {
            currentStopElement.innerText = currentStop.name.toUpperCase() + " / " + currentStop.name2.toUpperCase();
            if (nextStop && stops[currentIndex + 1] && currentIndex < stops.length - 1) {
                nextStopElement.innerText = 'Следующая остановка / Next station: ' + nextStop.name + " / " + nextStop.name2;
            } else {
                nextStopElement.innerText = 'Конечная остановка / Ending station';
            }
            displayTransitions(currentStop.transfers);

            // Удаляем класс анимации после завершения анимации
            setTimeout(function () {
                currentStopElement.classList.remove('change-station-animation');
                nextStopElement.classList.remove('change-station-animation');
            }, 500);
        }, 10);
    }

    // Функция создания контейнера под передаваемые данные и передача в него
    // данных
    function displayTransitions(transfers) {
        transitionsContainer.innerHTML = '';
        setTimeout(() => {
            if (transfers && transfers.length > 0) {
                transfers.forEach(function (transfer){
                    var transferElement = document.createElement('div');
                    transferElement.className = 'transition';
                    // transferElement.classList.add('change-station-animation');

                    var icoTransitionElement = document.createElement('div');
                    icoTransitionElement.className = 'ico';
                    icoTransitionElement.id = 'ico';

                    // Формируем текст иконки из iconparts
                    var iconText = '';
                    transfer.iconparts.forEach(function(iconpart) {
                        iconText += `${iconpart.symbol} `;
                    });
                    icoTransitionElement.innerText = iconText.trim();

                    transferElement.appendChild(icoTransitionElement);

                    var transferText = document.createElement('div');
                    transferText.className = 'transfer-text';
                    transferText.innerText = `${transfer.transfer_name}`;
                    transferElement.appendChild(transferText);

                    transitionsContainer.appendChild(transferElement);

                    setTimeout(function (){
                        transferElement.classList.remove('change-station-animation');
                    }, 500);
                });
            } else {
                var noTransferElement = document.createElement('div');
                noTransferElement.className = 'no-transfer';
                // noTransferElement.classList.add('change-station-animation');
                noTransferElement.innerText = 'No transfers available';
                transitionsContainer.appendChild(noTransferElement);

                setTimeout(function (){
                    noTransferElement.classList.remove('change-station-animation');
                }, 500);
            }
        }, 10);
    }

    function createRunningTextContainer(text) {
        var existingRunningText = col2_2.querySelector('.running-text');
        if (existingRunningText) {
            existingRunningText.classList.remove('show');
            existingRunningText.classList.add('hide');
            setTimeout(function () {
                col2_2.removeChild(existingRunningText);
            }, 500);
        } else {
            var runningText = document.createElement('div');
            runningText.className = 'running-text';

            var textContainer = document.createElement('div');
            textContainer.classList.add('text-container');
            textContainer.innerText = text;

            runningText.appendChild(textContainer);
            col2_2.appendChild(runningText);

            setTimeout(function () {
                var textWidth = textContainer.scrollWidth;
                var containerWidth = runningText.clientWidth;

                textContainer.style.transform = 'translateX(' + containerWidth + 'px)';

                function animateText() {
                    var currentPosition = containerWidth;

                    function step() {
                        // Уменьшаем позицию текста на основе скорости
                        currentPosition -= 4; // Скорость можно настроить

                        // Если текст все еще видим в пределах контейнера
                        if (currentPosition + textWidth > 0) {
                            textContainer.style.transform = 'translateX(' + currentPosition + 'px)';
                            requestAnimationFrame(step);
                        } else {
                            // Сброс позиции текста в начальное положение
                            currentPosition = containerWidth;
                            textContainer.style.transform = 'translateX(' + currentPosition + 'px)';
                            requestAnimationFrame(step);
                        }
                    }

                    requestAnimationFrame(step);
                }

                runningText.classList.add('show');
                animateText();
            }, 0);
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
