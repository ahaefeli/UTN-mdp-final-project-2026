import json
from django.core import signing

def generate_registration_token(extra_data=None):
    """
    Generates a secure, timestamp-signed token.
    Serializes extra_data to JSON string and signs it.
    """
    signer = signing.TimestampSigner()
    data_str = json.dumps(extra_data or {})
    return signer.sign(data_str)

def verify_registration_token(token, max_age=172800):
    """
    Verifies a timestamp-signed token within max_age (default 48 hours).
    Returns (True, data) if valid, or (False, None) if expired or tampered with.
    """
    signer = signing.TimestampSigner()
    try:
        data_str = signer.unsign(token, max_age=max_age)
        return True, json.loads(data_str)
    except (signing.SignatureExpired, signing.BadSignature):
        return False, None
