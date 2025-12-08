// Service Worker для Дневника давления

const CACHE_NAME = 'blood-pressure-diary-v5-final-cleanup';

const CACHE_FILES = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './favicon.ico',
    './assets/icons/icon-72x72.png',
    './assets/icons/icon-96x96.png',
    './assets/icons/icon-128x128.png',
    './assets/icons/icon-144x144.png',
    './assets/icons/icon-152x152.png',
    './assets/icons/icon-192x192.png',
    './assets/icons/icon-384x384.png',
    './assets/icons/icon-512x512.png',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Установка Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => {
                // Принудительная активация нового SW
                return self.skipWaiting();
            })
    );
});

// Активация Service Worker и удаление старых кэшей
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    // Удаляем ВСЕ кэши, которые не совпадают с текущим
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Old caches deleted.');
            // Захватываем контроль над клиентами
            return self.clients.claim();
        })
    );
});

// Обработка запросов (стратегия "Cache falling back to network")
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Если ресурс есть в кэше, возвращаем его
                if (response) {
                    return response;
                }

                // Иначе, делаем запрос к сети
                return fetch(event.request).then(
                    (response) => {
                        // Проверяем, что мы получили корректный ответ
                        if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
                            return response;
                        }

                        // Клонируем ответ, так как он может быть использован только один раз
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Кэшируем новый ресурс
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
            .catch(() => {
                // Если запрос навигационный (HTML-страница) и сеть недоступна,
                // возвращаем главную страницу из кэша.
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            })
    );
});

// Обработка сообщений от клиента (для кнопки "Обновить")
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});