# Reporte de Auditoría: Acciones Pendientes en Dashboard (Admin)

## 1. Causa Raíz
El panel central ignora los roles `REFEREE` y `SCORER` por las siguientes razones:
- **Filtro de exclusión en Backend:** En `backend/internal/views/dashboard.py`, la consulta a la base de datos excluye explícitamente cualquier solicitud donde el nombre del club sea nulo o vacío (`exclude(club_name__isnull=True).exclude(club_name__exact='')`). Ya que los Árbitros y Planilleros se registran como individuos sin un club asignado (a diferencia de un Club Admin), sus solicitudes son omitidas silenciosamente de los resultados.
- **Acoplamiento de tipo de alerta:** Todos los resultados obtenidos en esa consulta son formateados bajo un único evento `"NEW_AFFILIATION"` usando la propiedad `club_name`, asumiendo implícitamente que todo registro corresponde a un club.
- **Falta de segmentación:** Ni el frontend ni el backend separan o cuentan las notificaciones en base al campo `role` (`CLUB_ADMIN`, `REFEREE`, `SCORER`).

## 2. Solución Backend
Se debe modificar la vista `AdminDashboardView` en `backend/internal/views/dashboard.py` para calcular tres conteos distintos en base al campo `role`, y luego enviar estos datos estructurados dentro del JSON de respuesta.

**Bloque de código a inyectar en la vista (`dashboard.py`):**
```python
        # --- NUEVO CÁLCULO DE ACCIONES PENDIENTES ---
        base_pending_reqs = ClubRegistrationRequest.objects.filter(
            status='PENDING',
            organization=org
        )

        pending_clubs = base_pending_reqs.filter(role='CLUB_ADMIN').count()
        pending_referees = base_pending_reqs.filter(role='REFEREE').count()
        pending_scorers = base_pending_reqs.filter(role='SCORER').count()
```

**Modificación del retorno (`JsonResponse`):**
```python
        return JsonResponse({
            "total_clubs": total_clubs,
            "federated_players": {
                "total": player_stats['total'] or 0,
                "masculino": player_stats['masculino'] or 0,
                "femenino": player_stats['femenino'] or 0,
            },
            "active_tournaments": active_tournaments,
            "matches_without_referee": matches_without_referee,
            # Se inyecta la nueva estructura de conteos:
            "pending_counts": {
                "clubs": pending_clubs,
                "referees": pending_referees,
                "scorers": pending_scorers,
            },
            "pending_actions": list(pending_actions) # (Opcional mantener para retrocompatibilidad)
        }, status=200)
```

## 3. Solución Frontend
En `platform/src/app/page.js`, se necesita procesar esta nueva jerarquía en el JSON y desplegar de forma condicional bloques de notificaciones clickeables mediante `<Link>`.

**Asegurarse de tener importado `Link`:**
```javascript
import Link from 'next/link';
```

**Actualización del estado (dentro de `loadAdminDashboard`):**
```javascript
      setMetrics({
        total_clubs: data.total_clubs || 0,
        federated_players: data.federated_players || { total: 0, masculino: 0, femenino: 0 },
        active_tournaments: data.active_tournaments || 0,
        matches_without_referee: data.matches_without_referee || 0,
        // Almacenamos el conteo de registros pendientes:
        pending_counts: data.pending_counts || { clubs: 0, referees: 0, scorers: 0 }
      });
```

**Bloque JSX a inyectar en la vista del rol `ADMIN` (Reemplazando/debajo de `<PendingAlerts alerts={pendingActions} />`):**
```jsx
                {/* Sección Alertas Pendientes por Rol */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {metrics?.pending_counts?.clubs > 0 && (
                    <Link href="/clubes" style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s', cursor: 'pointer' }}>
                        <i className="bi bi-shield-fill-exclamation" style={{ fontSize: '1.2rem' }}></i>
                        <span>Tienes <strong>{metrics.pending_counts.clubs}</strong> solicitud(es) de Clubes pendientes.</span>
                      </div>
                    </Link>
                  )}
                  
                  {metrics?.pending_counts?.referees > 0 && (
                    <Link href="/arbitros" style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', color: '#14532d', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s', cursor: 'pointer' }}>
                        <i className="bi bi-person-badge-fill" style={{ fontSize: '1.2rem' }}></i>
                        <span>Tienes <strong>{metrics.pending_counts.referees}</strong> solicitud(es) de Árbitros pendientes.</span>
                      </div>
                    </Link>
                  )}

                  {metrics?.pending_counts?.scorers > 0 && (
                    <Link href="/planilleros" style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '1rem', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '0.5rem', color: '#7c2d12', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s', cursor: 'pointer' }}>
                        <i className="bi bi-clipboard-data-fill" style={{ fontSize: '1.2rem' }}></i>
                        <span>Tienes <strong>{metrics.pending_counts.scorers}</strong> solicitud(es) de Planilleros pendientes.</span>
                      </div>
                    </Link>
                  )}
                </div>
```
