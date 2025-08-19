// Service Worker for iPhone 13+ PWA Support
const CACHE_NAME = 'urban-market-loyalty-v1';
const urlsToCache = [
  '/',
  '/login',
  '/dashboard',
  '/logo.png',
  '/favicon.svg',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('SW: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('SW: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('SW: Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - Network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If request is successful, clone and cache it
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to get from cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // If not in cache and it's a navigation request, return the main page
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline - Content not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background sync for iPhone 13+ PWA capabilities
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync event:', event.tag);
  
  if (event.tag === 'loyalty-sync') {
    event.waitUntil(
      // Sync loyalty data when back online
      syncLoyaltyData()
    );
  }
});

// Push notifications support for iPhone 13+ PWA
self.addEventListener('push', (event) => {
  console.log('SW: Push event received');
  
  let options = {
    body: 'You have new loyalty rewards available!',
    icon: '/logo.png',
    badge: '/logo.png',
    data: {
      url: '/dashboard'
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard'
      }
    ]
  };

  if (event.data) {
    const payload = event.data.json();
    options = {
      ...options,
      ...payload
    };
  }

  event.waitUntil(
    self.registration.showNotification('Urban Market Loyalty', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification click received');
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.openWindow(url)
  );
});

// Helper function for syncing data
async function syncLoyaltyData() {
  try {
    console.log('SW: Syncing loyalty data...');
    // This would sync offline actions when back online
    return Promise.resolve();
  } catch (error) {
    console.error('SW: Sync failed:', error);
    throw error;
  }
}

// Message handling for communication with main app
self.addEventListener('message', (event) => {
  console.log('SW: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION',
      version: CACHE_NAME
    });
  }
});
