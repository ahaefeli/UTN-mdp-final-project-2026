import axios from 'axios';

// En el navegador se usa el mismo host con el que se abrió la página (192.168.1.8 u otro).
// NEXT_PUBLIC_API_URL solo aplica en el servidor, y se ignora si apunta a localhost.
export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8000/`;
  }

  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`;
  }

  return 'http://192.168.1.8:8000/';
}

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones para inyectar automáticamente el token JWT
apiClient.interceptors.request.use(
  (config) => {
    // Evita errores durante Server-Side Rendering (SSR) en Next.js
    config.baseURL = getApiBaseUrl();

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
