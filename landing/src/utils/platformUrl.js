/**
 * URL base de la platform autenticada (gestión).
 * NEXT_PUBLIC_PLATFORM_URL se incrusta en el build de Next.
 * En producción, si falta o apunta a la red local, se usa el dominio público.
 */
const DEV_PLATFORM_URL = 'http://192.168.1.8:3001';
const PROD_PLATFORM_URL = 'https://plataforma.voleyhub.com';

function ensureAbsoluteUrl(url) {
  const trimmed = String(url).trim().replace(/\/$/, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isLocalUrl(url) {
  return /localhost|127\.0\.0\.1|192\.168\.\d+\.\d+/i.test(url);
}

export function getPlatformBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_PLATFORM_URL;
  if (fromEnv) {
    const absolute = ensureAbsoluteUrl(fromEnv);
    if (process.env.NODE_ENV === 'production' && isLocalUrl(absolute)) {
      return PROD_PLATFORM_URL;
    }
    return absolute;
  }

  if (process.env.NODE_ENV === 'production') {
    return PROD_PLATFORM_URL;
  }

  return DEV_PLATFORM_URL;
}

export function getPlatformLoginUrl() {
  return `${getPlatformBaseUrl()}/login`;
}
