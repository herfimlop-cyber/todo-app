// Handle push event (Web Push)
self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        event.waitUntil(
            self.registration.showNotification(data.title || 'Notification', {
                body: data.body || '',
                tag: 'webpush',
                requireInteraction: false
            })
        );
    }
});
// Service Worker for PWA notifications
const CACHE_VERSION = 'v1';

// Install event
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(clients.claim());
});


// Only notify once per minute (not every second)
let lastMinuteChecked = null;
setInterval(() => {
    const now = new Date();
    const currentMinute = now.getUTCHours() + ':' + now.getUTCMinutes();
    if (lastMinuteChecked !== currentMinute) {
        lastMinuteChecked = currentMinute;
        checkAndNotify();
    }
}, 1000);

// Listen for messages from the app
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CHECK_NOTIFICATIONS') {
        checkAndNotify();
    }
});

// Periodic sync for checking notifications (background task)
self.addEventListener('periodicSync', event => {
    if (event.tag === 'check-notifications') {
        event.waitUntil(checkAndNotify());
    }
});

async function checkAndNotify() {
    try {
        const response = await fetch('/api/notifications/check');
        const data = await response.json();

        if (data.notifications && Array.isArray(data.notifications)) {
            for (const notification of data.notifications) {
                self.registration.showNotification(notification.title, {
                    body: notification.body,
                    tag: `notification-${notification.id}`,
                    requireInteraction: false
                });
            }
        }
    } catch (error) {
        console.error('[SW] Error checking notifications:', error);
    }
}

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Fetch event for offline support
self.addEventListener('fetch', event => {
    if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request).then(response => {
                    return response;
                }).catch(() => {
                    return new Response('Offline - content not available', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                            'Content-Type': 'text/plain'
                        })
                    });
                });
            })
        );
    }
});
