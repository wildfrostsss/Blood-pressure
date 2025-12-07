// Основной скрипт для Дневника давления

console.log('Дневник давления: скрипт загружен.');

// Функция для регистрации Service Worker
function registerServiceWorker() {
    // Проверяем поддержку Service Worker в браузере
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker зарегистрирован с областью:', registration.scope);
                    
                    // Проверяем наличие обновления Service Worker
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Новый Service Worker доступен, показываем уведомление
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('Ошибка регистрации Service Worker:', error);
                });
        });
    } else {
        console.log('Service Worker не поддерживается в этом браузере');
    }
}

// Функция для показа уведомления об обновлении
function showUpdateNotification() {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <p>Доступна новая версия приложения. Обновите страницу для получения последних функций.</p>
            <button id="update-btn" class="btn">Обновить</button>
            <button id="dismiss-btn" class="btn btn-secondary">Отклонить</button>
        </div>
    `;
    
    // Добавляем уведомление на страницу
    document.body.appendChild(notification);
    
    // Добавляем обработчики событий
    document.getElementById('update-btn').addEventListener('click', () => {
        // Сообщаем Service Worker, что нужно пропустить ожидание
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        // Перезагружаем страницу
        window.location.reload();
    });
    
    document.getElementById('dismiss-btn').addEventListener('click', () => {
        // Удаляем уведомление
        document.body.removeChild(notification);
    });
}

// Ключи для хранения данных в localStorage
const STORAGE_KEY = 'blood_pressure_measurements';
const THEME_KEY = 'blood_pressure_theme';

// Функция для сохранения нового измерения в localStorage
function saveMeasurement(systolic, diastolic, pulse, datetime) {
    // Получаем текущие измерения или создаем пустой массив
    const measurements = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    // Создаем новое измерение
    const newMeasurement = {
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        pulse: parseInt(pulse),
        datetime: datetime
    };
    
    // Добавляем новое измерение в массив
    measurements.push(newMeasurement);
    
    // Сохраняем обновленный массив в localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(measurements));
    
    console.log('Измерение сохранено:', newMeasurement);
    return newMeasurement;
}

// Функция для чтения измерений из localStorage за определенную дату
function getMeasurementsByDate(date) {
    // Получаем все измерения из localStorage
    const measurements = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    // Форматируем дату для сравнения (YYYY-MM-DD)
    const targetDate = new Date(date).toISOString().split('T')[0];
    
    // Фильтруем измерения по дате
    const filteredMeasurements = measurements.filter(measurement => {
        const measurementDate = new Date(measurement.datetime).toISOString().split('T')[0];
        return measurementDate === targetDate;
    });
    
    // Сортируем измерения по времени (новые в начале)
    filteredMeasurements.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    
    return filteredMeasurements;
}

// Функция для получения измерений за диапазон дат
function getMeasurementsByDateRange(startDate, endDate) {
    // Получаем все измерения из localStorage
    const measurements = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    // Форматируем даты для сравнения
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Устанавливаем конец дня для включительной фильтрации
    
    // Фильтруем измерения по диапазону дат
    const filteredMeasurements = measurements.filter(measurement => {
        const measurementDate = new Date(measurement.datetime);
        return measurementDate >= start && measurementDate <= end;
    });
    
    // Сортируем измерения по времени (старые в начале)
    filteredMeasurements.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    
    return filteredMeasurements;
}

// Глобальная переменная для хранения экземпляра графика
let pressureChart = null;

// Функция для отрисовки графика
function renderChart(startDate, endDate) {
    // Получаем измерения за указанный диапазон дат
    const measurements = getMeasurementsByDateRange(startDate, endDate);
    
    // Если нет измерений, показываем сообщение
    if (measurements.length === 0) {
        if (pressureChart) {
            pressureChart.destroy();
            pressureChart = null;
        }
        return;
    }
    
    // Подготавливаем данные для графика
    const labels = measurements.map(m => {
        const date = new Date(m.datetime);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    });
    
    const systolicData = measurements.map(m => m.systolic);
    const diastolicData = measurements.map(m => m.diastolic);
    const pulseData = measurements.map(m => m.pulse);
    
    // Получаем контекст canvas
    const ctx = document.getElementById('pressure-chart').getContext('2d');
    
    // Уничтожаем предыдущий график, если он существует
    if (pressureChart) {
        pressureChart.destroy();
    }
    
    // Создаем новый график
    pressureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Систолическое давление',
                    data: systolicData,
                    borderColor: '#ff6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Диастолическое давление',
                    data: diastolicData,
                    borderColor: '#36a2eb',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Пульс',
                    data: pulseData,
                    borderColor: '#4bc0c0',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Значение'
                    },
                    // Добавляем горизонтальные линии для отметок 120 и 80
                    afterBuildTicks: function(scale) {
                        // Убедимся, что отметки 120 и 80 включены в шкалу
                        if (scale.min > 120) scale.min = 120;
                        if (scale.max < 120) scale.max = 120;
                        if (scale.min > 80) scale.min = 80;
                        if (scale.max < 80) scale.max = 80;
                    },
                    grid: {
                        // Выделяем линии для отметок 120 и 80
                        color: function(context) {
                            if (context.tick.value === 120) {
                                return 'rgba(255, 99, 132, 0.7)'; // Красный цвет для 120
                            }
                            if (context.tick.value === 80) {
                                return 'rgba(54, 162, 235, 0.7)'; // Синий цвет для 80
                            }
                            return 'rgba(0, 0, 0, 0.1)'; // Стандартный цвет для остальных линий
                        },
                        lineWidth: function(context) {
                            if (context.tick.value === 120 || context.tick.value === 80) {
                                return 2; // Увеличиваем толщину линий для отметок 120 и 80
                            }
                            return 1; // Стандартная толщина для остальных линий
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Дата и время'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Динамика артериального давления и пульса'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
                // Добавляем аннотации для отметок 120 и 80
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 120,
                            yMax: 120,
                            borderColor: 'rgba(255, 99, 132, 0.7)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: '120 (норма систолического)',
                                enabled: true,
                                position: 'end'
                            }
                        },
                        line2: {
                            type: 'line',
                            yMin: 80,
                            yMax: 80,
                            borderColor: 'rgba(54, 162, 235, 0.7)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: '80 (норма диастолического)',
                                enabled: true,
                                position: 'end'
                            }
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Функция для установки начальных дат в поля ввода
function setInitialDates() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    // Устанавливаем даты в поля ввода
    document.getElementById('start-date').value = weekAgo.toISOString().split('T')[0];
    document.getElementById('end-date').value = today.toISOString().split('T')[0];
}

// Функция для обработки нажатия на кнопку "Неделя"
function handleWeekButtonClick() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    // Обновляем поля ввода
    document.getElementById('start-date').value = weekAgo.toISOString().split('T')[0];
    document.getElementById('end-date').value = today.toISOString().split('T')[0];
    
    // Обновляем активную кнопку
    document.querySelectorAll('.btn-range').forEach(btn => btn.classList.remove('active'));
    document.getElementById('week-btn').classList.add('active');
    
    // Обновляем график
    renderChart(weekAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
}

// Функция для обработки нажатия на кнопку "Месяц"
function handleMonthButtonClick() {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    
    // Обновляем поля ввода
    document.getElementById('start-date').value = monthAgo.toISOString().split('T')[0];
    document.getElementById('end-date').value = today.toISOString().split('T')[0];
    
    // Обновляем активную кнопку
    document.querySelectorAll('.btn-range').forEach(btn => btn.classList.remove('active'));
    document.getElementById('month-btn').classList.add('active');
    
    // Обновляем график
    renderChart(monthAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
}

// Функция для обработки изменения дат в полях ввода
function handleDateChange() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    // Проверяем, что обе даты выбраны
    if (startDate && endDate) {
        // Убираем активный класс с кнопок предустановок
        document.querySelectorAll('.btn-range').forEach(btn => btn.classList.remove('active'));
        
        // Обновляем график
        renderChart(startDate, endDate);
    }
}

// Функция для инициализации графиков
function initCharts() {
    // Устанавливаем начальные даты
    setInitialDates();
    
    // Добавляем обработчики событий для кнопок
    document.getElementById('week-btn').addEventListener('click', handleWeekButtonClick);
    document.getElementById('month-btn').addEventListener('click', handleMonthButtonClick);
    
    // Добавляем обработчики событий для полей ввода дат
    document.getElementById('start-date').addEventListener('change', handleDateChange);
    document.getElementById('end-date').addEventListener('change', handleDateChange);
    
    // Устанавливаем активную кнопку по умолчанию
    document.getElementById('week-btn').classList.add('active');
    
    // Отображаем график за последнюю неделю
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    renderChart(weekAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
}

// Функция для отображения списка измерений на странице
function displayMeasurements(measurements) {
    const container = document.getElementById('measurements-container');
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Если нет измерений, показываем сообщение
    if (measurements.length === 0) {
        container.innerHTML = '<p class="no-measurements">Нет измерений за сегодня</p>';
        return;
    }
    
    // Создаем элементы для каждого измерения
    measurements.forEach(measurement => {
        const measurementElement = document.createElement('div');
        measurementElement.className = 'measurement-item';
        
        // Форматируем дату и время для отображения
        const datetime = new Date(measurement.datetime);
        const formattedDate = datetime.toLocaleDateString('ru-RU');
        const formattedTime = datetime.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Используем timestamp как уникальный идентификатор
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
            </div>
        `;
        
        container.appendChild(measurementElement);
    });
}

// Функция для удаления измерения
function deleteMeasurement(id) {
    // Получаем все измерения из localStorage
    const measurements = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    // Находим индекс измерения с указанным id (timestamp)
    const index = measurements.findIndex(measurement => {
        const measurementTimestamp = new Date(measurement.datetime).getTime();
        return measurementTimestamp === parseInt(id);
    });
    
    // Если измерение найдено, удаляем его
    if (index !== -1) {
        measurements.splice(index, 1);
        
        // Сохраняем обновленный массив в localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(measurements));
        
        console.log('Измерение удалено с id:', id);
        
        // Определяем текущую выбранную дату
        const currentDate = selectedDate || new Date().toISOString().split('T')[0];
        const currentMeasurements = getMeasurementsByDate(currentDate);
        displayMeasurements(currentMeasurements);
        
        // Обновляем календарь
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        
        // Обновляем график
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        if (startDate && endDate) {
            renderChart(startDate, endDate);
        }
    } else {
        console.error('Измерение с id', id, 'не найдено');
    }
}

// Функция для обработки кликов по кнопкам удаления
function handleDeleteButtonClick(event) {
    // Проверяем, что клик был по кнопке удаления
    if (event.target.classList.contains('btn-delete')) {
        // Получаем id измерения из data-атрибута
        const id = event.target.getAttribute('data-id');
        
        // Запрашиваем подтверждение удаления
        if (confirm('Вы уверены, что хотите удалить это измерение?')) {
            deleteMeasurement(id);
        }
    }
}

// Функция для обработки отправки формы
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Получаем значения из формы
    const systolic = document.getElementById('systolic').value;
    const diastolic = document.getElementById('diastolic').value;
    const pulse = document.getElementById('pulse').value;
    const datetime = document.getElementById('datetime').value;
    
    // Проверяем, что все поля заполнены
    if (!systolic || !diastolic || !pulse || !datetime) {
        alert('Пожалуйста, заполните все поля формы');
        return;
    }
    
    // Сохраняем измерение
    saveMeasurement(systolic, diastolic, pulse, datetime);
    
    // Очищаем форму
    document.getElementById('pressure-form').reset();
    
    // Устанавливаем текущую дату и время в поле datetime
    setCurrentDateTime();
    
    // Обновляем календарь
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    
    // Обновляем график
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    if (startDate && endDate) {
        renderChart(startDate, endDate);
    }
    
    // Показываем уведомление об успешном сохранении
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = 'Измерение успешно сохранено';
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Функция для установки текущей даты и времени в поле datetime
function setCurrentDateTime() {
    const now = new Date();
    // Форматируем дату и время для input type="datetime-local"
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById('datetime').value = formattedDateTime;
}


// Переменные для календаря
let currentDate = new Date();
let selectedDate = null;

// Функция для получения всех дат с измерениями
function getDatesWithMeasurements() {
    const measurements = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const dates = new Set();
    
    measurements.forEach(measurement => {
        const date = new Date(measurement.datetime).toISOString().split('T')[0];
        dates.add(date);
    });
    
    return dates;
}

// Функция для генерации календаря
function generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    
    const firstDayIndex = firstDay.getDay() || 7; // Воскресенье = 7
    const lastDayIndex = lastDay.getDay() || 7; // Воскресенье = 7
    const nextDays = 7 - lastDayIndex;
    
    const datesWithMeasurements = getDatesWithMeasurements();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Обновляем заголовок месяца
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
    
    // Очищаем контейнер дней
    const daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = '';
    
    // Добавляем дни предыдущего месяца
    for (let x = firstDayIndex - 1; x > 0; x--) {
        const day = prevLastDay.getDate() - x + 1;
        const dayElement = createDayElement(day, true, false, false, '');
        daysContainer.appendChild(dayElement);
    }
    
    // Добавляем дни текущего месяца
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isToday = dateString === todayString;
        const hasMeasurements = datesWithMeasurements.has(dateString);
        const isSelected = selectedDate === dateString;
        
        const dayElement = createDayElement(i, false, isToday, hasMeasurements, dateString, isSelected);
        daysContainer.appendChild(dayElement);
    }
    
    // Добавляем дни следующего месяца
    for (let j = 1; j <= nextDays; j++) {
        const dayElement = createDayElement(j, true, false, false, '');
        daysContainer.appendChild(dayElement);
    }
}

// Функция для создания элемента дня
function createDayElement(day, isOtherMonth, isToday, hasMeasurements, dateString, isSelected = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = day;
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    
    if (isToday) {
        dayElement.classList.add('today');
    }
    
    if (hasMeasurements) {
        dayElement.classList.add('has-measurements');
    }
    
    if (isSelected) {
        dayElement.classList.add('selected');
    }
    
    if (!isOtherMonth && dateString) {
        dayElement.addEventListener('click', () => selectDate(dateString));
    }
    
    return dayElement;
}

// Функция для выбора даты
function selectDate(dateString) {
    selectedDate = dateString;
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    
    // Обновляем заголовок раздела измерений
    const selectedDateObj = new Date(dateString);
    const formattedDate = selectedDateObj.toLocaleDateString('ru-RU');
    document.querySelector('.measurements-list h2').textContent = `Измерения за ${formattedDate}`;
    
    // Отображаем измерения за выбранную дату
    const measurements = getMeasurementsByDate(dateString);
    displayMeasurements(measurements);
    
    // Показываем секцию со списком измерений
    showSection('measurements-list');
}

// Функция для переключения на предыдущий месяц
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
}

// Функция для переключения на следующий месяц
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
}

// Функция для инициализации календаря
function initCalendar() {
    // Добавляем обработчики событий для кнопок навигации
    document.getElementById('prev-month').addEventListener('click', previousMonth);
    document.getElementById('next-month').addEventListener('click', nextMonth);
    
    // Генерируем календарь для текущего месяца
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    
    // Устанавливаем текущую дату как выбранную, но не показываем секцию измерений
    const today = new Date().toISOString().split('T')[0];
    selectedDate = today;
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
}

// Обновленная функция инициализации приложения
function initApp() {
    // Устанавливаем текущую дату и время в поле datetime
    setCurrentDateTime();
    
    // Добавляем обработчик события на форму
    document.getElementById('pressure-form').addEventListener('submit', handleFormSubmit);
    
    // Инициализируем календарь
    initCalendar();
    
    // Инициализируем графики
    initCharts();
    
    console.log('Приложение инициализировано');
}

// Функция для заполнения шаблона PDF отчета данными
function fillPdfTemplate(measurements, startDate, endDate) {
    // Получаем элементы шаблона
    const reportPeriod = document.querySelector('#pdf-report .report-period');
    const tableBody = document.querySelector('#pdf-report .measurements-table-body');
    const avgSystolic = document.querySelector('#pdf-report .avg-systolic');
    const avgDiastolic = document.querySelector('#pdf-report .avg-diastolic');
    const avgPulse = document.querySelector('#pdf-report .avg-pulse');
    const count = document.querySelector('#pdf-report .count');
    const generationDate = document.querySelector('#pdf-report .generation-date');
    
    // Форматируем период
    const start = new Date(startDate).toLocaleDateString('ru-RU');
    const end = new Date(endDate).toLocaleDateString('ru-RU');
    reportPeriod.textContent = `Период: с ${start} по ${end}`;
    
    // Очищаем таблицу
    tableBody.innerHTML = '';
    
    // Заполняем таблицу измерений
    measurements.forEach(measurement => {
        const row = document.createElement('tr');
        const date = new Date(measurement.datetime);
        const formattedDate = date.toLocaleDateString('ru-RU');
        const formattedTime = date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td>${measurement.systolic}</td>
            <td>${measurement.diastolic}</td>
            <td>${measurement.pulse}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Вычисляем статистику
    if (measurements.length > 0) {
        const systolicValues = measurements.map(m => m.systolic);
        const diastolicValues = measurements.map(m => m.diastolic);
        const pulseValues = measurements.map(m => m.pulse);
        
        const avgSyst = Math.round(systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length);
        const avgDias = Math.round(diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length);
        const avgPul = Math.round(pulseValues.reduce((a, b) => a + b, 0) / pulseValues.length);
        
        avgSystolic.textContent = avgSyst;
        avgDiastolic.textContent = avgDias;
        avgPulse.textContent = avgPul;
        count.textContent = measurements.length;
    } else {
        avgSystolic.textContent = '0';
        avgDiastolic.textContent = '0';
        avgPulse.textContent = '0';
        count.textContent = '0';
    }
    
    // Устанавливаем дату генерации отчета
    const now = new Date();
    generationDate.textContent = now.toLocaleDateString('ru-RU') + ' ' +
                              now.toLocaleTimeString('ru-RU', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                              });
}

// Функция для создания графика в PDF
function createPdfChart(measurements) {
    // Получаем контекст canvas для PDF
    const ctx = document.getElementById('pdf-chart').getContext('2d');
    
    // Уничтожаем предыдущий график, если он существует
    if (window.pdfChartInstance) {
        window.pdfChartInstance.destroy();
    }
    
    // Если нет измерений, не создаем график
    if (measurements.length === 0) {
        return;
    }
    
    // Подготавливаем данные для графика
    const labels = measurements.map(m => {
        const date = new Date(m.datetime);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit'
        });
    });
    
    const systolicData = measurements.map(m => m.systolic);
    const diastolicData = measurements.map(m => m.diastolic);
    const pulseData = measurements.map(m => m.pulse);
    
    // Создаем новый график
    window.pdfChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Систолическое давление',
                    data: systolicData,
                    borderColor: '#ff6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Диастолическое давление',
                    data: diastolicData,
                    borderColor: '#36a2eb',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Пульс',
                    data: pulseData,
                    borderColor: '#4bc0c0',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Значение'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Дата'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Динамика артериального давления и пульса'
                }
            }
        }
    });
}

// Функция для генерации PDF
async function generatePdf() {
    try {
        // Получаем текущий диапазон дат
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        // Проверяем, что даты выбраны
        if (!startDate || !endDate) {
            alert('Пожалуйста, выберите период для генерации отчета');
            return;
        }
        
        // Получаем измерения за выбранный период
        const measurements = getMeasurementsByDateRange(startDate, endDate);
        
        // Проверяем, что есть измерения
        if (measurements.length === 0) {
            alert('За выбранный период нет измерений');
            return;
        }
        
        // Показываем индикатор загрузки
        const generateBtn = document.getElementById('generate-pdf-btn');
        const originalText = generateBtn.textContent;
        generateBtn.textContent = 'Генерация...';
        generateBtn.disabled = true;
        
        // Заполняем шаблон данными
        fillPdfTemplate(measurements, startDate, endDate);
        
        // Создаем график в PDF
        createPdfChart(measurements);
        
        // Ждем небольшое время, чтобы график отрисовался
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Получаем элемент шаблона
        const element = document.getElementById('pdf-report');
        
        // Конвертируем HTML в изображение с помощью html2canvas
        const canvas = await html2canvas(element, {
            scale: 2, // Увеличиваем качество
            useCORS: true,
            logging: false
        });
        
        // Получаем данные изображения
        const imgData = canvas.toDataURL('image/png');
        
        // Создаем PDF с помощью jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Добавляем изображение в PDF
        const imgWidth = 210; // Ширина A4 в мм
        const pageHeight = 297; // Высота A4 в мм
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        // Добавляем первую страницу
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Если изображение не помещается на одной странице, добавляем дополнительные страницы
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Генерируем имя файла
        const start = new Date(startDate).toLocaleDateString('ru-RU').replace(/\./g, '-');
        const end = new Date(endDate).toLocaleDateString('ru-RU').replace(/\./g, '-');
        const fileName = `Отчет_давление_${start}_${end}.pdf`;
        
        // Сохраняем PDF
        pdf.save(fileName);
        
        // Восстанавливаем кнопку
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
        
        console.log('PDF успешно сгенерирован');
    } catch (error) {
        console.error('Ошибка при генерации PDF:', error);
        alert('Произошла ошибка при генерации PDF. Пожалуйста, попробуйте еще раз.');
        
        // Восстанавливаем кнопку в случае ошибки
        const generateBtn = document.getElementById('generate-pdf-btn');
        generateBtn.textContent = 'Сгенерировать PDF';
        generateBtn.disabled = false;
    }
}

// Функция для инициализации PDF-функционала
function initPdf() {
    // Добавляем обработчик события на кнопку генерации PDF
    document.getElementById('generate-pdf-btn').addEventListener('click', generatePdf);
}

// Обновленная функция инициализации приложения
function initApp() {
    // Регистрируем Service Worker
    registerServiceWorker();
    
    // Устанавливаем текущую дату и время в поле datetime
    setCurrentDateTime();
    
    // Добавляем обработчик события на форму
    document.getElementById('pressure-form').addEventListener('submit', handleFormSubmit);
    
    // Инициализируем календарь
    initCalendar();
    
    // Инициализируем графики
    initCharts();
    
    // Инициализируем PDF-функционал
    initPdf();
    
    console.log('Приложение инициализировано');
}

// Функция для переключения темы
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Устанавливаем новую тему
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Обновляем иконку
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    
    // Сохраняем выбор в localStorage
    localStorage.setItem(THEME_KEY, newTheme);
    
    console.log(`Тема изменена на: ${newTheme}`);
}

// Функция для инициализации темы
function initTheme() {
    // Получаем сохраненную тему или используем системные настройки
    const savedTheme = localStorage.getItem(THEME_KEY);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Определяем тему: сохраненная > системная > светлая
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    // Устанавливаем тему
    document.documentElement.setAttribute('data-theme', theme);
    
    // Устанавливаем соответствующую иконку
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    
    // Добавляем обработчик события на кнопку переключения темы
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    
    console.log(`Тема инициализирована: ${theme}`);
}

// Функция для показа выбранной секции и скрытия остальных
function showSection(sectionId) {
    // Скрываем все секции
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.add('hidden');
    });
    
    // Показываем выбранную секцию
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        console.log('Показана секция:', sectionId);
    } else {
        console.error('Секция не найдена:', sectionId);
    }
}

// Функция для показа главного экрана
function showHomeScreen() {
    showSection('home-screen');
}

// Функция для инициализации навигации
function initNavigation() {
    // Добавляем обработчики событий для плиток
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        tile.addEventListener('click', () => {
            const sectionId = tile.getAttribute('data-section');
            
            // Особая обработка для плитки "Сгенерировать отчет"
            if (sectionId === 'pdf-report') {
                // Показываем секцию графиков перед генерацией PDF
                showSection('charts-container');
                
                // Небольшая задержка, чтобы секция успела отобразиться
                setTimeout(() => {
                    generatePdf();
                }, 100);
                return;
            }
            
            // Показываем выбранную секцию
            showSection(sectionId);
            
            // Дополнительная инициализация для определенных секций
            if (sectionId === 'measurement-form') {
                // Устанавливаем текущую дату и время при открытии формы
                setCurrentDateTime();
            } else if (sectionId === 'calendar-container') {
                // Обновляем календарь при открытии
                generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
            } else if (sectionId === 'charts-container') {
                // Обновляем график при открытии
                const startDate = document.getElementById('start-date').value;
                const endDate = document.getElementById('end-date').value;
                if (startDate && endDate) {
                    renderChart(startDate, endDate);
                }
            }
        });
    });
    
    // Добавляем обработчики событий для кнопок "Назад"
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(button => {
        button.addEventListener('click', showHomeScreen);
    });
}

// Обновленная функция инициализации приложения
function initApp() {
    // Инициализируем тему
    initTheme();
    
    // Регистрируем Service Worker
    registerServiceWorker();
    
    // Устанавливаем текущую дату и время в поле datetime
    setCurrentDateTime();
    
    // Добавляем обработчик события на форму
    document.getElementById('pressure-form').addEventListener('submit', handleFormSubmit);
    
    // Добавляем обработчик событий для кнопок удаления
    document.getElementById('measurements-container').addEventListener('click', handleDeleteButtonClick);
    
    // Инициализируем навигацию
    initNavigation();
    
    // Инициализируем календарь
    initCalendar();
    
    // Инициализируем графики
    initCharts();
    
    // Инициализируем PDF-функционал
    initPdf();
    
    // Убедимся, что по умолчанию показан только главный экран
    showHomeScreen();
    
    console.log('Приложение инициализировано');
}

// Запускаем инициализацию приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', initApp);