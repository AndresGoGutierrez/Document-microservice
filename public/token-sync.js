// MICROSERVICIO: document-microservice
// ARCHIVO: public/token-sync.js

(function() {
  // Función para sincronizar el token
  function syncToken() {
    // Verificar si hay un token en localStorage
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      console.log('Token encontrado en localStorage, sincronizando...');
      
      // Enviar mensaje a la ventana principal (si existe)
      if (window.opener && window.opener !== window) {
        window.opener.postMessage({ type: 'TOKEN_SYNC', token }, '*');
      }
      
      // Enviar mensaje a todas las ventanas abiertas
      window.postMessage({ type: 'TOKEN_SYNC', token }, '*');
    } else {
      console.log('No se encontró token en localStorage');
    }
  }
  
  // Escuchar mensajes de otras ventanas
  window.addEventListener('message', function(event) {
    // Verificar el origen del mensaje (puedes hacerlo más seguro)
    if (event.data && event.data.type === 'TOKEN_SYNC') {
      console.log('Recibido token de otra ventana, actualizando localStorage');
      localStorage.setItem('auth_token', event.data.token);
    }
  });
  
  // Sincronizar token al cargar la página
  syncToken();
  
  // Sincronizar token cada 5 segundos
  setInterval(syncToken, 5000);
})();