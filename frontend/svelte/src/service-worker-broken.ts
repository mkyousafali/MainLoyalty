/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Temporarily disabled service worker to fix immediate issues
console.log('Service Worker: Disabled for troubleshooting');

const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;

// Install event
sw.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service Worker: Install Event - Skipping');
  sw.skipWaiting();
});

// Activate event  
sw.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service Worker: Activate Event - Skipping');
  event.waitUntil(sw.clients.claim());
});

// Cache Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30,
      }),
    ],
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache API calls to Supabase with network first strategy
registerRoute(
  ({ url }) => url.origin.includes('supabase'),
  new NetworkFirst({
    cacheName: 'supabase-api',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Cache CSS, JS, and Web Worker requests with a Stale While Revalidate strategy
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Use navigation route for all navigations
const navigationRoute = new NavigationRoute(
  async ({ event }) => {
    // Check if we're offline
    if (!navigator.onLine) {
      try {
        // Try to return cached version of the main app
        const cache = await caches.open('pages');
        const cachedResponse = await cache.match('/');
        if (cachedResponse) {
          return cachedResponse;
        }
      } catch (error) {
        console.log('Error serving offline page:', error);
      }
    }
    
    // Fallback to network
    return fetch(event.request);
  },
  {
    // Exclude admin routes from being cached/served when offline
    denylist: [/^\/admin/],
  }
);

registerRoute(navigationRoute);

// Background sync for offline actions
sw.addEventListener('sync', (event: any) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any offline actions that need to be synced
  console.log('Background sync triggered');
}

// Push notification handling
sw.addEventListener('push', (event: PushEvent) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    } as any;

    event.waitUntil(
      sw.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification click
sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      sw.clients.openWindow('/dashboard')
    );
  }
});

// Install event
sw.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service Worker: Install Event');
  
  // Pre-cache critical pages
  event.waitUntil(
    caches.open('pages').then(cache => {
      return cache.addAll([
        '/',
        '/login',
        '/dashboard',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png'
      ]);
    })
  );
});

// Activate event
sw.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service Worker: Activate Event');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== 'pages' && cacheName !== 'static-resources') {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
