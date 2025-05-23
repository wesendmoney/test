importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuración de Firebase (la misma que en scripts.js)
firebase.initializeApp({
    apiKey: "AIzaSyA0NDOIw9wTunNGyJTHgh8JHmMM__hUzrk",
    authDomain: "wesm-6ce39.firebaseapp.com",
    projectId: "wesm-6ce39",
    storageBucket: "wesm-6ce39.firebasestorage.app",
    messagingSenderId: "417323501500",
    appId: "1:417323501500:web:2550c12546e7de0f4f8db9",
    measurementId: "G-H2H6Y2WVSF"
});

const messaging = firebase.messaging();

// Manejar notificaciones en primer plano
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.svg' // Asegúrate de tener este icono en tu proyecto
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
