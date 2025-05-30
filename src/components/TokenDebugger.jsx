// En document-microservice/src/components/TokenDebugger.jsx
import { useState, useEffect } from 'react';

const TokenDebugger = () => {
  const [token, setToken] = useState('');
  
  useEffect(() => {
    // Verificar el token cada segundo
    const interval = setInterval(() => {
      const storedToken = localStorage.getItem('auth_token');
      setToken(storedToken || 'No token found');
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-yellow-100 p-2 mb-1 rounded-md">
      <h3 className="font-bold">Token Debugger</h3>
      <p className="text-xs break-all mt-2">
        {token ? `Token: ${token.substring(0, 20)}...` : 'No token found'}
      </p>
    </div>
  );
};

export default TokenDebugger;