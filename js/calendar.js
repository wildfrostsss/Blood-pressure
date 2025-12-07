document.addEventListener('DOMContentLoaded', () => {
    console.log('calendar.js загружен');

    let currentDate = new Date();
    let selectedDate = null;

    const calendarContainer = document.getElementById('calendar-container');

    if (calendarContainer) {
        initCalendar();
    }

    function getDatesWithMeasurements() {
        const measurements = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const dates = new Set();
        measurements.forEach(measurement => {
            const date = new Date(measurement.datetime).toISOString().split('T')[0];
            dates.add(date);
        });
        return dates;
    }

    function generateCalendar(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        const firstDayIndex = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
        const lastDayIndex = lastDay.getDay() === 0 ? 7 : lastDay.getDay();
        const nextDays = 7 - lastDayIndex;
        
        const datesWithMeasurements = getDatesWithMeasurements();
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;

        const daysContainer = document.getElementById('calendar-days');
        daysContainer.innerHTML = '';

        for (let x = firstDayIndex - 1; x > 0; x--) {
            const day = prevLastDay.getDate() - x + 1;
            daysContainer.appendChild(createDayElement(day, true, false, false, ''));
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const isToday = dateString === todayString;
            const hasMeasurements = datesWithMeasurements.has(dateString);
            const isSelected = selectedDate === dateString;
            daysContainer.appendChild(createDayElement(i, false, isToday, hasMeasurements, dateString, isSelected));
        }

        for (let j = 1; j <= nextDays; j++) {
            daysContainer.appendChild(createDayElement(j, true, false, false, ''));
        }
    }

    function createDayElement(day, isOtherMonth, isToday, hasMeasurements, dateString, isSelected = false) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        if (isOtherMonth) dayElement.classList.add('other-month');
        if (isToday) dayElement.classList.add('today');
        if (hasMeasurements) dayElement.classList.add('has-measurements');
        if (isSelected) dayElement.classList.add('selected');
        if (!isOtherMonth && dateString) {
            dayElement.addEventListener('click', () => selectDate(dateString));
        }
        return dayElement;
    }

    function selectDate(dateString) {
        selectedDate = dateString;
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        
        const selectedDateObj = new Date(dateString);
        const formattedDate = selectedDateObj.toLocaleDateString('ru-RU');
        const measurementsListHeader = document.querySelector('.measurements-list h2');
        if(measurementsListHeader) {
            measurementsListHeader.textContent = `Измерения за ${formattedDate}`;
        }

        const measurements = getMeasurementsByDate(dateString);
        displayMeasurements(measurements);
        showSection('measurements-list');
    }

    function displayMeasurements(measurements) {
        const container = document.getElementById('measurements-container');
        if (!container) return;
        container.innerHTML = '';

        if (measurements.length === 0) {
            container.innerHTML = '<p class="no-measurements">Нет измерений за выбранную дату</p>';
            return;
        }

        measurements.forEach(measurement => {
            const measurementElement = document.createElement('div');
            measurementElement.className = 'measurement-item';
            const datetime = new Date(measurement.datetime);
            const formattedDate = datetime.toLocaleDateString('ru-RU');
            const formattedTime = datetime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const timestamp = new Date(measurement.datetime).getTime();
            
            measurementElement.innerHTML = `
                <div class="measurement-data">
                    <div class="measurement-values">
                        <span class="pressure">${measurement.systolic}/${measurement.diastolic}</span>
                        <span class="pulse">${measurement.pulse}</span>
                    </div>
                    <div class="measurement-datetime">
                        <span class="date">${formattedDate}</span>
                        <span class="time">${formattedTime}</span>
                    </div>
                </div>
                <div class="measurement-actions">
                    <button class="btn btn-small btn-delete" data-id="${timestamp}">Удалить</button>
                </div>`;
            container.appendChild(measurementElement);
        });
    }

    function handleDeleteButtonClick(event) {
        if (event.target.classList.contains('btn-delete')) {
            const id = event.target.getAttribute('data-id');
            if (confirm('Вы уверены, что хотите удалить это измерение?')) {
                if(deleteMeasurement(id)) {
                    // Обновляем отображение
                    const currentMeasurements = getMeasurementsByDate(selectedDate);
                    displayMeasurements(currentMeasurements);
                    // Обновляем сам календарь (точки)
                    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
                }
            }
        }
    }

    function initCalendar() {
        document.getElementById('prev-month').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });
        document.getElementById('next-month').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });

        const measurementsContainer = document.getElementById('measurements-container');
        if (measurementsContainer) {
            measurementsContainer.addEventListener('click', handleDeleteButtonClick);
        }

        // Устанавливаем текущую дату как выбранную по умолчанию
        const today = new Date().toISOString().split('T')[0];
        selectedDate = today;
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }
});