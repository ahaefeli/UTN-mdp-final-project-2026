export const PHONE_ERROR =
  'El teléfono solo puede tener dígitos, espacios, guiones, paréntesis y un + inicial. Usá entre 8 y 15 números.';

const PHONE_RE = /^\+?[\d\s\-()]+$/;

export function phoneError(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (!PHONE_RE.test(text)) return PHONE_ERROR;
  const digits = text.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return PHONE_ERROR;
  return '';
}
