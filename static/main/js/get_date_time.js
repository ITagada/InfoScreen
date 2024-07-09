
document.addEventListener('DOMContentLoaded', function(){
    function updateTime() {
        var now = new Date();
        var dateOptions = {
             weekday: "short", year: "numeric", month: "long", day: "numeric"
        }   ;
        var timeOptions = {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        };
        var formattedDate = now.toLocaleDateString('ru-RU', dateOptions);
        var formattedTime = now.toLocaleTimeString('ru-RU', timeOptions);
        document.getElementById('time').innerText = formattedTime;
        document.getElementById('date').innerText = formattedDate;
    }
        setInterval(updateTime, 1000);

        updateTime();
    });