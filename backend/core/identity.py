import re

PASSWORD_ERROR = 'La contraseña debe tener al menos 8 caracteres.'
DNI_ERROR = 'El DNI debe tener 7 u 8 dígitos, sin letras.'
USERNAME_ERROR = (
    'El nombre de usuario solo puede contener letras, números, puntos, '
    'guiones y guiones bajos (sin espacios).'
)
USERNAME_RE = re.compile(r'^[a-zA-Z0-9._-]+$')


def normalize_dni(value):
    return re.sub(r'[.\s-]', '', str(value or '').strip())


def password_error(value):
    if value is None or str(value) == '':
        return PASSWORD_ERROR
    if len(str(value)) < 8:
        return PASSWORD_ERROR
    return None


def dni_error(value):
    digits = normalize_dni(value)
    if not re.fullmatch(r'\d{7,8}', digits):
        return DNI_ERROR
    return None


def username_error(value):
    text = str(value or '').strip()
    if not text or not USERNAME_RE.fullmatch(text):
        return USERNAME_ERROR
    return None
