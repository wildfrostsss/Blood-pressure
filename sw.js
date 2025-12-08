// Service Worker для Дневника давления

const CACHE_NAME = 'blood-pressure-diary-v4'; // Одностраничная архитектура
const RUNTIME_CACHE = 'blood-pressure-diary-runtime';

// Статические ресурсы для кэширования при установке
const STATIC_CACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './favicon.ico',
  // Иконки приложения
  './assets/icons/icon-72x72.png',
  './assets/icons/icon-96x96.png',
  './assets/icons/icon-128x128.png',
  './assets/icons/icon-144x144.png',
  './assets/icons/icon-152x152.png',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-384x384.png',
  './assets/icons/icon-512x512.png'
];

// Внешние ресурсы для кэширования
const EXTERNAL_CACHE_URLS = [
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Установка Service Worker и кэширование статических ресурсов
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Static resources cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache static resources', error);
      })
  );
});

// Активация Service Worker и очистка старых кэшей
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Удаляем все кэши, кроме текущих
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Стратегия кэширования: Cache First для статических ресурсов
// Network First для внешних ресурсов
// Cache Only для офлайн-страницы
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Пропускаем non-GET запросы
  if (request.method !== 'GET') {
    return;
  }
  
  // Обработка запросов к внешним ресурсам (CDN)
  if (EXTERNAL_CACHE_URLS.some(externalUrl => url.href.includes(externalUrl))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Обработка запросов к статическим ресурсам
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Для всех остальных запросов используем Network First
  event.respondWith(networkFirstStrategy(request));
});

// Стратегия Cache First: сначала проверяем кэш, потом сеть
function cacheFirstStrategy(request) {
  return caches.match(request)
    .then(response => {
      // Если ресурс есть в кэше, возвращаем его
      if (response) {
        return response;
      }
      
      // Иначе делаем запрос в сеть
      return fetch(request)
        .then(response => {
          // Проверяем, что ответ корректный
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Кэшируем ответ для будущих запросов
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE)
            .then(cache => {
              cache.put(request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          // Если запрос не удался и это запрос на HTML-страницу,
          // возвращаем офлайн-страницу
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
    });
}

// Стратегия Network First: сначала сеть, потом кэш
function networkFirstStrategy(request) {
  return fetch(request)
    .then(response => {
      // Если ответ корректный, кэшируем его
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE)
          .then(cache => {
            cache.put(request, responseToCache);
          });
      }
      return response;
    })
    .catch(() => {
      // Если запрос не удался, пробуем получить из кэша
      return caches.match(request);
    });
}

// Обработка сообщений от основного потока
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});