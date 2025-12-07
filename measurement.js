// Скрипт для страницы добавления измерений Дневника давления

console.log('Дневник давления: страница добавления измерений загружена.');

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

// Функция для инициализации страницы добавления измерений
function initMeasurementPage() {
    console.log('Начало инициализации страницы добавления измерений...');
    
    // Инициализируем тему
    initTheme();
    
    // Устанавливаем текущую дату и время в поле datetime
    setCurrentDateTime();
    
    // Добавляем обработчик события на форму
    document.getElementById('pressure-form').addEventListener('submit', handleFormSubmit);
    
    console.log('Страница добавления измерений инициализирована');
}

// Запускаем инициализацию страницы после загрузки DOM
document.addEventListener('DOMContentLoaded', initMeasurementPage);