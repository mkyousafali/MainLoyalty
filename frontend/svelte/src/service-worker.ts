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
