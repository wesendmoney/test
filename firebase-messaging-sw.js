importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyA0NDOIw9wTunNGyJTHgh8JHmMM__hUzrk",
    authDomain: "wesm-6ce39.firebaseapp.com",
    projectId: "wesm-6ce39",
    storageBucket: "wesm-6ce39.appspot.com",
    messagingSenderId: "417323501500",
    appId: "1:417323501500:web:2550c12546e7de0f4f8db9"
});

const messaging = firebase.messaging();

// Solo manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log('Notificación en segundo plano:', payload);
    const { title, body } = payload.notification;
    return self.registration.showNotification(title, { body, icon: '/logo.svg' });
});
