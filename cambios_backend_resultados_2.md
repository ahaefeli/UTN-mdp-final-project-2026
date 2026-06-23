# Documentación de Cambios Backend - Resultados de Partidos y Posiciones (FEVA)

Se han expuesto dos nuevos endpoints públicos adicionales bajo la ruta `/public/` para integrarse con la Landing Page sin requerir token JWT.

---

## 1. Listado de Partidos por Torneo

Obtiene los partidos programados y jugados de un torneo, incluyendo los logos del club y estado de los sets.

- **Endpoint:** `GET /public/partidos/`
- **Autenticación:** No requerida.
- **Query Parameters:**
  - `tournament_id` (UUID, obligatorio): El identificador único del torneo.
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "e8ce8c65-809b-433e-b3b9-35d77a718f0b",
        "tournament_stage_id": 1,
        "tournament_stage_name": "Fecha 1",
        "local_team_id": "43e0eab6-a0da-451a-8f3a-7a75c5d19281",
        "local_team_name": "Club Atletico MDQ A",
        "local_club_logo_url": "https://storage.googleapis.com/mock-bucket/club_logo/mdq_a.png",
        "visitor_team_id": "55333249-fa23-42af-b26b-0b9990203602",
        "visitor_team_name": "Club Atletico MDQ B",
        "visitor_club_logo_url": "https://storage.googleapis.com/mock-bucket/club_logo/mdq_b.png",
        "match_datetime": "2026-07-01T15:00:00Z",
        "status": "FINISHED",
        "score_summary": "25-20, 25-18, 25-22",
        "sets_data": {
          "sets": [
            {"set_number": 1, "local_score": 25, "visitor_score": 20},
            {"set_number": 2, "local_score": 25, "visitor_score": 18},
            {"set_number": 3, "local_score": 25, "visitor_score": 22}
          ]
        }
      }
    ]
  }
  ```

---

## 2. Tabla de Posiciones (Cálculo Oficial FEVA)

Realiza el cálculo en tiempo real de la tabla de posiciones del torneo bajo la reglamentación FEVA oficial de puntajes y coeficientes.

### Sistema de Puntuación FEVA:
- **Victoria por 3-0 o 3-1:** 3 puntos al ganador, 0 puntos al perdedor.
- **Victoria por 3-2:** 2 puntos al ganador, 1 punto al perdedor (bonificación por tie-break).
- **Criterio de Desempate (Orden):**
  1. Puntos Totales (descendente)
  2. Partidos Ganados (PG) (descendente)
  3. Coeficiente de Sets (Sets Ganados / Sets Perdidos) (descendente)

- **Endpoint:** `GET /public/torneos/<uuid:tournament_id>/posiciones/`
- **Autenticación:** No requerida.
- **Respuesta Exitosa (200 OK):**
  ```json
  [
    {
      "team_id": "43e0eab6-a0da-451a-8f3a-7a75c5d19281",
      "team_name": "Club Atletico MDQ A",
      "club_id": "8c69aab9-93ad-4186-a1b2-ec17fa4bfab4",
      "club_name": "Club Atletico MDQ A",
      "club_logo_url": "https://storage.googleapis.com/mock-bucket/club_logo/mdq_a.png",
      "puntos": 3,
      "pj": 1,
      "pg": 1,
      "pp": 0,
      "sets_ganados": 3,
      "sets_perdidos": 0
    },
    {
      "team_id": "55333249-fa23-42af-b26b-0b9990203602",
      "team_name": "Club Atletico MDQ B",
      "club_id": "8c69aab9-93ad-4186-a1b2-ec17fa4bfab5",
      "club_name": "Club Atletico MDQ B",
      "club_logo_url": "https://storage.googleapis.com/mock-bucket/club_logo/mdq_b.png",
      "puntos": 0,
      "pj": 1,
      "pg": 0,
      "pp": 1,
      "sets_ganados": 0,
      "sets_perdidos": 3
    }
  ]
  ```
