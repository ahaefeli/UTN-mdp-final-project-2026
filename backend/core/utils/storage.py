import os
import uuid
from google.cloud import storage

ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.webp'}
ALLOWED_CONTENT_TYPES = {
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
}
LOGO_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
LOGO_CONTENT_TYPES = {'image/jpeg', 'image/jpg', 'image/png', 'image/webp'}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_LOGO_BYTES = 2 * 1024 * 1024
FILE_ERROR = 'El archivo tiene que ser PDF, JPG, PNG o WEBP, y no puede pesar más de 5 MB.'
LOGO_ERROR = 'El escudo tiene que ser una imagen JPG, PNG o WEBP de hasta 2 MB.'
UPLOAD_ERROR = 'No pudimos guardar el escudo. Probá con otra imagen.'


def _file_size(file_obj):
    size = getattr(file_obj, 'size', None)
    if size is not None:
        return size
    if hasattr(file_obj, 'seek') and hasattr(file_obj, 'tell'):
        position = file_obj.tell()
        file_obj.seek(0, os.SEEK_END)
        size = file_obj.tell()
        file_obj.seek(position)
        return size
    return None


def validate_upload(file_obj, *, logo=False):
    name = getattr(file_obj, 'name', '') or ''
    extension = os.path.splitext(name)[1].lower()
    content_type = (getattr(file_obj, 'content_type', '') or '').split(';')[0].strip().lower()
    size = _file_size(file_obj)
    allowed_ext = LOGO_EXTENSIONS if logo else ALLOWED_EXTENSIONS
    allowed_types = LOGO_CONTENT_TYPES if logo else ALLOWED_CONTENT_TYPES
    max_bytes = MAX_LOGO_BYTES if logo else MAX_UPLOAD_BYTES
    message = LOGO_ERROR if logo else FILE_ERROR
    if extension not in allowed_ext or content_type not in allowed_types:
        raise ValueError(message)
    if size is None or size > max_bytes or size <= 0:
        raise ValueError(message)


def upload_to_gcs(file_obj, destination_blob_name, type_data, *, logo=False):
    """
        Sube un archivo a Google Cloud Storage y retorna su URL publica.
        file_obj: El archivo a subir
        destination_blob_name: El nombre del archivo
        type_data: Tipo de data subida (Ej. medical_certificate, profile_image)
    """
    validate_upload(file_obj, logo=logo)
    bucket_name = os.environ.get("BUCKET_NAME")
    if not bucket_name:
        raise ValueError(UPLOAD_ERROR)

    try:
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        unique_name = f"{type_data}_{uuid.uuid4()}_{destination_blob_name}"
        blob = bucket.blob(unique_name)
        blob.upload_from_file(file_obj, content_type=file_obj.content_type)
        try:
            blob.make_public()
        except Exception:
            pass
        return blob.public_url
    except ValueError:
        raise
    except Exception:
        raise ValueError(UPLOAD_ERROR)
