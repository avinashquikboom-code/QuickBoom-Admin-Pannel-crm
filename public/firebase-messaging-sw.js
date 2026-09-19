// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// Note: Only client public configuration is used here. No private credentials.
const firebaseConfig = {
  apiKey: "AIzaSyD4PdZi3Q8KAML8NojpsnzdHFuP_VEkA54",
  authDomain: "quikboom-crm-925d5.firebaseapp.com",
  projectId: "quikboom-crm-925d5",
  storageBucket: "quikboom-crm-925d5.firebasestorage.app",
  messagingSenderId: "325119319653",
  appId: "1:325119319653:web:9375042c4ead48710b708c",
  measurementId: "G-S0BTYB3NB9",
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM] Background message received:', payload);

  const title = payload.notification?.title || payload.data?.title || 'QuikBoom Admin';
  const body =
    payload.notification?.body ||
    payload.data?.body ||
    payload.data?.message ||
    'New operational notification received.';

  const notificationOptions = {
    body: body,
    icon: '/logo.png',
    badge: '/favicon.ico',
    tag: payload.data?.notificationId || payload.data?.type || 'quikboom-admin-alert',
    data: {
      ...payload.data,
      click_action: payload.data?.route || payload.fcmOptions?.link || '/notifications',
    },
    requireInteraction: true,
  };

  console.log('[FCM] Notification displayed');
  return self.registration.showNotification(title, notificationOptions);
});

// Handle notification click: focus existing tab or navigate to the target route
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM] Notification clicked');
  event.notification.close();

  const targetRoute =
    event.notification.data?.click_action ||
    event.notification.data?.route ||
    '/notifications';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If an Admin Panel window is already open, focus it and navigate
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url && 'focus' in client) {
            client.focus();
            if ('navigate' in client && targetRoute) {
              client.navigate(targetRoute);
            }
            return;
          }
        }
        // If no window is open, open a new window to the route
        if (clients.openWindow) {
          return clients.openWindow(targetRoute);
        }
      }),
  );
});
