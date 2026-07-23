# Comportamiento observado

Documento de rarezas y bugs pinneados por tests, y su estado tras la etapa 3 de correcciones.

Formato por entrada:

- **Comportamiento**
- **Test**
- **Riesgo / inconsistencia**
- **Estado**

---

## MatchFinishView — REFEREE/SCORER sin asignar pueden finalizar

- **Comportamiento:** Si `referee_id` / `scorer_id` es `None`, cualquier usuario con ese rol puede finalizar el partido.
- **Test:** `tests/api/test_match_finish.py`
- **Riesgo:** cualquier árbitro/planillero de la org puede cargar resultados de partidos sin asignar.
- **Estado:** intencional (política operativa)

---

## TournamentStageView — sí requiere JWT (vía BaseCrudView)

- **Comportamiento:** Hereda `@jwt_required` de `BaseCrudView`; sin token → 401.
- **Test:** `tests/api/test_tournament_stages.py`
- **Nota:** se había sospechado acceso abierto; el pin confirma que **sí** exige auth.
- **Estado:** documentado (no es bug)

---

## Tournament delete — CASCADE borra partidos (no 400)

- **Comportamiento:** `DELETE /internal/torneos/<id>/` con partidos asociados responde **200** porque `Match`/`TournamentStage` usan `on_delete=CASCADE`. El mensaje `"Cannot delete tournament with associated data"` casi no se alcanza.
- **Test:** `tests/api/test_tournament_rules.py::TestTournamentRulesExtras::test_delete_tournament_cascades_with_matches`
- **Riesgo:** pérdida masiva de fixture/resultados al borrar un torneo.
- **Estado:** intencional (política operativa; no corregido en etapa 3)

---

## Soft-delete — Match/Club hard-delete (parcial)

- **Comportamiento:** `TeamView.delete` hace soft-delete (`is_deleted=True`). `MatchView.delete` y `ClubView.delete` hacen hard-delete.
- **Test:** `tests/api/test_teams.py`, `tests/api/test_match_view_rbac.py::test_hard_delete`
- **Nota:** en etapa 3, `validate_match_collisions` sí excluye `is_deleted=False`. Soft-delete unificado en Match/Club queda fuera de alcance.
- **Estado:** parcial (colisiones corregidas; hard-delete Match/Club se mantiene)

---

## Corregidos en etapa 3

| Tema | Fix | Tests |
|------|-----|-------|
| Reschedule sin colisiones/org/FINISHED + ISO datetime | `MatchRescheduleView` endurecido | `test_match_reschedule.py` |
| PUT `FINISHED` no persistía | PUT rechaza `FINISHED` → usar `/finalizar/` | `test_match_view_rbac.py`, `test_tournament_rules.py` |
| Standings 0-0 / inválido = victoria visitante | Omitir partidos sin 3-x decisivo | `test_standings_calculator.py` |
| Club GET cross-org | Filtro por `organization` | `test_clubs_courts_smoke.py` |
| Colisiones con `is_deleted` | Querysets filtran `is_deleted=False` | `test_match_collisions.py` |
| `SCHEDULED` no auto-avanzaba | También avanza a `IN_PROGRESS` | `test_match_status.py` |
| `court_id=None` bloqueo mutuo | Solo bloquear si hay cancha | `test_match_status.py` |
| `match_datetime: ""` no limpiaba | Se setea `None` | `test_match_view_rbac.py` |
| Upcoming con terminales null | Excluye `FINISHED`/`CANCELLED` | `test_match_view_rbac.py` |
| Referencia `OWNER` en UserView | `exclude(role='ADMIN')` | `test_users_rbac.py` |
