export const PASSWORD_ERROR = 'La contraseña debe tener al menos 8 caracteres.';
export const DNI_ERROR = 'El DNI debe tener 7 u 8 dígitos, sin letras.';
export const USERNAME_ERROR =
  'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos (sin espacios).';

export function normalizeDni(value) {
  return String(value || '').replace(/[.\s-]/g, '').trim();
}

export function formatDni(value) {
  const digits = normalizeDni(value).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function passwordError(value) {
  if (!value || String(value).length < 8) return PASSWORD_ERROR;
  return null;
}

export function dniError(value) {
  if (!/^\d{7,8}$/.test(normalizeDni(value))) return DNI_ERROR;
  return null;
}

export function emailError(value) {
  const text = String(value || '').trim();
  if (!text) return 'El email es obligatorio.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return 'El email tiene que incluir un @ y un dominio.';
  }
  return null;
}

export function usernameError(value) {
  if (!/^[a-zA-Z0-9._-]+$/.test(String(value || '').trim())) return USERNAME_ERROR;
  return null;
}
