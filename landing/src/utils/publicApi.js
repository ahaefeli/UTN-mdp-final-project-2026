/**
 * Base de la API pública.
 * En producción es https://api.voleyhub.com/public.
 * Si NEXT_PUBLIC_API_URL ya viene (con o sin /public), se le agrega /public.
 * El fallback local solo se usa en desarrollo.
 */
const DEV_API_ORIGIN = 'http://127.0.0.1:8000';
const PROD_API_ORIGIN = 'https://api.voleyhub.com';

function isLocalUrl(value) {
  return /localhost|127\.0\.0\.1|192\.168\.\d+\.\d+/i.test(value || '');
}

function ensureAbsoluteUrl(value) {
  const trimmed = String(value || '').replace(/\/$/, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

export function getPublicApiBase() {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv) {
    const absolute = ensureAbsoluteUrl(fromEnv).replace(/\/public$/i, '');
    if (!(process.env.NODE_ENV === 'production' && isLocalUrl(absolute))) {
      return `${absolute}/public`;
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return `${PROD_API_ORIGIN}/public`;
  }

  if (typeof window !== 'undefined' && isLocalUrl(window.location?.hostname)) {
    return `http://${window.location.hostname}:8000/public`;
  }

  return `${DEV_API_ORIGIN}/public`;
}
