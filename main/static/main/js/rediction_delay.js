let number = 0
let remainigSeconds = 10;
        const intervalID = setInterval(() => {
            document.getElementById('countdown-timer').textContent = `Переход на новую страницу через ${remainigSeconds--} сек`;
            if (remainigSeconds < 0) {
                clearInterval(intervalID);
                window.location = 'http://127.0.0.1:8000/get_screen_info/'
            }
        }, 1000)