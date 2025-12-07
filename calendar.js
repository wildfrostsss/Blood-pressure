// Скрипт для страницы календаря Дневника давления

console.log('Дневник давления: страница календаря загружена.');

// Ключи для хранения данных в localStorage
const STORAGE_KEY = 'blood_pressure_measurements';
const THEME_KEY = 'blood_pressure_theme';

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

// Функция для показа выбранной секции и скрытия остальных
function showSection(sectionId) {
    console.log('Вызвана showSection с sectionId:', sectionId);
    
    // Скрываем все секции
    const sections = document.querySelectorAll('section');
    console.log('Найдено секций:', sections.length);
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

// Функция для инициализации страницы календаря
function initCalendarPage() {
    console.log('Начало инициализации страницы календаря...');
    
    // Инициализируем тему
    initTheme();
    
    // Инициализируем календарь
    initCalendar();
    
    // Добавляем обработчик событий для кнопок удаления
    document.getElementById('measurements-container').addEventListener('click', handleDeleteButtonClick);
    
    // Добавляем обработчик для кнопки "Назад к календарю"
    document.getElementById('back-to-calendar').addEventListener('click', () => {
        showSection('calendar-container');
    });
    
    console.log('Страница календаря инициализирована');
}

// Запускаем инициализацию страницы после загрузки DOM
document.addEventListener('DOMContentLoaded', initCalendarPage);