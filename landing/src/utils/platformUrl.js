/**
 * URL base de la platform autenticada (gestión).
 * Configurar NEXT_PUBLIC_PLATFORM_URL en producción (ej. https://app.voleyhub.com).
 */
export function getPlatformBaseUrl() {
  const base = process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3001';
  return base.replace(/\/$/, '');
}

export function getPlatformLoginUrl() {
  return `${getPlatformBaseUrl()}/login`;
}
