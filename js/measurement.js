document.addEventListener('DOMContentLoaded', () => {
    console.log('measurement.js загружен');

    const pressureForm = document.getElementById('pressure-form');

    if (pressureForm) {
        // Установка текущей даты и времени при загрузке
        setCurrentDateTime();

        // Обработчик отправки формы
        pressureForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const systolic = document.getElementById('systolic').value;
            const diastolic = document.getElementById('diastolic').value;
            const pulse = document.getElementById('pulse').value;
            const datetime = document.getElementById('datetime').value;
            
            if (!systolic || !diastolic || !pulse || !datetime) {
                alert('Пожалуйста, заполните все поля формы');
                return;
            }
            
            saveMeasurement(systolic, diastolic, pulse, datetime);
            
            pressureForm.reset();
            setCurrentDateTime();
            
            // Показываем уведомление об успешном сохранении
            const notification = document.createElement('div');
            notification.className = 'success-notification';
            notification.textContent = 'Измерение успешно сохранено';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        });
    }
});