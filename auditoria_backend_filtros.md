# Reporte de Auditoría Backend: Filtros de Integridad en Acciones Pendientes

## 1. Causa Raíz
Los contadores de solicitudes pendientes se están "inflando" porque el sistema genera un registro (o token) inicial en la base de datos con estado `PENDING` al momento en que el administrador crea el enlace de invitación. 
Si la consulta únicamente filtra por `status='PENDING'`, incluye tanto las solicitudes que ya fueron enviadas de vuelta por el usuario público, como aquellos enlaces "fantasma" que aún no han sido visitados ni rellenados.

## 2. Solución Estructural
Para resolver este falso positivo, es necesario asegurar que el registro ya contiene los datos del formulario que el usuario debe proveer. Para los clubes validaremos la existencia de `club_name`, y para los Árbitros y Planilleros validaremos que `admin_email` no esté vacío.

**Bloque de código exacto a reemplazar en `backend/internal/views/dashboard.py`:**

```python
        # --- NUEVO CÁLCULO DE ACCIONES PENDIENTES CON FILTROS DE INTEGRIDAD ---
        base_pending_reqs = ClubRegistrationRequest.objects.filter(
            status='PENDING',
            organization=org
        )

        # Un club pendiente es aquel cuyo enlace ya fue llenado con el nombre del club
        pending_clubs = base_pending_reqs.filter(
            role='CLUB_ADMIN'
        ).exclude(club_name__isnull=True).exclude(club_name__exact='').count()

        # Un árbitro pendiente es aquel que ya ingresó sus datos de contacto
        pending_referees = base_pending_reqs.filter(
            role='REFEREE'
        ).exclude(admin_email__isnull=True).exclude(admin_email__exact='').count()

        # Un planillero pendiente es aquel que ya ingresó sus datos de contacto
        pending_scorers = base_pending_reqs.filter(
            role='SCORER'
        ).exclude(admin_email__isnull=True).exclude(admin_email__exact='').count()
```

Al inyectar estos modificadores `.exclude()`, los contadores mostrarán exclusivamente las personas o clubes que ya han completado su parte del registro y están a la espera de aprobación final.
