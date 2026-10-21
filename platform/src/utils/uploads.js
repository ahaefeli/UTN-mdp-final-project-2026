export const FILE_ERROR =
  'El archivo tiene que ser PDF, JPG, PNG o WEBP, y no puede pesar más de 5 MB.';
export const LOGO_ERROR = 'El escudo tiene que ser una imagen JPG, PNG o WEBP de hasta 2 MB.';

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export function uploadFileError(file) {
  if (!file) return null;
  const extension = String(file.name || '').split('.').pop().toLowerCase();
  const contentType = String(file.type || '').toLowerCase();
  if (
    !ALLOWED_EXTENSIONS.includes(extension) ||
    !ALLOWED_TYPES.includes(contentType) ||
    file.size > MAX_BYTES ||
    file.size <= 0
  ) {
    return FILE_ERROR;
  }
  return null;
}

export function logoFileError(file) {
  if (!file) return null;
  const extension = String(file.name || '').split('.').pop().toLowerCase();
  const contentType = String(file.type || '').toLowerCase();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (
    !imageExtensions.includes(extension) ||
    !imageTypes.includes(contentType) ||
    file.size > 2 * 1024 * 1024 ||
    file.size <= 0
  ) {
    return LOGO_ERROR;
  }
  return null;
}
