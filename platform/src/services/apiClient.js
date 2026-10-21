import axios from 'axios';

const PROD_API_URL = 'https://api.voleyhub.com/';

function isLocalHost(hostname) {
  return (
    !hostname ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^192\.168\.\d+\.\d+$/.test(hostname)
  );
}

function ensureAbsoluteApiUrl(url) {
  const trimmed = String(url).trim().replace(/\/$/, '');
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return `${withProtocol}/`;
}

// En la red local la API escucha en el mismo host, puerto 8000.
// En producción el host público es api.voleyhub.com, sin puerto.
export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname;
    if (!isLocalHost(hostname)) {
      return PROD_API_URL;
    }
    return `http://${hostname}:8000/`;
  }

  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv && !/localhost|127\.0\.0\.1|192\.168\.\d+\.\d+/i.test(fromEnv)) {
    return ensureAbsoluteApiUrl(fromEnv);
  }

  if (process.env.NODE_ENV === 'production') {
    return PROD_API_URL;
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

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Content-Type', false);
      } else if (config.headers) {
        delete config.headers['Content-Type'];
      }
    }

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
