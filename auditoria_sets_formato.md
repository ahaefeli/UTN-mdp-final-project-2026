# Reporte Técnico de Auditoría: Soporte para Formatos de Partido (Mejor de 3 vs Mejor de 5 Sets)

## 1. Diagnóstico del Estado Actual

Actualmente, el sistema se encuentra acoplado rígidamente (*hardcoded*) al formato de voleibol al mejor de 5 sets (primer equipo en ganar 3 sets) en tres capas: persistencia de lógica de negocio, cálculo de posiciones y validación en cliente.

### A. Backend: Lógica de Validación y Finalización
En [backend/internal/views/matches.py](file:///c:/Users/nerin/Documents/GitHub/UTN-mdp-final-project-2026/backend/internal/views/matches.py):

- **Líneas 272-273 (`validate_volleyball_sets`)**:
  ```python
  if len(score_detail) < 3 or len(score_detail) > 5:
      return None, 'Un partido de vóley se cierra con 3, 4 o 5 sets.'
  ```
  *Falla:* Rechaza partidos que cierran 2-0 (2 sets).
- **Línea 289 (`validate_volleyball_sets`)**:
  ```python
  target = 15 if i == 4 else 25
  ```
  *Falla:* Solo asume set decisivo a 15 puntos en el 5º set (índice 4). En formato al mejor de 3, el set decisivo (tie-break) es el 3º (índice 2).
- **Línea 316 (`validate_volleyball_sets`)**:
  ```python
  if (local_sets >= 3 or visitor_sets >= 3) and i < len(score_detail) - 1:
      return None, 'Hay sets de más: el partido ya tenía un ganador.'
  ```
  *Falla:* Permite que un partido continúe aunque un equipo ya haya ganado 2 sets en formato al mejor de 3.
- **Líneas 321-324 (`validate_volleyball_sets`)**:
  ```python
  if max(local_sets, visitor_sets) != 3:
      return None, 'El ganador debe ganar exactamente 3 sets (mejor de 5).'
  if min(local_sets, visitor_sets) > 2:
      return None, 'Resultado inválido: un equipo no puede perder más de 2 sets.'
  ```
  *Falla:* Exige estrictamente 3 sets ganados e invalida marcadores válidos al mejor de 3 (2-0, 2-1).
- **Líneas 348-355 (`MatchFinishView.post`)**:
  `MatchFinishView` invoca `validate_volleyball_sets(score_detail)` en la línea 348 **antes** de recuperar la instancia de `Match` de la base de datos (línea 353). La validación desconoce completamente la identidad y el contexto reglamentario del partido que intenta finalizar.

### B. Backend: Cálculo de Tabla de Posiciones
En [backend/public/utils/standings_calculator.py](file:///c:/Users/nerin/Documents/GitHub/UTN-mdp-final-project-2026/backend/public/utils/standings_calculator.py):

- **Líneas 85-90 (`calculate_standings`)**:
  ```python
  decisive = (
      sets_won_home != sets_won_visitor
      and max(sets_won_home, sets_won_visitor) == 3
  )
  if not decisive:
      continue
  ```
  *Falla Crítica:* Ignora silenciosamente cualquier partido finalizado al mejor de 3 (cuyo ganador tiene 2 sets). El partido no suma puntos, partidos jugados (`pj`), ni sets para ningún equipo en la tabla.
- **Líneas 107-126 (`calculate_standings`)**:
  ```python
  if sets_won_home == 3 and sets_won_visitor == 2:
      home_stats['puntos'] += 2
      visitor_stats['puntos'] += 1
  else:
      home_stats['puntos'] += 3
      visitor_stats['puntos'] += 0
  ```
  *Falla:* El reparto de puntos asume únicamente desenlace 3-2. En partidos al mejor de 3, una victoria 2-1 corresponde a definición en set corto (2 puntos para el ganador, 1 para el perdedor), mientras que 2-0 corresponde a 3 puntos para el ganador y 0 para el perdedor.

### C. Backend: Serialización y Modelos
- En [backend/core/models.py](file:///c:/Users/nerin/Documents/GitHub/UTN-mdp-final-project-2026/backend/core/models.py), ni `Tournament` (líneas 92-110) ni `Match` (líneas 166-185) poseen atributos referentes a la cantidad de sets o formato de disputa.
- En [backend/internal/views/matches.py](file:///c:/Users/nerin/Documents/GitHub/UTN-mdp-final-project-2026/backend/internal/views/matches.py) (líneas 49-60, `serialize_match_detail`) no se expone ningún campo de formato al cliente.

### D. Frontend: Modal de Carga de Planilla
En [platform/src/components/ScoreSheet/ScoreSheetModal.js](file:///c:/Users/nerin/Documents/GitHub/UTN-mdp-final-project-2026/platform/src/components/ScoreSheet/ScoreSheetModal.js):

- **Líneas 11-13 (`setsFromMatch`)**: Inicializa por defecto un arreglo de 3 sets vacíos (`[emptySet(), emptySet(), emptySet()]`).
- **Línea 30 (`withoutTrailingEmptySets`)**: `while (next.length > 3)` impide limpiar sets vacíos por debajo de 3, haciendo imposible guardar un resultado de 2 sets (2-0).
- **Líneas 42, 66, 79, 87-89 (`validateClientSets`)**: Réplica de las validaciones rígidas del backend (límite entre 3 y 5 sets, set 5 como único tie-break a 15, y exigencia de 3 sets ganados).
- **Líneas 123 y 129 (`addSet`, `removeSet`)**: Límites duros `sets.length >= 5` y `sets.length <= 3`.
- **Líneas 227, 235-237, 247 (JSX)**: Botones deshabilitados según los límites de 3 y 5 sets, y texto de ayuda acoplado a "Mejor de 5".

---

## 2. Modelo de Dominio y Persistencia

### Análisis de Opciones

| Enfoque | Ubicación | Pros | Contras | Veredicto |
| :--- | :--- | :--- | :--- | :--- |
| **Por Categoría** | Derivado de `Tournament.category` | No requiere migración de DB | Inflexible: no permite torneos Sub-18 al mejor de 5 ni Primera al mejor de 3 | **Descartado (Mala práctica)** |
| **Al Vuelo en UI** | Parámetro en el modal de resultado | Aparentemente simple | Inconsistencia: un operador podría cargar 2 sets y otro 3 sets en el mismo torneo; altera la equidad deportiva | **Descartado (Riesgo alto)** |
| **Por Torneo** | `Tournament.best_of` | Refleja las Bases y Condiciones oficiales de la competencia; regla unificada para toda la tabla | Si los playoffs de un torneo cambian de formato respecto a la fase regular, requiere manejo adicional | **Recomendado (Principal)** |
| **Por Partido (con herencia)** | `Match.best_of` con fallback a `Tournament.best_of` | Flexibilidad absoluta (fase regular a 3 sets, finales a 5 sets) | Requiere migración en `Tournament` y en `Match` | **Alternativa Avanzada** |

### Recomendación Arquitectónica
Definir el formato formalmente a nivel de competencia en el modelo `Tournament`:
```python
# core/models.py
class Tournament(models.Model):
    # ...
    best_of = models.PositiveSmallIntegerField(
        default=5,
        choices=[(3, 'Mejor de 3 sets'), (5, 'Mejor de 5 sets')]
    )
```

**Justificación técnica:**
1. **Consistencia de Tabla:** La tabla de posiciones agrupa equipos de un mismo torneo bajo un criterio reglamentario uniforme.
2. **Retrocompatibilidad:** Al establecer `default=5`, todas las filas preexistentes en la base de datos se conservan íntegras sin requerir scripts manuales de corrección de datos.
3. **Single Source of Truth:** El backend valida contra la regla del torneo, impidiendo que el frontend envíe formatos arbitrarios.

---

## 3. Puntos de Falla e Inconsistencias Potenciales

1. **Inconsistencia de Puntaje en Tabla de Posiciones (Standings)**:
   - En vóley competitivo bajo sistema FIVB/FeVA (3 puntos por victoria limpia, 2-1 en desempate):
     - **Mejor de 5:** 3-0 y 3-1 otorgan 3 pts (ganador) y 0 pts (perdedor). 3-2 otorga 2 pts y 1 pt.
     - **Mejor de 3:** 2-0 otorga 3 pts (ganador) y 0 pts (perdedor). 2-1 otorga 2 pts y 1 pt.
   - *Regla Matemática Unificada:* Si el perdedor alcanza el set definitorio (`sets_perdedor == sets_para_ganar - 1`), se reparten 2 y 1 puntos. En caso contrario, se otorgan 3 y 0.
   - Si no se actualiza `standings_calculator.py`, los partidos al mejor de 3 quedan excluidos por la condición `max(...) == 3`.

2. **Coeficiente de Sets (Sets Ratio)**:
   - El desempate en la tabla utiliza `sets_ganados / sets_perdidos`. Un torneo mixto donde unos partidos otorgaran 2 sets y otros 3 distorsionaría el coeficiente si no se normaliza dentro del mismo torneo.

3. **Incompatibilidad Retroactiva en Partidos Existentes**:
   - Sin el `default=5` en la migración de Django, los registros históricos de `Tournament` quedarían con valores `NULL`, provocando errores `TypeError` en comparaciones aritméticas.

---

## 4. Contrato de API

### A. Consulta de Partidos (`GET internal/torneos/partidos/`)
El serializador `serialize_match_detail` debe enriquecerse para proveer al cliente la metadata de formato:
```json
{
  "id": "uuid-partido",
  "local_team_name": "Club A",
  "visitor_team_name": "Club B",
  "best_of": 3,
  "sets_to_win": 2,
  "status": "IN_PROGRESS",
  "sets_data": { "sets": [] }
}
```

### B. Envío de Resultado (`POST internal/torneos/partidos/finalizar/`)
- **Payload del Frontend:** Se mantiene inalterado.
  ```json
  {
    "match_id": "uuid-partido",
    "score_detail": [
      { "set_number": 1, "local_points": 25, "visitor_points": 20 },
      { "set_number": 2, "local_points": 25, "visitor_points": 22 }
    ]
  }
  ```
- **Principio de Seguridad:** El cliente **no** debe enviar `best_of` en el payload. El backend obtiene el `match_id`, consulta el `best_of` del torneo correspondiente, y valida en base a esa directriz inmutable.

---

## 5. Plan Técnico de Modificación

### A. Tareas para el Agente Backend
1. **Modelos y Migración (`backend/core/models.py`)**:
   - Agregar campo `best_of` a `Tournament` con `default=5` y `choices=[(3, 'Mejor de 3 sets'), (5, 'Mejor de 5 sets')]`.
   - Generar y aplicar migración en `backend/core/migrations/`.
2. **Serialización (`backend/internal/views/matches.py` y `backend/internal/views/tournaments.py`)**:
   - En `serialize_match_detail`, incluir `best_of` (obtenido de `m.tournament_stage.tournament.best_of`) y `sets_to_win` (`(best_of // 2) + 1`).
   - En `TournamentView.post` y `TournamentView.put`, admitir el parámetro `best_of`.
3. **Lógica de Validación (`backend/internal/views/matches.py`)**:
   - Refactorizar `validate_volleyball_sets(score_detail, best_of=5)`:
     - `sets_to_win = (best_of // 2) + 1` (2 para Bo3, 3 para Bo5).
     - `min_sets = sets_to_win`, `max_sets = best_of`.
     - `tie_break_index = best_of - 1` (índice 2 para Bo3, índice 4 para Bo5) con objetivo de 15 puntos; los anteriores a 25 puntos.
     - Validar que el ganador alcance exactamente `sets_to_win` y el perdedor no exceda `sets_to_win - 1`.
   - En `MatchFinishView.post`: Reordenar para buscar primero el `Match` por `mid` y pasar su `best_of` a la validación.
4. **Cálculo de Posiciones (`backend/public/utils/standings_calculator.py`)**:
   - En `calculate_standings`: Obtener `best_of` del torneo (`Tournament.objects.get(id=tournament_id).best_of`).
   - Reemplazar la condición estricta `max(...) == 3` por `max(...) == sets_to_win`.
   - Asignar 2 pts / 1 pt cuando `sets_perdedor == sets_to_win - 1`, y 3 pts / 0 pts en caso contrario.
5. **Pruebas Automatizadas (`backend/tests/`)**:
   - Agregar casos de prueba unitarios e integrados para 2-0 y 2-1 al mejor de 3 sets en `test_match_finish.py` y `test_standings_calculator.py`.

### B. Tareas para el Agente Frontend
1. **Asistente de Creación de Torneo (`platform/src/app/torneos/nuevo/page.js`)**:
   - Incorporar selector de formato ("Mejor de 3 sets" vs "Mejor de 5 sets") en el Paso 1 (Datos Generales) y enviarlo en el payload a `tournamentService.createTournament`.
2. **Componente de Planilla (`platform/src/components/ScoreSheet/ScoreSheetModal.js`)**:
   - Parametrizar dinámicamente según `match.best_of || 5`:
     - Calcular `setsToWin = Math.floor(bestOf / 2) + 1` (2 o 3).
     - Configurar `minSets = setsToWin` y `maxSets = bestOf`.
     - Ajustar `setsFromMatch`: generar `minSets` sets iniciales vacíos (2 para Bo3, 3 para Bo5).
     - Ajustar `withoutTrailingEmptySets`: condición de poda `while (next.length > minSets)`.
     - Ajustar `validateClientSets`: evaluar target de 15 puntos en `i === bestOf - 1`, y validar que el ganador alcance `setsToWin`.
     - Ajustar botones `addSet` (máximo `maxSets`) y `removeSet` (mínimo `minSets`).
     - Actualizar la leyenda de ayuda textual dinámicamente según el formato del partido.
