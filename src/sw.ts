/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;

import { precacheAndRoute } from 'workbox-precaching';

// Required for vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('push', (event) => {
    let data: any = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'New Notification', body: event.data.text() };
        }
    }

    // Support both direct payloads and standard nested FCM payloads
    const notificationData = data.notification || data;
    const customData = data.data || data;

    const title = notificationData.title || 'Only Memes Earn';
    const options = {
        body: notificationData.body || 'You have a new update!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: {
            url: customData.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.openWindow(event.notification.data.url)
    );
});
