// MICROSERVICIO: document-microservice
// ARCHIVO: src/components/TokenDebugger.jsx

import { useState, useEffect } from 'react';
import { authService } from '../services/auth';

const TokenDebugger = () => {
  const [token, setToken] = useState('');
  const [decodedToken, setDecodedToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  
  useEffect(() => {
    const updateTokenInfo = () => {
      const storedToken = authService.getToken();
      setToken(storedToken || 'No token found');
      
      if (storedToken) {
        const decoded = authService.decodeToken();
        setDecodedToken(decoded);
        
        // Verificar el token con el servidor de autenticación
        authService.verifyToken().then(userData => {
          setUserInfo(userData);
        }).catch(error => {
          console.error("Error verificando token:", error);
          setUserInfo(null);
        });
      } else {
        setDecodedToken(null);
        setUserInfo(null);
      }
    };

    // Actualizar información del token cada segundo
    const interval = setInterval(updateTokenInfo, 1000);
    
    // Actualizar inmediatamente
    updateTokenInfo();
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-yellow-100 p-4 mb-4 rounded-md">
      <h3 className="font-bold">Token Debugger</h3>
      
      <div className="mt-2">
        <p className="text-xs">
          <strong>Estado del Token:</strong> {token ? 'Token presente' : 'No token found'}
        </p>
        
        {token && token !== 'No token found' && (
          <p className="text-xs break-all mt-1">
            <strong>Token:</strong> {token.substring(0, 20)}...
          </p>
        )}
      </div>

      {userInfo && (
        <div className="mt-2 p-2 bg-green-100 rounded">
          <h4 className="font-semibold text-sm text-green-800">Usuario Autenticado:</h4>
          <p className="text-xs text-green-700">ID: {userInfo.id}</p>
          <p className="text-xs text-green-700">Username: {userInfo.username}</p>
          <p className="text-xs text-green-700">Email: {userInfo.email}</p>
          <p className="text-xs text-green-700">Roles: {userInfo.roles?.join(', ')}</p>
        </div>
      )}

      {decodedToken && (
        <div className="mt-2">
          <h4 className="font-semibold text-sm">Token Decodificado:</h4>
          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-40">
            {JSON.stringify(decodedToken, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-2 flex space-x-2">
        <button 
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          onClick={() => {
            const currentToken = authService.getToken();
            console.log("Token en localStorage:", currentToken);
            alert("Token: " + (currentToken || "No token found"));
          }}
        >
          Ver Token en Consola
        </button>
        
        <button 
          className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          onClick={async () => {
            const userData = await authService.verifyToken();
            console.log("Verificación de token:", userData);
            alert("Verificación: " + (userData ? "Token válido" : "Token inválido"));
          }}
        >
          Verificar Token
        </button>
      </div>
    </div>
  );
};

export default TokenDebugger;