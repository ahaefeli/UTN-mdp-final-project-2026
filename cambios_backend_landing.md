# Documentación de Cambios Backend - Landing Page

Se han creado dos nuevos endpoints públicos y desacoplados bajo la ruta `/public/` para permitir la integración con la Landing Page sin requerir autenticación JWT.

---

## 1. Listado de Organizaciones

Obtiene la lista de todas las ligas/organizaciones del sistema.

- **Endpoint:** `GET /public/organizaciones/`
- **Autenticación:** No requerida.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "e8ce8c65-809b-433e-b3b9-35d77a718f0b",
        "name": "Liga Metropolitana de Voley"
      },
      {
        "id": "7c6f7dec-77cb-484d-8fe0-766fc5e7edf0",
        "name": "Liga MDQ"
      }
    ]
  }
  ```

---

## 2. Listado de Torneos

Obtiene la lista de torneos. Admite filtrado y paginación opcional.

- **Endpoint:** `GET /public/torneos/`
- **Autenticación:** No requerida.
- **Query Parameters:**
  - `organization_id` (UUID, opcional): Filtra por la organización correspondiente.
  - `year` (entero, opcional): Filtra por el año del torneo.
  - `status` (string, opcional): Filtra por el estado del torneo (`PREPARATION`, `CANCELLED`, `IN_PROGRESS`, `FINISHED`).
  - `page` (entero, opcional): Habilita la paginación y solicita la página indicada (10 elementos por página).

### Ejemplo de Solicitud sin Paginación
- **URL:** `GET /public/torneos/?status=IN_PROGRESS`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "43e0eab6-a0da-451a-8f3a-7a75c5d19281",
        "name": "Torneo Apertura 2026",
        "year": 2026,
        "start_date": "2026-07-01",
        "end_date": "2026-12-15",
        "category": "SUB_18",
        "branch": "MALE",
        "status": "IN_PROGRESS",
        "organization_id": "7c6f7dec-77cb-484d-8fe0-766fc5e7edf0",
        "organization_name": "Liga MDQ"
      }
    ]
  }
  ```

### Ejemplo de Solicitud con Paginación
- **URL:** `GET /public/torneos/?page=1`
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "43e0eab6-a0da-451a-8f3a-7a75c5d19281",
        "name": "Torneo Apertura 2026",
        "year": 2026,
        "start_date": "2026-07-01",
        "end_date": "2026-12-15",
        "category": "SUB_18",
        "branch": "MALE",
        "status": "IN_PROGRESS",
        "organization_id": "7c6f7dec-77cb-484d-8fe0-766fc5e7edf0",
        "organization_name": "Liga MDQ"
      }
    ],
    "pagination": {
      "total_pages": 1,
      "current_page": 1,
      "total_items": 1
    }
  }
  ```
