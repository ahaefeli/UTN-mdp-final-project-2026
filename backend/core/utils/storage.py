import os
import uuid
from google.cloud import storage

def upload_to_gcs(file_obj, destination_blob_name):
    """Sube un archivo a Google Cloud Storage y retorna su URL publica."""
    bucket_name = os.environ.get("BUCKET_NAME")
    if not bucket_name:
        raise Exception("BUCKET_NAME no esta configurado en las variables de entorno.")

    # Al no pasar credenciales, se usa la Service Account por defecto de Cloud Run
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    
    unique_name = f"{uuid.uuid4()}_{destination_blob_name}"
    blob = bucket.blob(unique_name)
    
    blob.upload_from_file(file_obj, content_type=file_obj.content_type)
    
    return blob.public_url
