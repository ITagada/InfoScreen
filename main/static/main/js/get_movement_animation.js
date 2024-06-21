
var stops = [
    { name: "Start", position: 0 },
    { name: "Stop 1", position: 25 },
    { name: "Stop 2", position: 50 },
    { name: "Stop 3", position: 75 },
    { name: "End", position: 100 }
];

var routeElement = document.getElementById('route');
var completedSegment = document.getElementById('completed-segment');

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

    if (currentIndex > 0) {
        completedSegment.style.width = stops[currentIndex].position + '%';
    } else {
        completedSegment.style.width = '0%';
    }
}

setInterval(function() {
    currentIndex = (currentIndex + 1) % stops.length;
    updateRoute();
}, 2000);

updateRoute();
