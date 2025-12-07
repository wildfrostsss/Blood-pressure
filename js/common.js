// js/common.js

console.log('Дневник давления: common.js загружен.');

// --- Service Worker ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker зарегистрирован с областью:', registration.scope);
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
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

function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <p>Доступна новая версия приложения. Обновите страницу для получения последних функций.</p>
            <button id="update-btn" class="btn">Обновить</button>
            <button id="dismiss-btn" class="btn btn-secondary">Отклонить</button>
        </div>
    `;
    document.body.appendChild(notification);
    document.getElementById('update-btn').addEventListener('click', () => {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
    });
    document.getElementById('dismiss-btn').addEventListener('click', () => {
        document.body.removeChild(notification);
    });
}

// --- Хранилище ---
const STORAGE_KEY = 'blood_pressure_measurements';
const THEME_KEY = 'blood_pressure_theme';

function saveMeasurement(systolic, diastolic, pulse, datetime) {
    const measurements = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const newMeasurement = {
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        pulse: parseInt(pulse),
        datetime: datetime
    };
    measurements.push(newMeasurement);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(measurements));
    console.log('Измерение сохранено:', newMeasurement);
    return newMeasurement;
}

function getMeasurementsByDate(date) {
    const measurements = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const targetDate = new Date(date).toISOString().split('T')[0];
    const filteredMeasurements = measurements.filter(measurement => {
        const measurementDate = new Date(measurement.datetime).toISOString().split('T')[0];
        return measurementDate === targetDate;
    });
    filteredMeasurements.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    return filteredMeasurements;
}

function getMeasurementsByDateRange(startDate, endDate) {
    const measurements = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const filteredMeasurements = measurements.filter(measurement => {
        const measurementDate = new Date(measurement.datetime);
        return measurementDate >= start && measurementDate <= end;
    });
    filteredMeasurements.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    return filteredMeasurements;
}

function deleteMeasurement(id) {
    const measurements = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const index = measurements.findIndex(measurement => new Date(measurement.datetime).getTime() === parseInt(id));
    
    if (index !== -1) {
        measurements.splice(index, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(measurements));
        console.log('Измерение удалено с id:', id);
        return true;
    } else {
        console.error('Измерение с id', id, 'не найдено');
        return false;
    }
}


// --- Тема ---
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
    localStorage.setItem(THEME_KEY, newTheme);
    console.log(`Тема изменена на: ${newTheme}`);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if(themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    console.log(`Тема инициализирована: ${theme}`);
}


// --- Навигация ---
function showSection(sectionId) {
    console.log('Вызвана showSection с sectionId:', sectionId);
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.add('hidden');
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        console.log('Показана секция:', sectionId);
    } else {
        console.error('Секция не найдена:', sectionId);
    }
}

function showHomeScreen() {
    showSection('home-screen');
}

function initNavigation() {
    console.log('Инициализация навигации...');
    const tiles = document.querySelectorAll('.tile');
    if (tiles.length === 0) {
        console.error('Плитки не найдены! Проверьте HTML-структуру.');
        return;
    }
    tiles.forEach((tile, index) => {
        const sectionId = tile.getAttribute('data-section');
        if (!sectionId) {
            console.error(`Плитка ${index} не имеет атрибута data-section`);
            return;
        }
        tile.addEventListener('click', () => {
            console.log('Клик на плитку с data-section:', sectionId);
            if (sectionId === 'pdf-report') {
                showSection('charts-container');
                return;
            }
            showSection(sectionId);
            if (sectionId === 'measurement-form') {
                setCurrentDateTime();
            } else if (sectionId === 'calendar-container') {
                // Эта логика будет в calendar.js
            } else if (sectionId === 'charts-container') {
                // Эта логика будет в charts.js
            }
        });
    });
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(button => {
        button.addEventListener('click', showHomeScreen);
    });
    console.log('Навигация инициализирована');
}

// --- Вспомогательные функции ---
function setCurrentDateTime() {
    const datetimeInput = document.getElementById('datetime');
    if (datetimeInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        datetimeInput.value = formattedDateTime;
    }
}

// --- Инициализация при загрузке DOM ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, запускается общая инициализация.');
    initializeTheme();
    registerServiceWorker();
    
    // Показываем главный экран по умолчанию
    const homeScreen = document.getElementById('home-screen');
    if (homeScreen) {
        showHomeScreen();
    }
});