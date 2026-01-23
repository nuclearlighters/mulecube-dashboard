/**
 * MuleCube Dashboard - Service Worker
 * Provides offline caching for PWA functionality
 * v1.0.0
 */

const CACHE_NAME = 'mulecube-dashboard-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const ASSETS_TO_CACHE = [
    '/',
    '/css/dashboard.css',
    '/css/docs.css',
    '/js/dashboard.js',
    '/manifest.json',
    '/images/logo_mulecube_trans_white.png',
    '/images/logo_mulecube_trans_black.png',
    '/images/product-base.png',
    '/images/mulecube-logo-bg.png',
    '/images/favicon-16x16.png',
    '/images/favicon-32x32.png',
    '/images/icons/icon-192.png',
    '/images/icons/icon-512.png',
    '/images/icons/ui-search.svg',
    '/images/icons/ui-star.svg',
    '/images/icons/ui-chevron.svg',
    '/images/icons/ui-moon.svg',
    '/images/icons/ui-sun.svg',
    '/images/icons/stat-hostname.svg',
    '/images/icons/stat-uptime.svg',
    '/images/icons/stat-temp.svg',
    '/images/icons/stat-battery.svg',
    '/images/icons/cat-ai.svg',
    '/images/icons/cat-knowledge.svg',
    '/images/icons/cat-collaboration.svg',
    '/images/icons/cat-security.svg',
    '/images/icons/cat-files.svg',
    '/images/icons/cat-communication.svg',
    '/images/icons/cat-tools.svg',
    '/images/icons/cat-infrastructure.svg',
    '/images/icons/cat-admin.svg',
    '/apple-touch-icon.png'
];

// Install event - cache core assets
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching core assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] Cache failed:', err))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip external requests
    if (!url.origin.includes(self.location.origin)) return;
    
    // API/stats calls: Network first, no cache
    if (url.pathname === '/stats.json' || url.pathname.startsWith('/api/')) {
        event.respondWith(networkOnly(event.request));
        return;
    }
    
    // HTML pages: Network first, cache fallback
    if (event.request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirst(event.request));
        return;
    }
    
    // Static assets: Cache first, network fallback
    event.respondWith(cacheFirst(event.request));
});

// Network only - for API calls
async function networkOnly(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.log('[SW] Network request failed:', request.url);
        return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Network first - for HTML pages
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);
        return cachedResponse || caches.match('/');
    }
}

// Cache first - for static assets
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Asset fetch failed:', request.url);
        return new Response('', { status: 404 });
    }
}

// Handle messages from main thread
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
