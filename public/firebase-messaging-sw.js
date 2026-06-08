// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');


// Use the same config as the main app
// Normally, one would hardcode the config here or fetch it.
fetch('/firebase-applet-config.json').then(res => res.json()).then(config => {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();
    
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      // Customize notification here
      const notificationTitle = payload.notification?.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/favicon.ico' // Or your app logo path
      };
    
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
}).catch(e => {
    console.error("Could not init firebase SW", e);
});
