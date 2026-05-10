// Service Worker for ClimatAgro PWA and Firebase Messaging

const CACHE_NAME = 'climatagro-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/favicon.ico',
];

// Install event - cache basic assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and non-GET requests
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If successful, clone and store in cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});

// Firebase Messaging logic
try {
  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

  // Retrieve Firebase config from URL query parameter
  const urlParams = new URL(self.location).searchParams;
  const firebaseConfigStr = urlParams.get('firebaseConfig');

  if (firebaseConfigStr) {
    const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigStr));
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log("[firebase-messaging-sw.js] Received background message ", payload);
      const notificationTitle = payload.notification?.title || 'ClimatAgro';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.image || '/logo.svg',
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
} catch (e) {
    console.error('Failed to initialize Firebase in service worker', e);
}
