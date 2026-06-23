import axios from 'axios';

// La URL base del API se obtiene de variables de entorno o usa la URL por defecto para desarrollo local.
// El backend expone rutas en '/api/internal/' y la autenticación en '/api/auth/'.
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones para inyectar automáticamente el token JWT
apiClient.interceptors.request.use(
  (config) => {
    // Evita errores durante Server-Side Rendering (SSR) en Next.js
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('lnv_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para manejar errores comunes (como token expirado)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      // Si el backend responde con 401 (no autorizado), limpiamos la sesión expirada
      if (status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('lnv_token');
        localStorage.removeItem('lnv_session');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
