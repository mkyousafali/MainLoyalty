/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

console.log('Service Worker: Starting...');

const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;

// Cache name
const CACHE_NAME = 'urban-market-loyalty-v3'; // Updated to force complete cache refresh

// Basic files to cache
const urlsToCache = [
  '/',
  '/login',
  '/dashboard',
  '/static/logo.png',
  '/static/favicon.svg'
];

// Install event
sw.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    // First clear all old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Then cache new files
      return caches.open(CACHE_NAME);
    }).then((cache) => {
      console.log('Service Worker: Caching app shell');
      return cache.addAll(urlsToCache);
    }).then(() => {
      console.log('Service Worker: Installed successfully');
      return sw.skipWaiting();
    }).catch((error) => {
      console.error('Service Worker: Install failed:', error);
    })
  );
});

// Activate event
sw.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated successfully');
      return sw.clients.claim();
    })
  );
});

// Fetch event - Network first, then cache
sw.addEventListener('fetch', (event: FetchEvent) => {
  // Only cache GET requests, skip POST, PUT, DELETE, PATCH etc.
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Skip caching for API endpoints that might have dynamic content
  const url = new URL(event.request.url);
  if (url.pathname.includes('/rest/v1/') || 
      url.pathname.includes('/auth/') || 
      url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a response, clone it and put it in the cache
        if (response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              try {
                cache.put(event.request, responseClone);
              } catch (error) {
                console.warn('Failed to cache request:', error);
              }
            });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to get it from cache
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline', { status: 503 });
        });
      })
  );
});

export {};
