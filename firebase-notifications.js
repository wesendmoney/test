// firebase-notifications.js

// ==============================================
// CONFIGURACIÓN Y VARIABLES
// ==============================================
const firebaseConfig = {
    apiKey: "AIzaSyA0NDOIw9wTunNGyJTHgh8JHmMM__hUzrk",
    authDomain: "wesm-6ce39.firebaseapp.com",
    projectId: "wesm-6ce39",
    storageBucket: "wesm-6ce39.appspot.com",
    messagingSenderId: "417323501500",
    appId: "1:417323501500:web:2550c12546e7de0f4f8db9",
    measurementId: "G-H2H6Y2WVSF"
};

// Variables de estado
let firebaseInitialized = false;
let messagingInstance = null;
let fcmToken = null;
let tokenRefreshTimer = null;
let notificationListenersInitialized = false;

// ==============================================
// FUNCIONES PRINCIPALES
// ==============================================

/**
 * Inicializa Firebase y configura las notificaciones
 */
async function initializeFirebaseNotifications() {
    try {
        // Verificar si el usuario está autenticado
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        if (!isLoggedIn) return;

        // Cargar scripts de Firebase si no están disponibles
        if (typeof firebase === 'undefined') {
            await loadFirebaseScripts();
        }

        // Inicializar Firebase
        const messaging = getFirebaseMessaging();
        if (!messaging) return;

        // Obtener y gestionar el token FCM
        await manageFCMToken();

        // Configurar listeners de notificaciones
        setupNotificationListeners();

        console.log('Firebase Notifications inicializado correctamente');
    } catch (error) {
        console.error('Error inicializando Firebase Notifications:', error);
    }
}

/**
 * Limpia los recursos de Firebase al cerrar sesión
 */
function cleanupFirebase() {
    if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
        tokenRefreshTimer = null;
    }
    fcmToken = null;
    firebaseInitialized = false;
    notificationListenersInitialized = false;
    console.log('Recursos de Firebase limpiados');
}

// ==============================================
// FUNCIONES DE APOYO
// ==============================================

/**
 * Obtiene la instancia de Firebase Messaging
 */
function getFirebaseMessaging() {
    if (!firebaseInitialized) {
        try {
            // Verificar si Firebase ya está inicializado para evitar duplicados
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            messagingInstance = firebase.messaging();
            firebaseInitialized = true;
        } catch (error) {
            console.error('Error inicializando Firebase:', error);
            return null;
        }
    }
    return messagingInstance;
}

/**
 * Gestiona el token FCM (obtiene, guarda y refresca)
 */
async function manageFCMToken() {
    const messaging = getFirebaseMessaging();
    if (!messaging) return null;
    
    // Eliminar temporizador anterior si existe
    if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
    }
    
    try {
        // Obtener el token actual
        const currentToken = await messaging.getToken({ 
            vapidKey: 'BIjUoTPCiMDAg7ILetFmwMw-EM4ootWd0LaumD9AEhFVFJodJeWj1Z94utg1oDV7qEx_U32t7YM1nS64mUcqJMY'
        });
        
        if (currentToken) {
            console.log('Token FCM obtenido:', currentToken);
            fcmToken = currentToken;
            
            // Guardar el token si el usuario está autenticado
            const storedUser = localStorage.getItem("currentUser");
            if (storedUser) {
                await saveFCMToken(currentToken);
            }
            
            // Configurar temporizador para refrescar el token periódicamente
            tokenRefreshTimer = setTimeout(() => {
                console.log('Refrescando token FCM...');
                fcmToken = null;
                manageFCMToken();
            }, 12 * 60 * 60 * 1000); // 12 horas
            
            return currentToken;
        }
        
        console.log('No se pudo obtener el token FCM - ¿Permisos denegados?');
        return null;
    } catch (error) {
        console.error('Error al obtener el token FCM:', error);
        return null;
    }
}

/**
 * Configura los listeners de notificaciones
 */
function setupNotificationListeners() {
    if (notificationListenersInitialized) return;
    
    const messaging = getFirebaseMessaging();
    if (!messaging) return;
    
    // Escuchar mensajes en primer plano (solo una vez)
    messaging.onMessage((payload) => {
        console.log('Mensaje recibido en primer plano:', payload);
        if (payload.notification) {
            const { title, body } = payload.notification;
            showCustomNotification(title, body);
        }
    });
    
    notificationListenersInitialized = true;
}

/**
 * Carga los scripts de Firebase dinámicamente
 */
function loadFirebaseScripts() {
    return new Promise((resolve, reject) => {
        if (typeof firebase !== 'undefined') {
            resolve();
            return;
        }
        
        const scripts = [
            'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js',
            'https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js'
        ];
        
        let loaded = 0;
        
        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                loaded++;
                if (loaded === scripts.length) resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    });
}

/**
 * Guarda el token FCM en el servidor
 */
async function saveFCMToken(token) {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
        console.error('No hay usuario logueado');
        return false;
    }

    const user = JSON.parse(storedUser);
    const email = user.email;
    
    if (!email) {
        console.error('No se pudo obtener el email del usuario');
        return false;
    }
    
    try {
        const apiUrl = "https://script.google.com/macros/s/AKfycbxAJ8ctPac4CMPHmuJw_sByrTShxM7MxMq315b6pNVavZkkY2nR85uVm2qY__HaAf5WGA/exec";
        const url = `${apiUrl}?path=saveFCMToken&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 200) {
            console.log('Token FCM guardado correctamente');
            return true;
        } else {
            console.error('Error del servidor:', data.message || 'Sin mensaje de error');
            return false;
        }
    } catch (error) {
        console.error('Error al guardar el token FCM:', error);
        return false;
    }
}

/**
 * Muestra una notificación personalizada en la UI
 */
function showCustomNotification(title, message) {
    // Verificar si Notification API está disponible
    if (!('Notification' in window)) {
        console.warn('Este navegador no soporta notificaciones');
        return;
    }

    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
        <button class="close-notification">&times;</button>
    `;
    
    // Estilos
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#333';
    notification.style.color = 'white';
    notification.style.padding = '15px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    notification.style.zIndex = '1000';
    notification.style.display = 'flex';
    notification.style.justifyContent = 'space-between';
    notification.style.alignItems = 'center';
    notification.style.maxWidth = '300px';
    
    // Botón para cerrar
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'white';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';
    
    closeBtn.addEventListener('click', () => {
        notification.style.display = 'none';
    });
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
    
    // Agregar al DOM
    document.body.appendChild(notification);
}

/**
 * Solicita permiso para notificaciones
 */
 async function requestNotificationPermission() {
    try {
        // Verificar soporte de service workers
        if (!('serviceWorker' in navigator)) {
            throw new Error('Este navegador no soporta service workers');
        }

        // Registrar service worker
        const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
        console.log('Service Worker registrado correctamente');

        // Esperar a que esté activo
        await navigator.serviceWorker.ready;
        
        // Solicitar permiso
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Permiso de notificación denegado por el usuario');
        }

        console.log('Permiso de notificación concedido');
        return true;
    } catch (error) {
        console.error('Error en requestNotificationPermission:', error);
        
        // Mostrar mensaje al usuario si es relevante
        if (error.message.includes('404')) {
            alert('Error: No se encontró el archivo necesario para las notificaciones. Por favor, contacta al soporte.');
        } else if (error.message.includes('denegado')) {
            console.log('Usuario denegó los permisos de notificación');
        }
        
        return false;
    }
}
