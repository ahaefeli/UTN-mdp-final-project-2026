import unicodedata


def fold(value):
    text = unicodedata.normalize('NFD', str(value or ''))
    return ''.join(ch for ch in text if unicodedata.category(ch) != 'Mn').casefold()
