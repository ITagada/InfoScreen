document.addEventListener('DOMContentLoaded', function(){
    // Получение данных остановок из контейнера
    var stops = JSON.parse(document.getElementById('stops-data').textContent)
    console.log('Stops data', stops);

    // Создание контейнеров динамически
    var mainContainer = document.createElement('div');
    mainContainer.className = 'main';
    document.body.appendChild(mainContainer);

    var container1 = document.createElement('div');
    container1.className = 'container-1';
    container1.id = 'container-1';
    mainContainer.appendChild(container1);

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

    var container2 = document.createElement('div');
    container2.className = 'container-2';
    container2.id = 'container-2';
    mainContainer.appendChild(container2);

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

    var container3 = document.createElement('div');
    container3.className = 'container-3';
    container3.id = 'container-3';
    mainContainer.appendChild(container3);

    var col3_1 = document.createElement('div');
    col3_1.className = 'col-3-1';
    col3_1.id = 'col-3-1';
    container3.appendChild(col3_1);

    var col3_1_1 = document.createElement('div');
    col3_1_1.className = 'col-3-1-1';
    col3_1_1.id =  'col-3-1-1';
    col3_1.appendChild(col3_1_1);

    var col3_1_1_1 = document.createElement('div');
    col3_1_1_1.className = 'col-3-1-1-1';
    col3_1_1_1.id =  'col-3-1-1-1';
    col3_1_1_1.innerText = 'Поезд следует до остановки / Terminal station:';
    col3_1_1.appendChild(col3_1_1_1);

    var col3_1_1_2 = document.createElement('div');
    col3_1_1_2.className = 'col-3-1-1-2';
    col3_1_1_2.id = 'col-3-1-1-2';
    if (stops && stops.length > 0) {
        var lastStop = stops[stops.length - 1];
        var lastStopName = lastStop.station.name;
        var lastStopName2 = lastStop.station.name2;
    }
    col3_1_1_2.innerText = lastStopName + ' / ' + lastStopName2;
    col3_1_1.appendChild(col3_1_1_2);

    var col3_1_2 = document.createElement('div');
    col3_1_2.className = 'col-3-1-2';
    col3_1_2.id = 'col-3-1-2';
    col3_1.appendChild(col3_1_2);

    var time = document.createElement('div');
    time.className = 'time';
    time.id = 'time';
    col3_1_2.appendChild(time);

    var date = document.createElement('div');
    date.className = 'date';
    date.id = 'date';
    col3_1_2.appendChild(date);

    var col3_1_3 = document.createElement('div');
    col3_1_3.className = 'col-3-1-3';
    col3_1_3.id = 'col-3-1-3';
    col3_1.appendChild(col3_1_3);

    var temperature = document.createElement('div');
    temperature.className = 'temperature';
    temperature.id = 'temperature';
    temperature.innerText = 'температура воздуха:';
    col3_1_3.appendChild(temperature);

    var inside = document.createElement('div');
    inside.className = 'inside';
    inside.id = 'inside';
    col3_1_3.appendChild(inside);

    var insidehead = document.createElement('div');
    insidehead.className = 'insidehead';
    insidehead.id = 'insidehead';
    insidehead.innerText = 'в салоне / salon'
    inside.appendChild(insidehead);

    var insidebody = document.createElement('div');
    insidebody.className = 'insidebody';
    insidebody.id = 'insidebody';
    inside.appendChild(insidebody);

    var outside = document.createElement('div');
    outside.className = 'outside';
    outside.id = 'outside';
    col3_1_3.appendChild(outside);

    var outsidehead = document.createElement('div');
    outsidehead.className = 'outsidehead';
    outsidehead.id = 'outsidehead';
    outsidehead.innerText = 'на улице / outdoor'
    outside.appendChild(outsidehead);

    var outsidebody = document.createElement('div');
    outsidebody.className = 'outsidebody';
    outsidebody.id = 'outsidebody';
    outside.appendChild(outsidebody);

    var col3_2 = document.createElement('div');
    col3_2.className = 'col-3-2';
    col3_2.id = 'col-3-2';
    container3.appendChild(col3_2);

    function updateTime() {
        var nowDateTime = new Date();
        var dateOptions = {
             weekday: "short", year: "numeric", month: "long", day: "numeric"
        }   ;
        var timeOptions = {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        };
        var formattedDate = nowDateTime.toLocaleDateString('ru-RU', dateOptions);
        var formattedTime = nowDateTime.toLocaleTimeString('ru-RU', timeOptions);
        document.getElementById('time').innerText = formattedTime;
        document.getElementById('date').innerText = formattedDate;
    }
    setInterval(updateTime, 1000);

    updateTime();

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
    function updateRoute(currentStop, nextStop, status) {
        var stopElements = document.querySelectorAll('.stop');
        var labelWrappers = document.querySelectorAll('.label-wrapper');
        var completedSegment = document.getElementById('completed-segment');

        currentIndex = stops.findIndex(stop => stop.station.name === currentStop.name);

        // Удаление всех старых состояний
        stopElements.forEach(function(stopElement) {
            stopElement.classList.remove('highlight', 'completed');
        });

        labelWrappers.forEach(function(labelWrapper) {
            var labelElement = labelWrapper.querySelector('.label');
            labelElement.classList.remove('highlight-label', 'completed-label');
        });

        stopElements.forEach(function(stopElement, index) {
            if (index < currentIndex) {
                if (!stopElement.classList.contains('completed')) {
                    stopElement.classList.add('completed');
                }
            } else if (index === currentIndex) {
                stopElement.classList.add('highlight');
                stopElement.classList.remove('completed');
            } else {
                stopElement.classList.remove('highlight');
            }
        });

         labelWrappers.forEach(function(labelWrapper, index) {
            var labelElement = labelWrapper.querySelector('.label');
            if (index < currentIndex) {
                if (!labelElement.classList.contains('completed-label')) {
                    labelElement.classList.add('completed-label');
                }
            } else if (index === currentIndex) {
                labelElement.classList.add('highlight-label');
                labelWrapper.classList.add('highlight-label');
                labelElement.classList.remove('completed-label');
            } else {
                labelElement.classList.remove('highlight-label');
                labelWrapper.classList.remove('highlight-label');
            }
        });

        if (currentIndex >= 0 && currentIndex < stops.length) {
            completedSegment.style.width = stops[currentIndex].station.position + '%';
        }

        // Добавляем класс анимации перед обновлением текста
        currentStopElement.classList.add('change-station-animation');
        nextStopElement.classList.add('change-station-animation');

        setTimeout(() => {
            if (currentStop.name) {
                currentStopElement.innerText = currentStop.name.toUpperCase() + " / " + currentStop.name2.toUpperCase();
            }
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
        }, 100);
    }

    function sendPlayVideoCommand() {
        fetch('/send_play_video_command/')
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(err => console.error('Error sending play video command:', err));
    }

    function sendStopVideoCommand() {
        fetch('/send_stop_video_command/')
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(err => console.error('Error sending stop video command:', err));
    }

    function updateExitIndicator(doorStatus) {
        var col3_2 = document.querySelector('.col-3-2');
        var exitIndicator = document.getElementById('exit-indicator');

        if (!exitIndicator) {
            exitIndicator = document.createElement('div');
            exitIndicator.id = 'exit-indicator';
            exitIndicator.classList.add('exit-indicator');
            col3_2.appendChild(exitIndicator);

            var exitText = document.createElement('div');
            exitText.className = 'exit-text';
            exitText.id = 'exit-text';
            exitText.innerText = 'ВЫХОД / EXIT';
            exitIndicator.appendChild(exitText);

            var arrow = document.createElement('div');
            arrow.className = 'arrow';
            arrow.id = 'arrow';
            exitIndicator.appendChild(arrow);

            var person = document.createElement('div');
            person.className = 'person';
            person.id = 'person';
            exitIndicator.appendChild(person);
        }

        if (doorStatus === 'door_open' || doorStatus === 'door_close') {
            exitIndicator.style.display = 'flex';
            setTimeout(function () {
                exitIndicator.classList.add('show');
                exitIndicator.classList.remove('hide');
            }, 200);
        } else {
            exitIndicator.classList.add('hide');
            exitIndicator.classList.remove('show');
            setTimeout(function () {
                if (exitIndicator.classList.contains('hide')) {
                    exitIndicator.remove();
                }
            }, 500);
        }
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
                console.log('Status: ', data.status);

                if (data.status === 'moving_1') {
                    sendStopVideoCommand();
                }

                if (data.status === 'moving_2') {
                    sendPlayVideoCommand();
                }

                if (data.status === 'door_close') {
                    sendStopVideoCommand();
                    updateExitIndicator(data.status);
                }

                if (data.status === 'door_open') {
                    sendStopVideoCommand();
                    if (data.current_stop && data.next_stop) {
                        updateRoute(data.current_stop, data.next_stop, data.status);
                    }
                    updateExitIndicator(data.status);
                }

                if (data.status === 'departure') {
                    sendStopVideoCommand();
                    updateExitIndicator(data.status);
                }
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
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Data received:', data);
                    updateRoute(data.current_stop, data.next_stop, data.status);
                })
                .catch(error => {
                    console.error('Fetching data failed: ', error);
                });
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

    // if (stops.length > 0) {
    //     updateRoute(stops[0], stops[1]);
    // }
});
