// ==============================================
// CONSTANTES Y VARIABLES GLOBALES
// ==============================================
const apiUrl = "https://script.google.com/macros/s/AKfycbxAJ8ctPac4CMPHmuJw_sByrTShxM7MxMq315b6pNVavZkkY2nR85uVm2qY__HaAf5WGA/exec";
let currentUser = "";
let userCurrency = "";
let lastFetchedOrders = [];
let currentOrderId;
let currentToAmount;
let currentToCurrency;
let uploadedImageUrl = "";
let receiptUrl = "";
let imageFile;
let exchangeRatesCache = {};
let lastEditedField = "";
let lastEditedFieldOut = "";
let conversionTimeout;
let updateButtonTimeout;
const receiptCache = {};
let userTransactions = [];

// Configuración de Firebase para notificaciones push
const firebaseConfig = {
    apiKey: "AIzaSyA0NDOIw9wTunNGyJTHgh8JHmMM__hUzrk",
    authDomain: "wesm-6ce39.firebaseapp.com",
    projectId: "wesm-6ce39",
    storageBucket: "wesm-6ce39.firebasestorage.app",
    messagingSenderId: "417323501500",
    appId: "1:417323501500:web:2550c12546e7de0f4f8db9",
    measurementId: "G-H2H6Y2WVSF"
};

// Inicializar Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging(firebaseApp);

// ==============================================
// FUNCIONES DE INICIO Y CARGA
// ==============================================
document.addEventListener("DOMContentLoaded", async () => {
    // Verificar si hay una sesión activa
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const lastActivity = parseInt(localStorage.getItem("lastActivity") || "0");
        const sessionTimeout = 24 * 60 * 60 * 1000; // 24 horas de timeout
    
        // Páginas que requieren autenticación (excluye login, register e index)
        const privatePages = [
            'calculator.html',
            'orders.html', 
            'rates.html',
            'bank-map.html',
            'profile.html'
        ];
        
        const currentPage = window.location.pathname.split('/').pop();
        
        // Redirigir si no está autenticado en una página privada
        if (privatePages.includes(currentPage)) {
            if (!isLoggedIn || (Date.now() - lastActivity > sessionTimeout)) {
                localStorage.removeItem("isLoggedIn"); // Limpiar sesión inválida
                window.location.href = "index.html";
                return; // Detener ejecución
            }
            // Actualizar última actividad si la sesión es válida
            localStorage.setItem("lastActivity", Date.now());
        }

    // Si hay sesión activa y no ha expirado
    if (isLoggedIn && (Date.now() - lastActivity < sessionTimeout)) {
        const storedUser = localStorage.getItem("currentUser");
        const storedRole = localStorage.getItem("userRole");


        if (storedUser && storedRole) {
            const user = JSON.parse(storedUser);
            currentUser = user.name;
            userCurrency = user.country;

            // Actualizar última actividad
            localStorage.setItem("lastActivity", Date.now());

            // Resto de tu lógica de carga...
            if (window.location.pathname.includes("profile.html")) {
                document.getElementById("userName").textContent = user.name;
                document.getElementById("userRole").textContent = storedRole;
                document.getElementById("userCurrency").textContent = userCurrency;
                await setupProfilePage();
            }

            await fetchAllExchangeRates();

            if (window.location.pathname.includes("calculator.html") || window.location.pathname === "/") {
                setupCalculatorPage();
            } else if (window.location.pathname.includes("orders.html")) {
                setupOrdersPage();
            }
        }
    } 
    // Redirigir a login si no está autenticado en páginas privadas
    else if (!window.location.pathname.includes("login.html") && 
             !window.location.pathname.includes("register.html") && 
             !window.location.pathname.includes("index.html")) {
        // Limpiar datos de sesión inválidos
        localStorage.removeItem("isLoggedIn");
        window.location.href = "index.html";
    }
    
    // Configurar eventos comunes
    setupCommonEvents();
});


let lastRatesUpdate = 0;
const RATES_CACHE_TIME = 3000000;

async function fetchAllExchangeRates() {
    const now = Date.now();
    if (now - lastRatesUpdate < RATES_CACHE_TIME && Object.keys(exchangeRatesCache).length > 0) {
        return;
    }
    
    try {
        showLoader();
        const response = await fetch(`${apiUrl}?path=getExchangeRate`);
        const data = await response.json();
        
        if (data.status === 200) {
            exchangeRatesCache = data.exchangeRates;
            lastRatesUpdate = now;
        }
    } finally {
        hideLoader();
    }
}

function setupCalculatorPage() {
    // Cargar tasa de cambio al inicio
    updateExchangeRate(); // Para calculator.html
    updateExchangeRateOut(); // Para index.html
    
    if (document.getElementById("from-amount")) {
        document.getElementById("from-amount").addEventListener("input", function() {
            lastEditedField = "from";
            clearTimeout(conversionTimeout);
            conversionTimeout = setTimeout(convertCurrency, 500);
            updateUploadButtonText();
        });
    }

    if (document.getElementById("to-amount")) {
        document.getElementById("to-amount").addEventListener("input", function() {
            lastEditedField = "to";
            clearTimeout(conversionTimeout);
            conversionTimeout = setTimeout(convertCurrency, 500);
            updateUploadButtonText();
        });
    }

    if (document.getElementById("from-currency")) {
        document.getElementById("from-currency").addEventListener("change", async () => {
            clearAmountFields();
            await updateExchangeRate();
            await convertCurrency();
        });
    }

    if (document.getElementById("to-currency")) {
        document.getElementById("to-currency").addEventListener("change", async () => {
            clearAmountFields();
            await updateExchangeRate();
            await convertCurrency();
        });
    }

    if (document.getElementById("from-amount-out")) {
        document.getElementById("from-amount-out").addEventListener("input", function() {
            lastEditedFieldOut = "from";
            convertCurrencyOut();
        });
    }

    if (document.getElementById("to-amount-out")) {
        document.getElementById("to-amount-out").addEventListener("input", function() {
            lastEditedFieldOut = "to";
            convertCurrencyOut();
        });
    }

    if (document.getElementById("from-currency-out")) {
        document.getElementById("from-currency-out").addEventListener("change", async () => {
            clearAmountFieldsOut();
            await updateExchangeRateOut();
            await convertCurrencyOut();
        });
    }

    if (document.getElementById("to-currency-out")) {
        document.getElementById("to-currency-out").addEventListener("change", async () => {
            clearAmountFieldsOut();
            await updateExchangeRateOut();
            await convertCurrencyOut();
        });
    }

    if (document.getElementById("send-whatsapp")) {
        document.getElementById("send-whatsapp").addEventListener("click", function() {
            const fromAmount = document.getElementById("from-amount-out").value;
            const fromCurrency = document.getElementById("from-currency-out").value;
            const toAmount = document.getElementById("to-amount-out").value;
            const toCurrency = document.getElementById("to-currency-out").value;
            const exchangeRateText = document.getElementById("exchange-rate-out").textContent;

            const message = `Hola! Quiero enviar ${fromAmount} ${fromCurrency}, que se convierte en ${toAmount} ${toCurrency}. ${exchangeRateText}`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/584121542322?text=${encodedMessage}`;

            window.open(whatsappUrl, "_blank");
        });
    }

    if (document.getElementById("imageInput")) {
        document.getElementById("imageInput").addEventListener("change", function(event) {
            const file = event.target.files[0];
            const previewContainer = document.getElementById("imagePreviewContainer");
            const preview = document.getElementById("imagePreview");

            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    previewContainer.style.display = "block";
                };
                reader.readAsDataURL(file);

                const tabs = document.querySelectorAll(".tab");
                const tabContents = document.querySelectorAll(".tab-content");

                tabs.forEach((t) => t.classList.remove("active"));
                tabContents.forEach((tc) => {
                    tc.classList.remove("active");
                    tc.style.display = "none";
                });

                const receiptTab = document.querySelector('.tab[data-tab="receipt"]');
                if (receiptTab) {
                    receiptTab.classList.add("active");
                    const receiptContent = document.getElementById("receipt");
                    if (receiptContent) {
                        receiptContent.classList.add("active");
                        receiptContent.style.display = "block";
                    }
                }
            }
        });
    }

    if (document.getElementById("uploadButtonModal")) {
        document.getElementById("uploadButtonModal").addEventListener("click", uploadImage);
    }

    if (document.getElementById("submitPayment")) {
        document.getElementById("submitPayment").addEventListener("click", submitPayment);
    }

    if (document.getElementById("openReceiptButton")) {
        document.getElementById("openReceiptButton").addEventListener("click", function() {
            document.getElementById("imageInput").click();
        });
    }
}

function setupOrdersPage() {
    if (document.getElementById("ordersList")) {
        fetchOrders();
    }

    if (document.getElementById("pendingPaymentsList")) {
        fetchPendingPayments();
    }

    if (document.getElementById("validatedPaymentsList")) {
        fetchValidatedPayments();
    }
}

function setupCommonEvents() {
    const menuIcons = document.querySelectorAll('.menu-icon');
    menuIcons.forEach(icon => {
        icon.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });
    });

    if (document.getElementById("menu-icon") || document.querySelector(".menu-icon")) {
        const menuIcons = document.querySelectorAll(".menu-icon");
        menuIcons.forEach(icon => {
            icon.addEventListener("click", toggleMenu);
        });
    }

    const tabs = document.querySelectorAll(".tab");
    if (tabs.length > 0) {
        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                tabs.forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                const selectedTab = tab.getAttribute("data-tab");
                const selectedContent = document.getElementById(selectedTab);
                if (selectedContent) {
                    document.querySelectorAll(".tab-content").forEach(tc => {
                        tc.classList.remove("active");
                        tc.style.display = "none";
                    });
                    selectedContent.classList.add("active");
                    selectedContent.style.display = "block";
                }
            });
        });
    }
}

// ==============================================
// FUNCIONES DE AUTENTICACIÓN
// ==============================================
async function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        showMessage("Por favor, completa todos los campos.");
        return;
    }

    showLoader();

    try {
        const response = await fetch(`${apiUrl}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
        const data = await response.json();
        
        if (data.success) {
            // Guardar datos de usuario
            localStorage.setItem("currentUser", JSON.stringify(data.user));
            localStorage.setItem("userRole", data.role);
            localStorage.setItem("isLoggedIn", "true");
            currentUser = data.user.name;

            // Solicitar permiso para notificaciones solo después del login exitoso
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        await setupPushNotifications(data.user.email);
                    }
                } catch (error) {
                    console.error('Error al configurar notificaciones:', error);
                }
            }

            showMessage("Inicio de sesión exitoso!", false);
            window.location.href = "calculator.html";
        } else {
            showMessage("Credenciales inválidas: " + data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        showMessage("Ocurrió un error durante el inicio de sesión.");
    } finally {
        hideLoader();
    }
}

async function setupPushNotifications(email) {
    try {
        // Registrar el Service Worker
        const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
        console.log("Service Worker registrado");

        // Obtener el token FCM
        const token = await messaging.getToken({
            vapidKey: 'BIjUoTPCiMDAg7ILetFmwMw-EM4ootWd0LaumD9AEhFVFJodJeWj1Z94utg1oDV7qEx_U32t7YM1nS64mUcqJMY',
            serviceWorkerRegistration: registration
        });

        // Guardar el token en el servidor
        await saveFCMToken(token, email);

        // Escuchar mensajes en primer plano
        messaging.onMessage((payload) => {
            console.log('Mensaje recibido:', payload);
            if (payload.notification) {
                showCustomNotification(payload.notification.title, payload.notification.body);
            }
        });

    } catch (error) {
        console.error("Error en setupPushNotifications:", error);
    }
}

function register() {
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;

    if (!username || !email || !phone || !password) {
        showMessage("Por favor, completa todos los campos.");
        return;
    }
    showLoader();

    fetch(`${apiUrl}?action=register&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&password=${encodeURIComponent(password)}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                showMessage(data.message, false);
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            } else {
                showMessage(data.message);
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            showMessage("Ocurrió un error durante el registro.");
        })
        .finally(() => {
            hideLoader();
        });
}

function logout() {
    // Limpiar todas las variables globales
    currentUser = "";
    userCurrency = "";
    lastFetchedOrders = [];
    
    // Limpiar todo el localStorage relacionado con la sesión
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userCurrency");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("lastActivity");
    
    // Redirigir a la página de inicio
    window.location.href = "index.html";
}

// ==============================================
// FUNCIONES DE INTERFAZ DE USUARIO
// ==============================================
function toggleMenu() {
    const menu = document.getElementById("menu");
    if (menu) {
        // Mostrar opciones diferentes según si hay sesión activa
        if (localStorage.getItem("isLoggedIn") === "true") {
            menu.innerHTML = `
                <div class="menu-content">
                    <a href="calculator.html">Cotizador</a>
                    <a href="orders.html">Órdenes</a>
                    <a href="profile.html">Perfil</a>
                    <a onclick="logout()">Cerrar Sesión</a>
                </div>
            `;
        } else {
            menu.innerHTML = `
                <div class="menu-content">
                    <a href="login.html" class="login-button">Iniciar Sesión</a>
                    <a href="register.html" class="register-button">Registrarse</a>
                </div>
            `;
        }
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    }
}
document.addEventListener('click', function(event) {
    const menu = document.getElementById("menu");
    const menuIcon = document.querySelector('.menu-icon');
    
    if (menu && menuIcon) {
        if (!menu.contains(event.target) && event.target !== menuIcon) {
            menu.style.display = 'none';
        }
    }
});

function closeMenu() {
    document.getElementById("menu").style.display = "none";
}

function showMessage(message, isError = true) {
    const messageDiv = document.getElementById("message");
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.style.color = isError ? "red" : "green";
    }
}

function showLoader() {
    const overlay = document.getElementById("overlay");
    const loader = document.querySelector(".loader");
    if (overlay) overlay.style.display = "block";
    if (loader) loader.style.display = "block";
}

function hideLoader() {
    const overlay = document.getElementById("overlay");
    const loader = document.querySelector(".loader");
    if (overlay) overlay.style.display = "none";
    if (loader) loader.style.display = "none";
}

// ==============================================
// FUNCIONES DE CONVERSIÓN DE MONEDA
// ==============================================
function convertCurrency() {
    const fromCurrency = document.getElementById("from-currency").value;
    const toCurrency = document.getElementById("to-currency").value;
    const fromAmount = parseFloat(document.getElementById("from-amount").value);
    const toAmount = parseFloat(document.getElementById("to-amount").value);

    if (lastEditedField === "from" && isNaN(fromAmount)) {
        document.getElementById("to-amount").value = "";
        return;
    } else if (lastEditedField === "to" && isNaN(toAmount)) {
        document.getElementById("from-amount").value = "";
        return;
    }

    try {
        const rate = exchangeRatesCache[`${fromCurrency}_${toCurrency}`];
        if (rate === undefined) {
            throw new Error("Tasa de cambio no disponible");
        }

        if (lastEditedField === "from" && !isNaN(fromAmount)) {
            const convertedAmount = fromAmount * rate;
            document.getElementById("to-amount").value = convertedAmount.toFixed(2);
        } else if (lastEditedField === "to" && !isNaN(toAmount)) {
            const convertedAmount = toAmount / rate;
            document.getElementById("from-amount").value = convertedAmount.toFixed(2);
        }
    } catch (error) {
        console.error("Error al obtener la tasa de cambio:", error);
        document.getElementById("exchange-rate").textContent = "Tasa de cambio no disponible";
    }
}

function updateExchangeRate() {
    const fromCurrency = document.getElementById("from-currency")?.value;
    const toCurrency = document.getElementById("to-currency")?.value;
    const rateElement = document.getElementById("exchange-rate");

    if (!fromCurrency || !toCurrency || !rateElement) return;

    const rate = exchangeRatesCache[`${fromCurrency}_${toCurrency}`];
    rateElement.textContent = rate !== undefined 
        ? `Tasa de cambio: 1 ${fromCurrency} = ${rate} ${toCurrency}`
        : "Tasa no disponible";
}

function convertCurrencyOut() {
    const fromCurrencyOut = document.getElementById("from-currency-out").value;
    const toCurrencyOut = document.getElementById("to-currency-out").value;
    const fromAmountOut = parseFloat(document.getElementById("from-amount-out").value);
    const toAmountOut = parseFloat(document.getElementById("to-amount-out").value);

    if (lastEditedFieldOut === "from" && isNaN(fromAmountOut)) {
        document.getElementById("to-amount-out").value = "";
        return;
    } else if (lastEditedFieldOut === "to" && isNaN(toAmountOut)) {
        document.getElementById("from-amount-out").value = "";
        return;
    }

    try {
        const rateOut = exchangeRatesCache[`${fromCurrencyOut}_${toCurrencyOut}`];
        if (rateOut === undefined) {
            throw new Error("Tasa de cambio no disponible");
        }

        if (lastEditedFieldOut === "from" && !isNaN(fromAmountOut)) {
            const convertedAmountOut = fromAmountOut * rateOut;
            document.getElementById("to-amount-out").value = convertedAmountOut.toFixed(2);
        } else if (lastEditedFieldOut === "to" && !isNaN(toAmountOut)) {
            const convertedAmountOut = toAmountOut / rateOut;
            document.getElementById("from-amount-out").value = convertedAmountOut.toFixed(2);
        }

        updateTotal();
    } catch (error) {
        console.error("Error al obtener la tasa de cambio:", error);
        document.getElementById("exchange-rate-out").textContent = "Tasa de cambio no disponible";
    }
}

function updateExchangeRateOut() {
    const fromCurrency = document.getElementById("from-currency-out")?.value;
    const toCurrency = document.getElementById("to-currency-out")?.value;
    const rateElement = document.getElementById("exchange-rate-out");

    if (!fromCurrency || !toCurrency || !rateElement) return;

    const rate = exchangeRatesCache[`${fromCurrency}_${toCurrency}`];
    rateElement.textContent = rate !== undefined
        ? `Tasa de cambio: 1 ${fromCurrency} = ${rate} ${toCurrency}`
        : "Tasa no disponible";
}

function updateTotal() {
    const fromAmount = parseFloat(document.getElementById("from-amount-out").value) || 0;
    const fromCurrency = document.getElementById("from-currency-out").value;
    const totalElement = document.querySelector('.total');
    
    if (totalElement) {
        totalElement.textContent = `${fromAmount.toFixed(2)} ${fromCurrency}`;
    }
}

function clearAmountFields() {
    const fromAmount = document.getElementById("from-amount");
    const toAmount = document.getElementById("to-amount");
    if (fromAmount) fromAmount.value = "";
    if (toAmount) toAmount.value = "";
}

function clearAmountFieldsOut() {
    const fromAmountOut = document.getElementById("from-amount-out");
    const toAmountOut = document.getElementById("to-amount-out");
    if (fromAmountOut) fromAmountOut.value = "";
    if (toAmountOut) toAmountOut.value = "";
}

function updateUploadButtonText() {
    const fromAmount = document.getElementById("from-amount").value;
    const fromCurrency = document.getElementById("from-currency").value;
    const uploadButtonText = document.getElementById("uploadButtonText");
    const openReceiptButton = document.getElementById("openReceiptButton");

    if (uploadButtonText && openReceiptButton) {
        if (fromAmount && fromCurrency) {
            uploadButtonText.textContent = `Haz clic aquí para subir un comprobante por el monto de ${fromAmount} ${fromCurrency}`;
            openReceiptButton.disabled = false;
        } else {
            uploadButtonText.textContent = "Haz clic aquí para subir un comprobante";
            openReceiptButton.disabled = true;
        }
    }
}

// ==============================================
// FUNCIONES DE GESTIÓN DE ÓRDENES
// ==============================================
async function fetchOrders() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${apiUrl}?path=getOrders&resellerName=${encodeURIComponent(currentUser)}`);
        const orders = await response.json();
        const ordersList = document.getElementById("ordersList");

        if (!ordersList) return;
        ordersList.innerHTML = "";

        if (orders && Array.isArray(orders) && orders.length > 0) {
            orders.forEach((order) => {
                const listItem = createOrderListItem(order);
                ordersList.appendChild(listItem);
            });
        } else {
            ordersList.innerHTML = "<li>No hay órdenes disponibles.</li>";
        }
    } catch (error) {
        console.error("Error fetching orders:", error);
        const ordersList = document.getElementById("ordersList");
        if (ordersList) ordersList.innerHTML = "<li>Error al cargar las órdenes.</li>";
    }
}

function createOrderListItem(order) {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>Order ID:</strong> ${order["Order ID"] || "N/A"}
        <span class="order-status">${order["Status"] || "N/A"}</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>Monto:</strong> ${order["From Amount"] || "N/A"} ${order["From Currency"] || "N/A"}
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>Precio a Recibir:</strong> ${order["To Amount"] || "N/A"} ${order["To Currency"] || "N/A"}
    </div>
    <div class="input-group">
        <button onclick="showReceipt('${order["Comprobante"] || ""}', '${order["Order ID"]}')">
            Ver Comprobante
        </button>
    </div>
    <div id="receiptDetails-${order["Order ID"]}" style="display: none; margin-top: 10px;">
        <hr style="margin: 10px 0; border: 1px solid #444;">
        <div id="receiptImages-${order["Order ID"]}"></div>
    </div>
    `;
    return listItem;
}

async function fetchPendingPayments() {
    try {
        const response = await fetch(`${apiUrl}?path=fetchPayments&currencies=${encodeURIComponent(userCurrency)}`);
        const data = await response.json();
        const pendingPaymentsList = document.getElementById("pendingPaymentsList");

        if (!pendingPaymentsList) return;
        pendingPaymentsList.innerHTML = "";

        if (data && Array.isArray(data) && data.length > 0) {
            data.forEach((payment) => {
                const listItem = createPendingPaymentListItem(payment);
                pendingPaymentsList.appendChild(listItem);
            });
        } else {
            pendingPaymentsList.innerHTML = "<li>No hay pagos pendientes.</li>";
        }
    } catch (error) {
        console.error("Error fetching pending payments:", error);
        const pendingPaymentsList = document.getElementById("pendingPaymentsList");
        if (pendingPaymentsList) pendingPaymentsList.innerHTML = "<li>Error al cargar los pagos pendientes.</li>";
    }
}

function createPendingPaymentListItem(payment) {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>Orden ID:</strong> ${payment["Order ID"]}
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>Monto:</strong> ${payment["From Amount"]} ${payment["From Currency"]}
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>Estado:</strong> ${payment["Status"]}
    </div>
    <div style="margin-top: 10px;">
        <hr style="margin: 10px 0; border: 1px solid #444;">
        <img src="${payment["Receipt URL"]}" alt="Comprobante" style="max-width: 100%; margin-top: 10px;">
        <p><strong>Monto:</strong> ${payment["From Amount"]} ${payment["From Currency"]}</p>
    </div>
    <div class="button-container">
        <button class="validate-button" onclick="validatePayment('${payment["Order ID"]}')">Validar</button>
        <button class="reject-button" onclick="showRejectionOptions('${payment["Order ID"]}')">Rechazar</button>
    </div>
    <div id="rejectionOptions-${payment["Order ID"]}" style="display: none;">
        <hr style="margin: 10px 0; border: 1px solid #444;">
        <button class="rejection-button" onclick="rejectPayment('${payment["Order ID"]}', 'error_datos')">Error en datos</button>
        <button class="rejection-button" onclick="rejectPayment('${payment["Order ID"]}', 'equivocacion')">Me equivoqué de orden</button>
    </div>
    `;
    return listItem;
}

async function fetchValidatedPayments() {
    try {
        const response = await fetch(`${apiUrl}?path=fetchValidatedPayments`);
        const data = await response.json();
        const validatedPaymentsList = document.getElementById("validatedPaymentsList");

        if (!validatedPaymentsList) return;
        validatedPaymentsList.innerHTML = "";

        if (data.length === 0) {
            validatedPaymentsList.innerHTML = "<li>No hay pagos validados.</li>";
            return;
        }

        data.forEach((payment) => {
            const listItem = createValidatedPaymentListItem(payment);
            validatedPaymentsList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error fetching validated payments:", error);
        const validatedPaymentsList = document.getElementById("validatedPaymentsList");
        if (validatedPaymentsList) validatedPaymentsList.innerHTML = "<li>Error al cargar pagos validados.</li>";
    }
}

function createValidatedPaymentListItem(payment) {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>Order ID:</strong> ${payment["Order ID"]}
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>A pagar:</strong> ${payment["To Amount"]} ${payment["To Currency"]}
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>Status:</strong> ${payment["Status"]}
    </div>
    <div class="input-group">
        <button onclick="takeOrder('${payment["Order ID"]}', '${payment["To Amount"]}', '${payment["To Currency"]}', '${encodeURIComponent(payment["beneficiary"])}')">Tomar Orden</button>
    </div>
    `;
    return listItem;
}

function setupOrdersTabs() {
    const tabs = document.querySelectorAll(".orders-tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            
            const tabName = tab.getAttribute("data-tab");
            
            document.querySelectorAll(".orders-tab-content").forEach(content => {
                content.classList.remove("active");
            });
            
            document.querySelector(`.orders-tab-content[data-tab-content="${tabName}"]`).classList.add("active");
            
            switch(tabName) {
                case "my-orders":
                    fetchOrders();
                    break;
                case "pending":
                    fetchPendingPayments();
                    break;
                case "validated":
                    fetchValidatedPayments();
                    break;
            }
        });
    });

    fetchOrders();
}

function setupOrdersPage() {
    setupOrdersTabs();
}

function showRejectionOptions(orderId) {
    const rejectionOptions = document.getElementById(`rejectionOptions-${orderId}`);
    if (rejectionOptions) {
        rejectionOptions.style.display = rejectionOptions.style.display === "none" ? "block" : "none";
    }
}

function showReceipt(receiptUrls, orderId) {
    const receiptDetails = document.getElementById(`receiptDetails-${orderId}`);
    if (!receiptDetails) return;

    const shouldShow = receiptDetails.style.display === "none";
    receiptDetails.style.display = shouldShow ? "block" : "none";

    if (!shouldShow || receiptCache[orderId]) return;

    const receiptImagesContainer = document.getElementById(`receiptImages-${orderId}`);
    if (!receiptImagesContainer) return;

    receiptImagesContainer.innerHTML = "";

    if (!receiptUrls || receiptUrls.trim() === "") {
        receiptImagesContainer.innerHTML = "<p>No hay comprobantes disponibles</p>";
        receiptCache[orderId] = true;
        return;
    }

    const urls = receiptUrls.split(',').map(url => url.trim()).filter(url => url);

    if (urls.length === 0) {
        receiptImagesContainer.innerHTML = "<p>No hay comprobantes disponibles</p>";
        receiptCache[orderId] = true;
        return;
    }

    const fragment = document.createDocumentFragment();

    urls.forEach((url, index) => {
        const imgContainer = document.createElement("div");
        imgContainer.style.margin = "10px 0";
        imgContainer.style.textAlign = "center";

        const img = document.createElement("img");
        img.src = url;
        img.alt = `Comprobante ${index + 1}`;
        img.loading = "lazy";
        img.style.maxWidth = "100%";
        img.style.maxHeight = "300px";
        img.style.border = "1px solid #bb8a04";
        img.style.borderRadius = "4px";
        img.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
        img.style.transition = "transform 0.3s ease";
        
        img.onmouseenter = () => img.style.transform = "scale(1.02)";
        img.onmouseleave = () => img.style.transform = "scale(1)";

        img.title = `Comprobante ${index + 1}`;

        imgContainer.appendChild(img);
        fragment.appendChild(imgContainer);
    });

    receiptImagesContainer.appendChild(fragment);
    receiptCache[orderId] = true;

    if ('IntersectionObserver' in window) {
        const lazyImages = receiptImagesContainer.querySelectorAll('img');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.src;
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }
}

// ==============================================
// FUNCIONES DE GESTIÓN DE PAGOS
// ==============================================
async function submitPayment() {
    const fromAmount = document.getElementById("from-amount").value;
    const fromCurrency = document.getElementById("from-currency").value;
    const toAmount = document.getElementById("to-amount").value;
    const toCurrency = document.getElementById("to-currency").value;
    const beneficiary = document.getElementById("beneficiaryData").value;

    if (!fromAmount || !fromCurrency || !toAmount || !toCurrency || !beneficiary || !receiptUrl) {
        alert("Por favor complete todos los campos y suba una imagen.");
        return;
    }

    // Deshabilitar botón y mostrar loader
    const submitBtn = document.getElementById("submitPayment");
    submitBtn.disabled = true;
    showLoader();

    try {
        const response = await fetch(
            `${apiUrl}?path=submitPayment` +
            `&reseller=${encodeURIComponent(currentUser)}` +
            `&fromAmount=${encodeURIComponent(fromAmount)}` +
            `&fromCurrency=${encodeURIComponent(fromCurrency)}` +
            `&toAmount=${encodeURIComponent(toAmount)}` +
            `&toCurrency=${encodeURIComponent(toCurrency)}` +
            `&receiptUrl=${encodeURIComponent(receiptUrl)}` +
            `&beneficiary=${encodeURIComponent(beneficiary)}`
        );
        
        const data = await response.json();
        
        if (data.status === 200) {
            alert("Pago enviado exitosamente");
            resetPaymentForm();
        } else {
            throw new Error(data.message || "Error al enviar el pago");
        }
    } catch (error) {
        console.error("Error al enviar el pago:", error);
        alert(`Error: ${error.message}`);
    } finally {
        // Restaurar botón y ocultar loader
        submitBtn.disabled = false;
        hideLoader();
        fetchOrders(); // Actualizar lista de órdenes
    }
}

function validatePayment(orderId) {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
        alert("No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.");
        return;
    }

    const user = JSON.parse(storedUser);
    const validatorUser = user.name;

    const confirmation = confirm(`¿Está seguro de que desea validar el pago con Order ID: ${orderId}?`);
    if (!confirmation) return;

    fetch(`${apiUrl}?path=validatePayment&paymentId=${encodeURIComponent(orderId)}&isValid=true&validatorUser=${encodeURIComponent(validatorUser)}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.status === 200) {
                alert("Pago validado exitosamente.");
                fetchPendingPayments();
            } else {
                alert("Error al validar el pago: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error validating payment:", error);
            alert("Error al validar el pago.");
        });
}

function rejectPayment(orderId, reason) {
    if (!reason) {
        alert("Por favor, selecciona una razón para rechazar la orden.");
        return;
    }

    fetch(`${apiUrl}?path=rejectOrder&orderId=${encodeURIComponent(orderId)}&reason=${encodeURIComponent(reason)}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.status === 200) {
                alert("Orden rechazada exitosamente.");
                fetchPendingPayments();
            } else {
                alert("Error al rechazar la orden: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error rechazando la orden:", error);
            alert("Error al rechazar la orden.");
        });
}

async function takeOrder(orderId, toAmount, toCurrency, beneficiaryName) {
    currentOrderId = orderId;
    currentToAmount = toAmount;
    currentToCurrency = toCurrency;

    const userRole = localStorage.getItem("userRole");
    const takeOrderBtn = document.querySelector(`button[onclick*="${orderId}"]`); // Botón "Tomar Orden"

    // Deshabilitar botón y mostrar loader
    if (takeOrderBtn) takeOrderBtn.disabled = true;
    showLoader();

    try {
        const response = await fetch(
            `${apiUrl}?path=takeOrder` +
            `&orderId=${encodeURIComponent(orderId)}` +
            `&takerName=${encodeURIComponent(currentUser)}` +
            `&role=${encodeURIComponent(userRole)}`
        );
        
        const data = await response.json();
        
        if (data.status === 200) {
            const orderIdConfirmation = document.getElementById("orderIdConfirmation");
            const toAmountConfirmation = document.getElementById("toAmountConfirmation");
            const beneficiaryNameElement = document.getElementById("beneficiaryName");
            const takeOrderModal = document.getElementById("takeOrderModal");

            if (orderIdConfirmation) orderIdConfirmation.innerText = orderId;
            if (toAmountConfirmation) toAmountConfirmation.innerText = `${toAmount} ${toCurrency}`;
            if (beneficiaryNameElement) beneficiaryNameElement.innerText = decodeURIComponent(beneficiaryName);
            if (takeOrderModal) takeOrderModal.style.display = "block";
        } else {
            throw new Error(data.message || "Error al tomar la orden");
        }
    } catch (error) {
        console.error("Error al tomar la orden:", error);
        alert(`Error: ${error.message}`);
    } finally {
        // Restaurar botón y ocultar loader
        if (takeOrderBtn) takeOrderBtn.disabled = false;
        hideLoader();
        fetchValidatedPayments(); // Actualizar lista
    }
}

function confirmOrder() {
    const orderId = currentOrderId;
    const userRole = localStorage.getItem("userRole");

    fetch(`${apiUrl}?path=takeOrder&orderId=${encodeURIComponent(orderId)}&takerName=${encodeURIComponent(currentUser)}&role=${encodeURIComponent(userRole)}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.status === 200) {
                alert("Orden tomada exitosamente.");
                fetchPendingPayments();
            } else {
                alert("Error al tomar la orden: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error confirming order:", error);
            alert("Error al tomar la orden.");
        });
}

async function markAsPaid(orderId, imgurUrls) {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
        alert("Error: No se pudo verificar tu usuario. Inicia sesión nuevamente.");
        return false;
    }

    const user = JSON.parse(storedUser);
    
    try {
        const response = await fetch(
            `${apiUrl}?path=markAsPaid` + 
            `&orderId=${encodeURIComponent(orderId)}` +
            `&takerName=${encodeURIComponent(user.name)}` +
            `&imgurUrls=${encodeURIComponent(JSON.stringify(imgurUrls))}`
        );
        
        const data = await response.json();
        
        if (data.status === 200) {
            alert("¡Orden marcada como pagada exitosamente!");
            return true;
        } else {
            throw new Error(data.message || "Error en el servidor");
        }
    } catch (error) {
        console.error("Error:", error);
        alert(`Error al marcar como pagado: ${error.message}`);
        return false;
    }
}

function resetPaymentForm() {
    document.getElementById("from-amount").value = "";
    document.getElementById("to-amount").value = "";
    document.getElementById("beneficiaryData").value = "";
    document.getElementById("imageInput").value = "";
    document.getElementById("imagePreviewContainer").style.display = "none";
    receiptUrl = "";

    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((tc) => {
        tc.classList.remove("active");
        tc.style.display = "none";
    });

    const cotizacionTab = document.querySelector('.tab[data-tab="calculator"]');
    if (cotizacionTab) cotizacionTab.classList.add("active");
    const cotizacionContent = document.getElementById("calculator");
    if (cotizacionContent) {
        cotizacionContent.classList.add("active");
        cotizacionContent.style.display = "block";
    }
}

// ==============================================
// FUNCIONES DE GESTIÓN DE IMÁGENES
// ==============================================
function previewImages(event) {
    const files = event.target.files;
    const previewContainer = document.getElementById("imagePreviews");
    const uploadButton = document.getElementById("uploadButton");

    previewContainer.innerHTML = "";
    previewContainer.style.display = "none";
    uploadButton.style.display = "none";

    if (files.length > 0) {
        previewContainer.style.display = "block";
        uploadButton.style.display = "block";

        Array.from(files).forEach(file => {
            if (!file.type.match('image.*')) {
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const imgContainer = document.createElement("div");
                imgContainer.style.position = "relative";
                imgContainer.style.display = "inline-block";
                imgContainer.style.margin = "5px";
                
                const img = document.createElement("img");
                img.src = e.target.result;
                img.style.maxWidth = "100px";
                img.style.maxHeight = "100px";
                img.style.border = "1px solid #bb8a04";
                img.style.borderRadius = "4px";
                
                imgContainer.appendChild(img);
                previewContainer.appendChild(imgContainer);
            };
            reader.readAsDataURL(file);
        });
    }
}

async function uploadImages() {
    const files = document.getElementById("imageUpload").files;
    if (files.length === 0) {
        alert("Por favor, selecciona al menos una imagen.");
        return;
    }

    showLoader();

    try {
        const uploadPromises = Array.from(files).map(file => {
            const formData = new FormData();
            formData.append("image", file);
            return fetch("https://api.imgur.com/3/image", {
                method: "POST",
                headers: { Authorization: "Client-ID bb0beed3488e033" },
                body: formData
            }).then(res => res.json());
        });

        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter(r => r.success);
        
        if (successfulUploads.length === 0) {
            throw new Error("No se pudieron subir las imágenes");
        }

        const imgurUrls = successfulUploads.map(r => r.data.link);
        
        const success = await markAsPaid(currentOrderId, imgurUrls);
        
        if (success) {
            closeModal();
            fetchValidatedPayments();
            fetchUserEarnings();
        }
    } catch (error) {
        console.error("Error:", error);
        alert(`Error: ${error.message}`);
    } finally {
        hideLoader();
    }
}

async function uploadImage() {
    const fileInput = document.getElementById("imageInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Por favor seleccione una imagen para subir.");
        return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
        const response = await fetch("https://api.imgur.com/3/image", {
            method: "POST",
            headers: { Authorization: "Client-ID bb0beed3488e033" },
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            receiptUrl = data.data.link;
            showNextTab("beneficiary");
        } else {
            alert("Error al subir la imagen: " + (data.message || "Error desconocido"));
        }
    } catch (error) {
        console.error("Error al subir la imagen:", error);
        alert("Error al subir la imagen.");
    }
}

function showNextTab(tabName) {
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((tc) => {
        tc.classList.remove("active");
        tc.style.display = "none";
    });

    const nextTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
    if (nextTab) nextTab.classList.add("active");
    const nextContent = document.getElementById(tabName);
    if (nextContent) {
        nextContent.classList.add("active");
        nextContent.style.display = "block";
    }
}

// ==============================================
// FUNCIONES DE UTILIDAD
// ==============================================
function checkForPaidOrders(currentOrders) {
    currentOrders.forEach((currentOrder) => {
        const previousOrder = lastFetchedOrders.find((order) => order["Order ID"] === currentOrder["Order ID"]);
        if (previousOrder && previousOrder["Status"] !== currentOrder["Status"] && currentOrder["Status"] === "Paid") {
            alert(`La orden ${currentOrder["Order ID"]} ha sido marcada como pagada.`);
        }
    });
    lastFetchedOrders = currentOrders;
}

function closeModal() {
    document.getElementById("takeOrderModal").style.display = "none";
    document.getElementById("imageUpload").value = "";
    document.getElementById("imagePreviews").innerHTML = "";
    document.getElementById("imagePreviews").style.display = "none";
    document.getElementById("uploadButton").style.display = "none";
}

function triggerFileInput() {
    document.getElementById("imageInput").click();
}


function updateTotal() {
    const fromAmount = parseFloat(document.getElementById("from-amount-out").value) || 0;
    const fromCurrency = document.getElementById("from-currency-out").value;
    document.querySelector('.total').textContent = `${fromAmount.toFixed(2)} ${fromCurrency}`;
}

document.getElementById("from-amount-out").addEventListener("input", function() {
    lastEditedFieldOut = "from";
    convertCurrencyOut();
});

document.getElementById("to-amount-out").addEventListener("input", function() {
    lastEditedFieldOut = "to";
    convertCurrencyOut();
});

document.getElementById("from-currency-out").addEventListener("change", function() {
    lastEditedFieldOut = "from";
    updateExchangeRateOut();
    convertCurrencyOut();
});

document.getElementById("to-currency-out").addEventListener("change", function() {
    lastEditedFieldOut = "to";
    updateExchangeRateOut();
    convertCurrencyOut();
});

document.getElementById("send-whatsapp").addEventListener("click", function() {
    const fromAmount = document.getElementById("from-amount-out").value;
    const fromCurrency = document.getElementById("from-currency-out").value;
    const toAmount = document.getElementById("to-amount-out").value;
    const toCurrency = document.getElementById("to-currency-out").value;
    const exchangeRateText = document.getElementById("exchange-rate-out").textContent;

    const message = `Hola! Quiero enviar ${fromAmount} ${fromCurrency}, que se convierte en ${toAmount} ${toCurrency}. ${exchangeRateText}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/584121542322?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
});

document.addEventListener("DOMContentLoaded", function() {
    fetchAllExchangeRates();
});

async function fetchUserTransactions(email) {
    try {
        const response = await fetch(`${apiUrl}?path=getUserTransactions&email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (data.status === 200) {
            userTransactions = data.transactions;
            return data;
        } else {
            console.error("Error al obtener transacciones:", data.message);
            return { status: data.status, message: data.message };
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        return { status: 500, message: "Error al obtener transacciones" };
    }
}

async function recordTransaction(transactionData) {
    try {
        const params = new URLSearchParams();
        for (const key in transactionData) {
            params.append(key, transactionData[key]);
        }
        
        const response = await fetch(`${apiUrl}?path=recordTransaction&${params.toString()}`);
        const data = await response.json();
        
        if (data.status !== 200) {
            console.error("Error al registrar transacción:", data.message);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error("Error al registrar transacción:", error);
        return false;
    }
}

async function updateHistoryAfterTransaction(orderDetails) {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return false;
    
    const user = JSON.parse(storedUser);
    const userRole = localStorage.getItem("userRole");
    
    const earningsResponse = await fetch(`${apiUrl}?path=getUserEarnings&email=${encodeURIComponent(user.email)}`);
    const earningsData = await earningsResponse.json();
    
    if (earningsData.status !== 200) {
        console.error("Error al obtener saldo:", earningsData.message);
        return false;
    }
    
    const prevBalance = parseFloat(earningsData.balance) || 0;
    const amount = parseFloat(orderDetails.amount) || 0;
    const commission = parseFloat(orderDetails.commission) || 0;
    
    let newBalance;
    if (orderDetails.type.includes("Comisión")) {
        newBalance = prevBalance + amount;
    } else {
        newBalance = prevBalance - amount;
    }
    
    const transactionData = {
        email: user.email,
        type: orderDetails.type || "Envío de remesa",
        orderId: orderDetails.orderId || Date.now().toString(),
        currency: orderDetails.currency || "USD",
        amount: amount,
        prevBalance: prevBalance,
        newBalance: newBalance,
        status: orderDetails.status || "Completed",
        commission: commission
    };
    
    return await recordTransaction(transactionData);
}

async function fetchUserEarnings() {
    try {
        const storedUser = localStorage.getItem("currentUser");
        if (!storedUser) return null;

        const user = JSON.parse(storedUser);
        
        const [earningsResponse, fundsResponse] = await Promise.all([
            fetch(`${apiUrl}?path=getUserEarnings&email=${encodeURIComponent(user.email)}`),
            fetch(`${apiUrl}?path=getUserFunds&email=${encodeURIComponent(user.email)}`)
        ]);
        
        const earningsData = await earningsResponse.json();
        const fundsData = await fundsResponse.json();

        return {
            earnings: earningsData,
            funds: fundsData
        };
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}

async function setupProfilePage() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    
    document.getElementById("userName").textContent = user.name;
    document.getElementById("userRole").textContent = localStorage.getItem("userRole") || "Usuario";
    document.getElementById("userCurrency").textContent = user.country || "USD";

    const userData = await fetchUserEarnings();
    
    if (userData) {
        // Manejar earnings
        if (userData.earnings.status === 200) {
            const earningsElements = document.querySelectorAll("#userEarnings");
            earningsElements.forEach(el => {
                if (el) el.textContent = `$${userData.earnings.earnings || 0} ${userData.earnings.currency || 'USD'}`;
            });
        }
        
        // Manejar funds
        if (userData.funds.status === 200) {
            let fundsText = "";
            for (const [currency, amount] of Object.entries(userData.funds.funds)) {
                fundsText += `${amount} ${currency}, `;
            }
            const fundsElements = document.querySelectorAll("#userFunds");
            fundsElements.forEach(el => {
                if (el) el.textContent = fundsText || "0 USD";
            });
        }
    } else {
        document.getElementById("userFunds").textContent = "Error al cargar fondos";
    }
}

async function requestNotificationPermission() {
    // Verificar si el navegador soporta service workers
    if (!('serviceWorker' in navigator)) {
        console.error('Este navegador no soporta service workers');
        return null;
    }

    try {
        // Intentar registrar desde varias ubicaciones posibles
        const swPaths = [          
            './firebase-messaging-sw.js',
        ];

        let registration;
        let lastError;
        
        for (const path of swPaths) {
            try {
                registration = await navigator.serviceWorker.register(path);
                console.log(`Service Worker registrado correctamente desde: ${path}`);
                break;
            } catch (err) {
                lastError = err;
                console.warn(`No se pudo registrar desde ${path}:`, err);
            }
        }

        if (!registration) {
            throw lastError || new Error('No se pudo registrar el Service Worker en ninguna ubicación probada');
        }

        // Esperar a que el Service Worker esté activo
        await navigator.serviceWorker.ready;
        
        // Solicitar permiso para notificaciones
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Permiso de notificación denegado por el usuario');
        }

        console.log('Permiso de notificación concedido');
        
        // Obtener el token FCM
        const token = await messaging.getToken({ 
            vapidKey: 'BIjUoTPCiMDAg7ILetFmwMw-EM4ootWd0LaumD9AEhFVFJodJeWj1Z94utg1oDV7qEx_U32t7YM1nS64mUcqJMY',
            serviceWorkerRegistration: registration
        });
        
        if (!token) {
            throw new Error('No se pudo obtener el token FCM');
        }

        console.log('Token FCM obtenido:', token);
        await saveFCMToken(token);
        return token;

    } catch (error) {
        console.error('Error en requestNotificationPermission:', error);
        
        // Mostrar mensaje al usuario si es relevante
        if (error.message.includes('404')) {
            alert('Error: No se encontró el archivo necesario para las notificaciones. Por favor, contacta al soporte.');
        } else if (error.message.includes('denegado')) {
            alert('Para recibir notificaciones, por favor habilita los permisos en tu navegador.');
        }
        
        return null;
    }
}

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
        const url = `${apiUrl}?path=saveFCMToken&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
        console.log('URL de la solicitud:', url); // Depuración
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error('Error en la respuesta:', response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data); // Depuración
        
        if (data.status === 200) {
            console.log('Token FCM guardado correctamente');
            return true;
        } else {
            console.error('Error del servidor:', data.message || 'Sin mensaje de error');
            return false;
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        return false;
    }
}

function showCustomNotification(title, message) {
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
    
    // Estilos (puedes mover esto a tu CSS)
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
