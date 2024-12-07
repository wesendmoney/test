  
           document.getElementById('openReceiptButton').addEventListener('click', function() {
        document.getElementById('imageInput').click(); // Activa el input de archivo
    });
         // Variables globales para almacenar datos de la orden
         let currentOrderId;
         let currentToAmount;
         let currentToCurrency;
         
         function toggleMenu() {
                 const menu = document.getElementById('menu');
                 menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
             }
         
             function closeMenu() {
                 document.getElementById('menu').style.display = 'none';
             }
         
             // Cerrar el menú al hacer clic fuera de él
             window.onclick = function(event) {
                 const menu = document.getElementById('menu');
                 if (event.target !== menu && !menu.contains(event.target)) {
                     closeMenu();
                 }
             };
         
         
window.onload = function() {
    // Ocultar secciones que no son de autenticación
    document.getElementById('resellerSection').style.display = 'none';
    document.getElementById('cashierSection').style.display = 'none';
    document.getElementById('takerSection').style.display = 'none';

    // Mostrar el contenedor de autenticación
    document.getElementById('authContainer').style.display = 'block';

    // Mostrar el botón "Enviar dinero ahora" si no hay usuario autenticado
    if (!currentUser ) {
        document.getElementById('send-whatsapp').style.display = 'block'; // Muestra el botón
    } else {
        document.getElementById('send-whatsapp').style.display = 'none'; // Oculta el botón si hay usuario autenticado
    }
};
         
                function fetchOrders() {
    // Asegúrate de que currentUser  tenga un valor válido
    if (!currentUser ) {
        console.error('currentUser  no está definido.');
        return;
    }

    fetch(`${apiUrl}?path=getOrders&resellerName=${encodeURIComponent(currentUser )}`)
        .then(response => response.json())
        .then(orders => {
            console.log(orders); // Verifica la respuesta de la API
            const ordersList = document.getElementById('ordersList');
            ordersList.innerHTML = ''; // Limpiar elementos existentes

            if (orders && Array.isArray(orders) && orders.length > 0) {
                orders.forEach(order => {
                    const listItem = document.createElement('li');
listItem.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>Order ID:</strong> ${order['Order ID'] || 'N/A'}
        <strong></strong> <span class="order-status" style="margin-left: auto;">${order['Status'] || 'N/A'}</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>Monto:</strong> ${order['From Amount'] || 'N/A'} ${order['From Currency'] || 'N/A'} <br>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>Precio a Recibir:</strong> ${order['To Amount'] || 'N/A'} ${order['To Currency'] || 'N/A'} <br>
    </div>
    <div class="input-group">
        <button onclick="showReceipt('${order['Comprobante']}', '${order['Order ID']}', '${order['From Amount']}', '${order['From Currency']}')">Ver Comprobante</button>
    </div>
    <div id="receiptDetails-${order['Order ID']}" style="display: none; margin-top: 10px;">
        <hr style="margin: 10px 0; border: 1px solid #444;"> 
        <img id="receiptImage-${order['Order ID']}" alt="Receipt" style="max-width: 100%; margin-top: 10px; display:none;">
        <p id="orderAmount-${order['Order ID']}"></p>
        <button onclick="shareReceipt('${order['Comprobante']}')">Compartir Comprobante</button>
    </div>
`;
                    ordersList.appendChild(listItem);
                });
            } else {
                ordersList.innerHTML = '<li>No hay órdenes disponibles.</li>';
            }
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
            const ordersList = document.getElementById('ordersList');
            ordersList.innerHTML = '<li>Error al cargar las órdenes.</li>';
        });
}
       
        function shareReceipt(receiptUrl) {
    const message = `Mira este comprobante: ${receiptUrl}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    // Abre el enlace de WhatsApp
    window.open(whatsappUrl, '_blank');
}
        
         function openModal() {
         // Mostrar el contenedor de inicio de sesión/registro
         document.getElementById('authContainer').style.display = 'block';
         document.getElementById('registerForm').style.display = 'none';
         document.getElementById('loginForm').style.display = 'block';
         document.getElementById('message').textContent = ''; // Limpiar mensajes
         
         // Ocultar el resto del contenido
         document.body.classList.add('hidden'); // Agregar clase para ocultar el scroll
         }
         
         function closelogingModal() {
         const modal = document.getElementById('authContainer');
         if (modal) {
             modal.style.display = 'none'; // Cierra el contenedor
         }
         document.body.classList.remove('hidden'); // Mostrar el contenido de la página
         }
         /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
         
         // Variables globales para almacenar la URL de la imagen
             let uploadedImageUrl = '';
             let receiptUrl = ''; // Variable para almacenar la URL de la imagen
             let currentUser = ''; // Declaración de la variable global
              let userCurrency = '';
         
            // Mostrar la imagen directamente en la página cuando se selecciona un archivo
document.getElementById('imageInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            previewContainer.style.display = 'block'; // Mostrar el contenedor de la vista previa
        }
        reader.readAsDataURL(file);

        // Cambiar a la pestaña de "Recibo"
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        // Remover la clase activa de todas las pestañas
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => {
            tc.classList.remove('active');
            tc.style.display = 'none'; // Oculta todos los contenidos
        });

        // Activar la pestaña de recibo
        const receiptTab = document.querySelector('.tab[data-tab="receipt"]'); // Asegúrate de que el selector sea correcto
        if (receiptTab) {
            receiptTab.classList.add('active');
            const receiptContent = document.getElementById('receipt'); // Asegúrate de que el ID sea correcto
            if (receiptContent) {
                receiptContent.classList.add('active');
                receiptContent.style.display = 'block'; // Muestra el contenido de la pestaña de recibo
            }
        }
    }
});
         
// Subir imagen a Imgur
document.getElementById('uploadButtonModal').addEventListener('click', async () => {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Por favor seleccione una imagen para subir.');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': 'Client-ID bb0beed3488e033' // Reemplaza con tu Client ID de Imgur
            },
            body: formData
        });

        const data = await response.json();
        console.log(data); // Verifica la respuesta de la API

        // Verifica si la respuesta fue exitosa
        if (data.success) {
            // Eliminar el alert de éxito
            // alert('Imagen subida exitosamente a Imgur.');
            receiptUrl = data.data.link; // Almacena la URL de la imagen subida

            // Cambiar a la pestaña de "Beneficiario"
            const tabs = document.querySelectorAll('.tab');
            const tabContents = document.querySelectorAll('.tab-content');

            // Remover la clase activa de todas las pestañas
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => {
                tc.classList.remove('active');
                tc.style.display = 'none'; // Oculta todos los contenidos
            });

            // Activar la pestaña de beneficiario
            const beneficiaryTab = document.querySelector('.tab[data-tab="beneficiary"]');
            if (beneficiaryTab) {
                beneficiaryTab.classList.add('active');
                const beneficiaryContent = document.getElementById('beneficiary');
                if (beneficiaryContent) {
                    beneficiaryContent.style.display = 'block'; // Muestra el contenido de la pestaña de beneficiario
                }
            }
        } else {
            // Si la respuesta no fue exitosa, muestra el error
            alert('Error al subir la imagen: ' + (data.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error al subir la imagen:', error);
        alert('Error al subir la imagen.'); // Muestra un mensaje de error en caso de fallo en la conexión
    }
});
         
         
         
         // Manejar el envío del pago
         document.getElementById('submitPayment').addEventListener('click', function() {
         const fromAmount = document.getElementById('from-amount').value;
         const fromCurrency = document.getElementById('from-currency').value; 
         const toAmount = document.getElementById('to-amount').value; 
         const toCurrency = document.getElementById('to-currency').value; 
         const beneficiary = document.getElementById('beneficiaryData').value; 
         
         // Verificar que todos los campos requeridos tengan valores
         if (!fromAmount || !fromCurrency || !toAmount || !toCurrency || !beneficiary || !receiptUrl) {
             alert('Por favor complete todos los campos y suba una imagen.');
             console.log('Validación fallida con los siguientes datos:');
             console.log('From Amount:', fromAmount);
             console.log('From Currency:', fromCurrency);
             console.log('To Amount:', toAmount);
             console.log('To Currency:', toCurrency);
             console.log('Beneficiary:', beneficiary);
             console.log('Receipt URL:', receiptUrl); // Esto debería mostrar la URL de la imagen
             return; // Detener la ejecución si falta algún campo
         }
        
         
         fetch(`${apiUrl}?path=submitPayment&reseller=${encodeURIComponent(currentUser )}&fromAmount=${encodeURIComponent(fromAmount)}&fromCurrency=${encodeURIComponent(fromCurrency)}&toAmount=${encodeURIComponent(toAmount)}&toCurrency=${encodeURIComponent(toCurrency)}&receiptUrl=${encodeURIComponent(receiptUrl)}&beneficiary=${encodeURIComponent(beneficiary)}`, {
             method: 'GET'
         })
         .then(response => response.json())
         .then(data => {
             if (data.status === 200) {
                 alert('Pago enviado exitosamente');
                 // Limpiar el formulario
                 document.getElementById('from-amount').value = '';
                 document.getElementById('to-amount').value = '';
                 document.getElementById('beneficiaryData').value = '';
                 document.getElementById('imageInput').value = '';
                 document.getElementById('imagePreviewContainer').style.display = 'none';
                 receiptUrl = ''; // Reiniciar la URL de la imagen
             // Cambiar a la pestaña 1 (Cotiza tu Remesa)
            const tabs = document.querySelectorAll('.tab');
            const tabContents = document.querySelectorAll('.tab-content');
            
            // Remover la clase activa de todas las pestañas
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => {
                tc.classList.remove('active');
                tc.style.display = 'none'; // Oculta todos los contenidos
            });

            // Activar la pestaña de cotización
            const cotizacionTab = document.querySelector('.tab[data-tab="calculator"]'); // Asegúrate de que el selector sea correcto
            cotizacionTab.classList.add('active');
            const cotizacionContent = document.getElementById('calculator'); // Asegúrate de que el ID sea correcto
            if (cotizacionContent) {
                cotizacionContent.classList.add('active');
                cotizacionContent.style.display = 'block'; // Muestra el contenido de la pestaña de cotización
            }
        } else {
            alert('Error al enviar el pago: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error al enviar el pago:', error);
        alert('Error al enviar el pago.');
    });
});
         
         
                         
                         
             // Función para activar el input file
             function triggerFileInput() {
                 document.getElementById('imageInput').click();
             }
         
         
         
         // Manejar el cambio de pestañas
         const tabs = document.querySelectorAll('.tab');
         const tabContents = document.querySelectorAll('.tab-content');
         
         tabs.forEach(tab => {
         tab.addEventListener('click', () => {
             // Remover la clase activa de todas las pestañas
             tabs.forEach(t => t.classList.remove('active'));
             tabContents.forEach(tc => {
                 tc.classList.remove('active');
                 tc.style.display = 'none'; // Oculta todos los contenidos
             });
         
             // Agregar la clase activa a la pestaña seleccionada y mostrar su contenido
             tab.classList.add('active');
             const selectedTab = tab.getAttribute('data-tab');
             const selectedContent = document.getElementById(selectedTab);
             if (selectedContent) {
                 selectedContent.classList.add('active');
                 selectedContent.style.display = 'block'; // Muestra el contenido de la pestaña activa
             }
         });
         });
         
         /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
         
         const apiUrl = 'https://script.google.com/macros/s/AKfycbyIgM9AEjwjjCuRYwYQJG23aIRW3lY_hYP7Zv8wYfIzI5gkbtBLKxVUHCcqbPoi07xF/exec';
         
         
      function showRejectionOptions(orderId) {
    const rejectionOptions = document.getElementById(`rejectionOptions-${orderId}`);
    if (rejectionOptions) { // Asegúrate de que el elemento existe
        rejectionOptions.style.display = rejectionOptions.style.display === 'none' ? 'block' : 'none';
    } else {
        console.error(`No se encontró el elemento con ID: rejectionOptions-${orderId}`);
    }
}

   function showReceipt(receiptUrl, orderId, fromAmount, fromCurrency) {
    const receiptDetails = document.getElementById(`receiptDetails-${orderId}`);
    const receiptImage = document.getElementById(`receiptImage-${orderId}`);
    const orderAmount = document.getElementById(`orderAmount-${orderId}`);

    // Cambiar el src de la imagen y mostrar los detalles
    receiptImage.src = receiptUrl;
    orderAmount.innerHTML = `<strong>Monto:</strong> ${fromAmount} ${fromCurrency}`;

    // Alternar la visibilidad del contenedor de detalles
    if (receiptDetails.style.display === "none") {
        receiptDetails.style.display = "block";
        receiptImage.style.display = 'block'; // Mostrar la imagen
    } else {
        receiptDetails.style.display = "none"; // Minimizar/colapsar
        receiptImage.style.display = 'none'; // Ocultar la imagen
    }
}      
// En la función fetchPendingPayments
function fetchPendingPayments() {
    // Asegúrate de que userCurrency tenga un valor válido
    if (!userCurrency) {
        console.error('userCurrency no está definido.');
        return;
    }

    fetch(`${apiUrl}?path=fetchPayments&currency=${encodeURIComponent(userCurrency)}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        const pendingPaymentsList = document.getElementById('pendingPaymentsList');
        pendingPaymentsList.innerHTML = ''; // Limpiar elementos existentes

        if (data && Array.isArray(data) && data.length > 0) {
            data.forEach(payment => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>Orden ID:</strong> ${payment['Order ID']} <br>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>Monto:</strong> ${payment['From Amount']} ${payment['From Currency']} <br>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>Estado:</strong> ${payment['Status']} <br>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                     <strong>Receipt URL:</strong> ${payment['Receipt URL']}<br>
                    </div>
 <div class="input-group">
        <button onclick="showReceipt('${payment['Receipt URL']}', '${payment['Order ID']}', '${payment['From Amount']}', '${payment['From Currency']}')">Ver Detalles</button>
    </div>

                    
                    
                    <div id="receiptDetails-${payment['Order ID']}" style="display: none; margin-top: 10px;">
                     <hr style="margin: 10px 0; border: 1px solid #444;"> 
                        <img id="receiptImage-${payment['Order ID']}" alt="Receipt" style="max-width: 100%; margin-top: 10px;">
                        <p id="orderAmount-${payment['Order ID']}"></p>
                        
                       <div class="button-container">
                            <button class="validate-button" onclick="validatePayment('${payment['Order ID']}')">Validar</button>
                            <button class="reject-button" onclick="showRejectionOptions('${payment['Order ID']}')">Rechazar</button>
                        </div>
                        <div id="rejectionOptions-${payment['Order ID']}" style="display: none;">
                         <hr style="margin: 10px 0; border: 1px solid #444;"> 
                            <button class="rejection-button" onclick="rejectPayment('${payment['Order ID']}', 'error_datos')">Error en datos</button>
                            <button class="rejection-button" onclick="rejectPayment('${payment['Order ID']}', 'equivocacion')">Me equivoqué de orden</button>
                        </div>
                    </div>
                `;
                pendingPaymentsList.appendChild(listItem);
            });
        } else {
            pendingPaymentsList.innerHTML = '<li>No hay pagos pendientes.</li>';
        }
    })
    .catch(error => {
        console.error('Error fetching pending payments:', error);
        const pendingPaymentsList = document.getElementById('pendingPaymentsList');
        pendingPaymentsList.innerHTML = '<li>Error al cargar los pagos pendientes.</li>';
    });
}
         
         // Llama a fetchPendingPayments al cargar la página
         window.onload = function() {
             fetchPendingPayments();
             fetchValidatedPayments(); // Asegúrate de que esta función esté definida
         };
         
         
         
         // En las funciones de validación y rechazo
      function validatePayment(orderId) {
    const confirmation = confirm(`¿Está seguro de que desea validar el pago con Order ID: ${orderId}?`);
    if (confirmation) {
        fetch(`${apiUrl}?path=validatePayment&paymentId=${encodeURIComponent(orderId)}&isValid=true`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    alert('Pago validado exitosamente.');
                    fetchPendingPayments(); // Actualiza la lista de pagos pendientes
                } else {
                    alert('Error al validar el pago: ' + data.message);
                }
            })
                        .catch(error => {
                console.error('Error validating payment:', error);
                alert('Error al validar el pago.');
            });
    }
}

function rejectPayment(orderId, reason) {
    if (!reason) {
        alert("Por favor, selecciona una razón para rechazar la orden.");
        return;
    }

    fetch(`${apiUrl}?path=rejectOrder&orderId=${encodeURIComponent(orderId)}&reason=${encodeURIComponent(reason)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 200) {
                alert('Orden rechazada exitosamente.');
                fetchPendingPayments(); // Actualiza la lista de pagos pendientes
            } else {
                alert('Error al rechazar la orden: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error rechazando la orden:', error);
            alert('Error al rechazar la orden.');
        });
}
         
         // Close modal when clicking outside
         window.onclick = function(event) {
         const modal = document.getElementById('verificationModal');
         if (event.target == modal) {
             modal.style.display = 'none';
         }
         }
         ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
         function fetchValidatedPayments() {
    fetch(`${apiUrl}?path=fetchValidatedPayments`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const validatedPaymentsList = document.getElementById('validatedPaymentsList');
        validatedPaymentsList.innerHTML = ''; // Limpiar elementos existentes

        if (data.length === 0) {
            validatedPaymentsList.innerHTML = '<li>No hay pagos validados.</li>';
            return; // No hay datos para mostrar
        }

        data.forEach(payment => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
             <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>Order ID:</strong> ${payment['Order ID']} <br>
                </div>
                 <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>A pagar:</strong> ${payment['To Amount']} ${payment['To Currency']} <br>
                </div>
                 <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>Status:</strong> ${payment['Status']} <br>
                </div>
                <div class="input-group">
                <button onclick="takeOrder('${payment['Order ID']}', '${payment['To Amount']}', '${payment['To Currency']}', '${encodeURIComponent(payment['beneficiary'])}')">Tomar Orden</button>
                 </div>
            `;
            validatedPaymentsList.appendChild(listItem);
        });
    })
    .catch(error => {
        console.error('Error fetching validated payments:', error);
        const validatedPaymentsList = document.getElementById('validatedPaymentsList');
        validatedPaymentsList.innerHTML = '<li>Error al cargar pagos validados. Intenta de nuevo más tarde.</li>';
    });
}
      
         // Función para manejar el clic en la orden y mostrar el modal
         function takeOrder(orderId, toAmount, toCurrency, beneficiaryName) {
         currentOrderId = orderId;
         currentToAmount = toAmount;
         currentToCurrency = toCurrency;
         
         // Actualiza la información en el modal
         document.getElementById('orderIdConfirmation').innerText = orderId;
         document.getElementById('toAmountConfirmation').innerText = `${toAmount} ${toCurrency}`;
         document.getElementById('beneficiaryName').innerText = decodeURIComponent(beneficiaryName);
        
            // Confirmar la orden automáticamente
    confirmOrder(); // Llama a la función para confirmar la orden
         }
         
         // Función para confirmar la orden
         function confirmOrder() {
         const orderId = currentOrderId; // Asegúrate de que currentOrderId esté definido
         
         const url = `${apiUrl}?path=takeOrder&orderId=${encodeURIComponent(orderId)}&takerName=${encodeURIComponent(currentUser )}`;
         
         fetch(url)
             .then(response => {
                 if (!response.ok) {
                     throw new Error(`HTTP error! status: ${response.status}`);
                 }
                 return response.json();
             })
             .then(data => {
                 if (data.status === 200) {
                     alert("Orden tomada exitosamente.");
                     fetchPendingPayments(); // Actualiza la lista de pagos pendientes
                    
         // Muestra el modal
         const takeOrderModal = document.getElementById('takeOrderModal');
         if (takeOrderModal) {
             takeOrderModal.style.display = 'block';
         }
       
                 } else {
                     alert("Error al tomar la orden: " + data.message);
                     closeModal(); // Cierra el modal solo si hay un error
                 }
             })
             .catch(error => {
                 console.error('Error confirming order:', error);
                 alert("Error al tomar la orden. Intenta de nuevo más tarde. Detalle: " + error.message);
                 closeModal(); // Cierra el modal solo si hay un error
             });
         }
         // Función para cerrar el modal
         
         // Función para limpiar los datos del modal
         function clearModalData() {
         document.getElementById('imagePreview').style.display = 'none'; // Oculta la vista previa
         document.getElementById('imagePreview').src = ''; // Limpia la imagen
         document.getElementById('rejectionReason').value = ''; // Limpia el campo de razón de rechazo
         document.getElementById('orderIdConfirmation').innerText = ''; // Limpia el ID de la orden
         document.getElementById('toAmountConfirmation').innerText = ''; // Limpia el monto a pagar
         document.getElementById('beneficiaryName').innerText = ''; // Limpia el nombre del beneficiario
         imageFile = null; // Limpia la variable de archivo de imagen
         }
         
         
         function rejectOrder(orderId, reason) {
    if (!reason) {
        alert("Por favor, selecciona una razón para rechazar la orden.");
        return;
    }

    fetch(`${apiUrl}?path=rejectOrder&orderId=${encodeURIComponent(orderId)}&reason=${encodeURIComponent(reason)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 200) {
                alert('Orden rechazada exitosamente.');
                closeModal(); // Cierra el modal
                fetchPendingPayments(); // Actualiza la lista de pagos pendientes
            } else {
                alert('Error al rechazar la orden: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error rechazando la orden:', error);
            alert('Error al rechazar la orden.');
        });
}
         
         
         let imageFile; // Variable para almacenar el archivo de imagen
         
        function previewImage(event) {
    const file = event.target.files[0]; // Obtiene el primer archivo
    const previewImage = document.getElementById('imgPreview'); // Obtiene el elemento de la imagen de vista previa
    const uploadButton = document.getElementById('uploadButton'); // Obtiene el botón "Marcar Pagado"

    if (file) {
        const reader = new FileReader(); // Crea un nuevo FileReader
        reader.onload = function(e) {
            previewImage.src = e.target.result; // Establece la fuente de la imagen a la URL del archivo
            previewImage.style.display = 'block'; // Muestra la imagen
            uploadButton.style.display = 'block'; // Muestra el botón "Marcar Pagado"
            imageFile = file; // Almacena el archivo de imagen uploadText.style.opacity = '0'; // Oculta el texto del botón de subida
           uploadText.style.opacity = '0'; // Oculta el texto del botón de subida
        }
        reader.readAsDataURL(file); // Lee el archivo como una URL de datos
    } else {
        previewImage.style.display = 'none'; // Oculta la imagen si no hay archivo
        uploadButton.style.display = 'none'; // Oculta el botón si no hay archivo
        imageFile = null; // Limpia la variable de archivo de imagen
    }
}
         
         // Función para subir la imagen a Imgur
         function uploadImage() {
         if (!imageFile) {
             alert("Por favor, selecciona una imagen para subir.");
             return;
         }
         
         const formData = new FormData();
         formData.append('image', imageFile);
         
         fetch('https://api.imgur.com/3/image', {
             method: 'POST',
             headers: {
                 'Authorization': 'Client-ID bb0beed3488e033' // Reemplaza con tu Client ID de Imgur
             },
             body: formData
         })
         .then(response => response.json())
         .then(data => {
             if (data.success) {
                 const imgurUrl = data.data.link; // Obtiene el URL de la imagen
                 markAsPaid(currentOrderId, imgurUrl); // Marca la orden como pagada y pasa el URL
             } else {
                 alert("Error al subir la imagen: " + data.message);
             }
         })
         .catch(error => {
             console.error('Error al subir la imagen:', error);
             alert("Error al subir la imagen.");
         });
         }
         
         // Función para marcar la orden como pagada
         function markAsPaid(orderId, imgurUrl) {
         const url = `${apiUrl}?path=markAsPaid&orderId=${encodeURIComponent(orderId)}&imgurUrl=${encodeURIComponent(imgurUrl)}`;
         
         fetch(url)
             .then(response => {
                 if (!response.ok) {
                     throw new Error(`HTTP error! status: ${response.status}`);
                 }
                 return response.json();
             })
             .then(data => {
                 if (data.status === 200) {
                     alert("Pago marcado como pagado exitosamente.");
                     //updatePaymentStatus(orderId); // Actualiza la UI
                   
                 } else {
                     alert("Error al marcar como pagada: " + data.message);
                 }
             })
             .catch(error => {
                 console.error('Error marking as paid:', error);
                 alert("Error al marcar como pagada. Intenta de nuevo más tarde. Detalle: " + error.message);
             })
             .finally(() => {
         fetchPendingPayments();
         fetchValidatedPayments();
                 closeModal(); // Cierra el modal
                 clearModalData(); // Limpia los datos del modal
             });
         }
         
         ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
         // Funciones para la calculadora "out"
         let lastEditedFieldOut = '';
         
         async function convertCurrencyOut() {
         const fromCurrencyOut = document.getElementById('from-currency-out').value;
         const toCurrencyOut = document.getElementById('to-currency-out').value;
         const fromAmountOut = parseFloat(document.getElementById('from-amount-out').value);
         const toAmountOut = parseFloat(document.getElementById('to-amount-out').value);
         
         if (lastEditedFieldOut === 'from' && isNaN(fromAmountOut)) {
             document.getElementById('to-amount-out').value = ''; // Limpia el campo de destino
             return; 
         } else if (lastEditedFieldOut === 'to' && isNaN(toAmountOut)) {
             document.getElementById('from-amount-out').value = ''; // Limpia el campo de origen
             return; 
         }
         
         try {
             const rateOut = await fetchExchangeRate(fromCurrencyOut, toCurrencyOut);
             if (lastEditedFieldOut === 'from' && !isNaN(fromAmountOut)) {
                 const convertedAmountOut = fromAmountOut * rateOut;
                 document.getElementById('to-amount-out').value = convertedAmountOut.toFixed(2);
             } else if (lastEditedFieldOut === 'to' && !isNaN(toAmountOut)) {
                 const convertedAmountOut = toAmountOut / rateOut;
                 document.getElementById('from-amount-out').value = convertedAmountOut.toFixed(2);
             }
         } catch (error) {
             console.error('Error al obtener la tasa de cambio:', error);
             document.getElementById('exchange-rate-out').textContent = 'Tasa de cambio no disponible';
         }
         }
         
         // Escucha los eventos de entrada y cambio para la calculadora "out"
         document.getElementById('from-amount-out').addEventListener('input', function() {
         lastEditedFieldOut = 'from';
         convertCurrencyOut();
         });
         
         document.getElementById('to-amount-out').addEventListener('input', function() {
         lastEditedFieldOut = 'to';
         convertCurrencyOut();
         });
         
         // Escucha los eventos de cambio en los selectores de moneda para la calculadora "out"
         document.getElementById('from-currency-out').addEventListener('change', async () => {
         clearAmountFieldsOut(); // Limpiar los campos de cantidad
            await updateExchangeRateOut(); // Actualizar la tasa de cambio
         await convertCurrencyOut(); // Convierte si hay cantidad
         });
         
         document.getElementById('to-currency-out').addEventListener('change', async () => {
         clearAmountFieldsOut(); // Limpiar los campos de cantidad
         await updateExchangeRateOut(); // Actualizar la tasa de cambio
         await convertCurrencyOut(); // Convierte si hay cantidad
         });
         
         // Función para limpiar los campos de cantidad en la calculadora "out"
         function clearAmountFieldsOut() {
         document.getElementById('from-amount-out').value = '';
         document.getElementById('to-amount-out').value = '';
         }
         
         // Función para actualizar la tasa de cambio al cambiar la selección para la calculadora "out"
         async function updateExchangeRateOut() {
         const fromCurrencyOut = document.getElementById('from-currency-out').value;
         const toCurrencyOut = document.getElementById('to-currency-out').value;
         
         try {
             const rateOut = await fetchExchangeRate(fromCurrencyOut, toCurrencyOut);
             document.getElementById('exchange-rate-out').textContent = `Tasa de cambio: 1 ${fromCurrencyOut} = ${rateOut} ${toCurrencyOut}`;
         } catch (error) {
             document.getElementById('exchange-rate-out').textContent = 'Tasa de cambio no disponible';
         }
         }
         
         // Inicializa la tasa de cambio al cargar la página para la calculadora "out"
         document.addEventListener('DOMContentLoaded', async () => {
         await updateExchangeRate();
         await updateExchangeRateOut();
         });
         
         
         let lastEditedField = '';
         let exchangeRates = {}; // Objeto para almacenar las tasas de cambio en caché
         
         async function fetchExchangeRate(fromCurrency, toCurrency) {
         // Comprobar si la tasa ya está en caché
         const cacheKey = `${fromCurrency}_${toCurrency}`;
         const currentTime = Date.now(); // Obtener el tiempo actual en milisegundos
         
         // Verificar si la tasa está en caché y si no ha expirado (10 minutos = 600000 milisegundos)
         if (exchangeRates[cacheKey]) {
             const { rate, timestamp } = exchangeRates[cacheKey];
             if (currentTime - timestamp < 600000) { // Si han pasado menos de 10 minutos
                 return rate; // Retorna la tasa desde la caché
             }
         }
         
         // Si no está en caché o ha expirado, hacer la solicitud a la API
         const response = await fetch(`https://script.google.com/macros/s/AKfycbyqwVhjeggTJ2aJ87OgbROMFublEt77kO9sciQRep8uoZKgj9ZgiOAVlBqpHphwr1Rg/exec?from=${fromCurrency}&to=${toCurrency}`);
         const data = await response.json();
         
         if (data.error) {
             throw new Error(data.error);
         }
         
         // Eliminar comas de la tasa y convertir a número
         const rate = parseFloat(data.rate.replace(/,/g, '')); // Reemplaza las comas y convierte a número
         exchangeRates[cacheKey] = { rate: rate, timestamp: currentTime }; // Almacenar la tasa y el timestamp en caché
         return rate; // Retorna la tasa
         }
         
         async function convertCurrency() {
         const fromCurrency = document.getElementById('from-currency').value;
         const toCurrency = document.getElementById('to-currency').value;
         const fromAmount = parseFloat(document.getElementById('from-amount').value);
         const toAmount = parseFloat(document.getElementById('to-amount').value);
         
         // Verificar si uno de los campos está vacío
         if (lastEditedField === 'from' && isNaN(fromAmount)) {
             document.getElementById('to-amount').value = ''; // Limpia el campo de destino
             return; // Salir de la función si el campo de origen está vacío
         } else if (lastEditedField === 'to' && isNaN(toAmount)) {
             document.getElementById('from-amount').value = ''; // Limpia el campo de origen
             return; // Salir de la función si el campo de destino está vacío
         }
         
         try {
             const rate = await fetchExchangeRate(fromCurrency, toCurrency);
             console.log(`Tasa de cambio de ${fromCurrency} a ${toCurrency}: ${rate}`); // Debugging
         
             if (lastEditedField === 'from' && !isNaN(fromAmount)) {
                 const convertedAmount = fromAmount * rate;
                 document.getElementById('to-amount').value = convertedAmount.toFixed(2);
                 console.log(`Convertido: ${fromAmount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`); // Debugging
             } else if (lastEditedField === 'to' && !isNaN(toAmount)) {
                 const convertedAmount = toAmount / rate;
                 document.getElementById('from-amount').value = convertedAmount.toFixed(2);
                 console.log(`Convertido: ${toAmount} ${toCurrency} = ${convertedAmount} ${fromCurrency}`); // Debugging
             }
         } catch (error) {
             console.error('Error al obtener la tasa de cambio:', error);
             document.getElementById('exchange-rate').textContent = 'Tasa de cambio no disponible';
         }
         }
         
         // Función para limpiar los campos de cantidad
         function clearAmountFields() {
         document.getElementById('from-amount').value = '';
         document.getElementById('to-amount').value = '';
         }
         
         // Escucha los eventos de entrada y cambio
         document.getElementById('from-amount').addEventListener('input', function() {
         lastEditedField = 'from';
         convertCurrency();
         });
         
         document.getElementById('to-amount').addEventListener('input', function() {
         lastEditedField = 'to';
         convertCurrency();
         });
         
         // Escucha los eventos de cambio en los selectores de moneda
         document.getElementById('from-currency').addEventListener('change', async () => {
         clearAmountFields(); // Limpiar los campos de cantidad
         await updateExchangeRate(); // Actualizar la tasa de cambio
         await convertCurrency(); // Convierte si hay cantidad
         });
         
         document.getElementById('to-currency').addEventListener('change', async () => {
         clearAmountFields(); // Limpiar los campos de cantidad
         await updateExchangeRate(); // Actualizar la tasa de cambio
         await convertCurrency(); // Convierte si hay cantidad
         });
         
         // Función para actualizar la tasa de cambio al cambiar la selección
         async function updateExchangeRate() {
         const fromCurrency = document.getElementById('from-currency').value;
         const toCurrency = document.getElementById('to-currency').value;
         
         try {
             const rate = await fetchExchangeRate(fromCurrency, toCurrency);
             document.getElementById('exchange-rate').textContent = `Tasa de cambio: 1 ${fromCurrency} = ${rate} ${toCurrency}`;
         } catch (error) {
             document.getElementById('exchange-rate').textContent = 'Tasa de cambio no disponible';
         }
         }
         
         // Inicializa la tasa de cambio al cargar la página
         document.addEventListener('DOMContentLoaded', async () => {
         await updateExchangeRate();
         });
         
         document.getElementById('send-whatsapp').addEventListener('click', function() {
         const fromAmount = document.getElementById('from-amount').value;
         const fromCurrency = document.getElementById('from-currency').value;
         const toAmount = document.getElementById('to-amount').value;
         const toCurrency = document.getElementById('to-currency').value;
         const exchangeRateText = document.getElementById('exchange-rate').textContent;
         
         // Construir el mensaje para WhatsApp
         const message = `Hola! Quiero enviar ${fromAmount} ${fromCurrency}, que se convierte en ${toAmount} ${toCurrency}. ${exchangeRateText}`;
         
         // Codificar el mensaje para la URL
         const encodedMessage = encodeURIComponent(message);
         
         // Crear el enlace de WhatsApp
         const whatsappUrl = `https://wa.me/584121542322?text=${encodedMessage}`;
         
         // Abrir el enlace en una nueva pestaña
         window.open(whatsappUrl, '_blank');
         });
         
         
         ////////////////////////////////////////////////////////////////////////////////
         
         
             function showMessage(message, isError = true) {
                 const messageDiv = document.getElementById('message');
                 messageDiv.textContent = message;
                 messageDiv.style.color = isError ? 'red' : 'green';
             }
         
         function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showMessage('Por favor, completa todos los campos.');
        return;
    }

    fetch(`${apiUrl}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la API');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                currentUser  = data.user.name; // Inicializar currentUser  aquí
                userCurrency = data.user.country; // Almacena la moneda del usuario
                showMessage("Inicio de sesión exitoso!", false);
                showProfile(data.role, data.user);
                fetchOrders();
                closeModal();
              
              // Mostrar la barra de herramientas al iniciar sesión
                document.getElementById('Toolbar').style.display = 'flex'; // Muestra la barra de herramientas


                // Ocultar el botón "Enviar dinero ahora" al iniciar sesión
                document.getElementById('send-whatsapp').style.display = 'none'; // Oculta el botón

                // Ocultar el contenedorOut al iniciar sesión exitosamente
                document.querySelector('.containerOut').style.display = 'none'; // Asegúrate de que este sea el selector correcto
                document.getElementById('authContainer').style.display = 'none'; // Ocultar el contenedor de autenticación
                // Ocultar los botones de "Iniciar Sesión" y "Registrarse" en el menú
                document.querySelector('.login-button').style.display = 'none'; // Oculta el botón de inicio de sesión
                document.querySelector('.register-button').style.display = 'none'; // Oculta el botón de registro
            } else {
                showMessage("Credenciales inválidas: " + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage("Ocurrió un error durante el inicio de sesión.");
        });
}
         
         function register() {
         const username = document.getElementById('username').value;
         const email = document.getElementById('email').value;
         const phone = document.getElementById('phone').value;
         const password = document.getElementById('password').value;
         
         if (!username || !email || !phone || !password) {
             showMessage('Por favor, completa todos los campos.');
             return;
         }
         
         fetch(`${apiUrl}?action=register&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&password=${encodeURIComponent(password)}`)
             .then(response => response.json())
             .then(data => {
                 if (data.success) {
                     showMessage(data.message, false);
                     
                     // Ocultar los formularios de registro y de inicio de sesión
                     document.getElementById('authContainer').style.display = 'none'; // Ocultar el contenedor de autenticación
                     document.querySelector('.login-button').style.display = 'none'; // Oculta el botón de inicio de sesión
                     document.querySelector('.register-button').style.display = 'none'; // Oculta el botón de registro
                 } else {
                     showMessage(data.message);
                 }
             })
             .catch(error => {
                 console.error('Error:', error);
                 showMessage("Ocurrió un error durante el registro.");
             });
         }
         
         function showProfile(role, user) {
    // Almacena el nombre del usuario en la variable global
    currentUser  = user.name;
    userCurrency = user.country; // Asegúrate de almacenar la moneda

    // Ocultar todas las secciones
    document.getElementById('resellerSection').style.display = 'none';
    document.getElementById('cashierSection').style.display = 'none';
    document.getElementById('takerSection').style.display = 'none';

    // Mostrar el perfil del usuario
    document.getElementById('userName').textContent = ` ${user.name} `;
    document.getElementById('userEarnings').textContent = ` ${user.earnings} `;
    document.getElementById('userRole').textContent = ` ${role} `;
    document.getElementById('userCurrency').textContent = userCurrency; // Muestra la moneda del usuario

    // Mostrar la sección correspondiente según el rol
    if (role === 'reseller') {
        document.getElementById('resellerSection').style.display = 'block'; // Mostrar sección de recibos
        fetchOrders(); // Cargar transacciones del reseller
    } else if (role === 'cashier') {
        document.getElementById('cashierSection').style.display = 'block'; // Mostrar sección de validación
        fetchPendingPayments(); // Cargar pagos pendientes
    } else if (role === 'taker') {
        document.getElementById('takerSection').style.display = 'block'; // Mostrar sección de toma y pago de recibos
    } else {
        showMessage("Rol no reconocido.");
    }
}
                    
             function toggleForms() {
                 const registerForm = document.getElementById('registerForm');
                 const loginForm = document.getElementById('loginForm');
         
                 // Alternar entre el formulario de registro y el de inicio de sesión
                 if (registerForm.style.display === 'none') {
                     registerForm.style.display = 'block';
                     loginForm.style.display = 'none';
                     document.getElementById('message').textContent = ''; // Limpiar mensajes
                 } else {
                     registerForm.style.display = 'none';
                     loginForm.style.display = 'block';
                     document.getElementById('message').textContent = ''; // Limpiar mensajes
                 }
             }
         
         
         // Cerrar el modal al hacer clic fuera de él
         window.onclick = function(event) {
         const modal = document.getElementById('authModal');
         if (event.target === modal) {
             closeModal();
         }
         }
         
         // También puedes usar el botón de cerrar
         document.querySelector('.close').addEventListener('click', closeModal);
         
            
         window.onclick = function(event) {
         const modal = document.getElementById('authModal');
         if (event.target === modal) {
             closeModal();
         }
         }
         
         function openLoginModal() {
         // Ocultar todas las secciones
         document.getElementById('resellerSection').style.display = 'none';
         document.getElementById('cashierSection').style.display = 'none';
         document.getElementById('takerSection').style.display = 'none';
         
         // Ocultar la calculadora y los botones de autenticación
         document.querySelector('.container').style.display = 'none'; // Oculta la calculadora
         document.querySelector('.login-button').style.display = 'none'; // Oculta el botón de inicio de sesión
         document.querySelector('.register-button').style.display = 'none'; // Oculta el botón de registro
         
         // Ocultar el contenedorOut al abrir el modal de inicio de sesión
         document.querySelector('.containerOut').style.display = 'none'; // Asegúrate de que este sea el selector correcto
         
         // Mostrar el contenedor de inicio de sesión
         document.getElementById('authContainer').style.display = 'block';
         document.getElementById('registerForm').style.display = 'none';
         document.getElementById('loginForm').style.display = 'block';
         }
         
         function closeModal() {
         const authModal = document.getElementById('authContainer');
         const takeOrderModal = document.getElementById('takeOrderModal');
         if (authModal) {
             authModal.style.display = 'none'; // Cierra el modal de autenticación
         }
          
         if (takeOrderModal) {
        takeOrderModal.style.display = 'none'; // Cierra el modal de toma de orden
    }  
         
         // Mostrar la calculadora nuevamente
         document.querySelector('.container').style.display = 'block'; // Muestra la calculadora
         document.querySelector('.login-button').style.display = 'inline-block'; // Muestra el botón de inicio de sesión
         document.querySelector('.register-button').style.display = 'inline-block'; // Muestra el botón de registro
         
         document.body.classList.remove('hidden'); // Muestra el contenido de la página
         }
         
  function logout() {
    // Limpiar información del usuario y ocultar el perfil
    currentUser  = ''; // Limpiar la variable global del usuario
    userCurrency = ''; // Limpiar la moneda del usuario

    // Ocultar secciones de usuario
    document.getElementById('resellerSection').style.display = 'none';
    document.getElementById('cashierSection').style.display = 'none';
    document.getElementById('takerSection').style.display = 'none';
    document.getElementById('profileContainer').style.display = 'none';

    // Mostrar el contenedor de autenticación
    document.getElementById('authContainer').style.display = 'block';
    
    // Mostrar la calculadora "out"
    document.querySelector('.containerOut').style.display = 'block'; // Muestra la calculadora "out"

    // Ocultar la calculadora principal
    document.querySelector('.container').style.display = 'none'; // Oculta la calculadora principal

    // Mostrar los botones de inicio de sesión y registro
    document.querySelector('.login-button').style.display = 'inline-block'; // Muestra el botón de inicio de sesión
    document.querySelector('.register-button').style.display = 'inline-block'; // Muestra el botón de registro

    // Minimizar el menú
    closeMenu(); // Llama a la función que minimiza el menú
}
         
         //////////////////////////////////////////////////////////////////////////////////////
         
         function showProfileContainer() {
         // Mostrar el contenedor del perfil
         document.getElementById('profileContainer').style.display = 'block';
         document.getElementById('cotizaContainer').style.display = 'none';  
         document.getElementById('ordersContainer').style.display = 'none';
         document.getElementById('cashierContainer').style.display = 'none';
         document.getElementById('takerContainer').style.display = 'none';
        
         }
         
         function showOrdersSection() {
         // Mostrar el contenedor del perfil
           document.getElementById('takerContainer').style.display = 'block';
         document.getElementById('cashierContainer').style.display = 'block';
         document.getElementById('ordersContainer').style.display = 'block';
         document.getElementById('profileContainer').style.display = 'none';
         document.getElementById('cotizaContainer').style.display = 'none';   
         }
          function showCotizacion() {
         // Mostrar el contenedor del perfil
         document.getElementById('cotizaContainer').style.display = 'block';   
         document.getElementById('ordersContainer').style.display = 'none';
         document.getElementById('profileContainer').style.display = 'none';
         cotizaContainer
         }
         