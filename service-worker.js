const CACHE_NAME = 'heic-converter-v2';
const ASSETS = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0/client',
  'https://esm.sh/react@18.2.0/',
  'https://esm.sh/react-dom@18.2.0/',
  'https://esm.sh/framer-motion@10.16.4?deps=react@18.2.0,react-dom@18.2.0',
  'https://esm.sh/lucide-react@0.292.0?deps=react@18.2.0',
  'https://esm.sh/clsx@2.0.0',
  'https://esm.sh/tailwind-merge@2.0.0',
  'https://esm.sh/heic2any@0.0.4',
  'https://esm.sh/jszip@3.10.1',
  'https://esm.sh/file-saver@2.0.5'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Listen for skip waiting message (though we do it on install, this handles manual triggers)
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});