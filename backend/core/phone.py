import re

PHONE_ERROR = (
    'El teléfono solo puede tener dígitos, espacios, guiones, paréntesis y un + inicial. '
    'Usá entre 8 y 15 números.'
)
_PHONE_RE = re.compile(r'^\+?[\d\s\-()]+$')


def phone_error(value):
    """Devuelve un mensaje en español, o None si el teléfono está vacío o es válido."""
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    if not _PHONE_RE.match(text):
        return PHONE_ERROR
    digits = re.sub(r'\D', '', text)
    if len(digits) < 8 or len(digits) > 15:
        return PHONE_ERROR
    return None
