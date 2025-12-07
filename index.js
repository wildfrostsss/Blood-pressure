// Скрипт для главной страницы Дневника давления

console.log('Дневник давления: главная страница загружена.');

// Ключи для хранения данных в localStorage
const THEME_KEY = 'blood_pressure_theme';

// Функция для регистрации Service Worker
function registerServiceWorker() {
    // Проверяем поддержку Service Worker в браузере
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
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

// Функция для инициализации главной страницы
function initHomePage() {
    console.log('Начало инициализации главной страницы...');
    
    // Инициализируем тему
    initTheme();
    
    // Регистрируем Service Worker
    registerServiceWorker();
    
    // Добавляем обработчик для плитки "Сгенерировать отчет"
    const pdfReportTile = document.getElementById('pdf-report-tile');
    if (pdfReportTile) {
        pdfReportTile.addEventListener('click', (event) => {
            // Предотвращаем стандартное поведение ссылки
            event.preventDefault();
            // Переходим на страницу графиков с параметром для генерации PDF
            window.location.href = '/charts.html#generate-pdf';
        });
    }
    
    console.log('Главная страница инициализирована');
}

// Запускаем инициализацию главной страницы после загрузки DOM
document.addEventListener('DOMContentLoaded', initHomePage);