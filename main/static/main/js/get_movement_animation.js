//Анимация имитации передвижения по маршруту
document.addEventListener('DOMContentLoaded', function(){
    var stops = JSON.parse(document.getElementById('stops-data').textContent);

    var routeElement = document.getElementById('route');
    var completedSegment = document.getElementById('completed-segment');
    var transitionsContainer = document.getElementById('col-1-1');

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

    function updateRoute() {
        var stopElements = document.querySelectorAll('.stop');
        var labelWrappers = document.querySelectorAll('.label-wrapper');

        stopElements.forEach(function(stopElement, index) {
            stopElement.classList.remove('completed', 'highlight');
            if (index < currentIndex) {
                stopElement.classList.add('completed');
            } else if (index === currentIndex) {
                stopElement.classList.add('highlight');
            }
        });

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

        if (currentIndex >= 0 && currentIndex < stops.length) {
            completedSegment.style.width = stops[currentIndex].position + '%';
        } else {
            completedSegment.style.width = '0%';
        }

        var currentStopElement = document.getElementById('current-stop');
        var nextStopElement = document.getElementById('next-stop');
        currentStopElement.innerText = stops[currentIndex].name.toUpperCase() + " / " + stops[currentIndex].name2.toUpperCase();
        if (currentIndex === stops.length -1) {
            nextStopElement.innerText = 'Конечная остановка / Ending station';
        } else {
            nextStopElement.innerText = 'Следующая остановка ' + stops[(currentIndex + 1) % stops.length].name +
                " / Next station is " +stops[(currentIndex + 1) % stops.length].name2;
        }
        displayTransitions(stops[currentIndex].transitions)
    }

    function displayTransitions(transitions) {
        transitionsContainer.innerHTML = '';
        if (transitions && transitions.length > 0) {
            transitions.forEach(function (transition){
               var transitionElement = document.createElement('div');
               transitionElement.className = 'transition';
               transitionElement.innerText = `${transition.lane} | ${transition.stantion} / ${transition.stantion2}`;
               transitionsContainer.appendChild(transitionElement);
            });
        } else {
            var noTransitionElement = document.createElement('div');
            noTransitionElement.className = 'picture';
            noTransitionElement.innerText = 'THIS IS YOUR PICTURE';
            transitionsContainer.appendChild(noTransitionElement);
        }
    }

    setInterval(function() {
        currentIndex = (currentIndex + 1) % stops.length;
        updateRoute();
    }, 2000);

    updateRoute();
});