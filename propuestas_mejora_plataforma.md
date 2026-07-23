# Propuestas de Mejora — VoleyHub / Plataforma LNV

**Rol del análisis:** Principal Product Manager + Lead UX/UI Architect  
**Alcance:** Solo lectura y diagnóstico global (monorepo completo)  
**Método:** Multipasada — estructura → backend/datos → frontends → consolidación cruzada  
**Estándar de diseño asumido:** interfaz minimalista, limpia, alto contraste, orientada 100% a velocidad de flujos de trabajo (mínimos clics, máxima claridad operativa)

---

## 1. Resumen Ejecutivo

### Qué es el sistema

**VoleyHub** es una plataforma de gestión de ligas y clubes de vóley (branding operativo **LNV / Liga Necochea Vóley**) organizada como monorepo de tres piezas desacopladas:

| Pieza | Puerto | Rol | Stack |
|-------|--------|-----|--------|
| `landing/` | :3000 | Sitio público: marketing + consulta de torneos/resultados/posiciones | Next.js 16, React 19, Tailwind 4 |
| `platform/` | :3001 | Portal autenticado de operación con RBAC por rol | Next.js 16, React 19, Tailwind + CSS Modules |
| `backend/` | :8000 | API JSON + PostgreSQL multi-tenant por `Organization` | Django 5.2, JWT custom (`PyJWT`), vistas class-based |

**Modelo de negocio actual:**

```
Organization (liga/tenant)
  ├── User (roles) + Club → Court
  │                      └── Team (coach + players)
  └── Tournament → TournamentEnrollment / TournamentStage → Match
                                                         → score_summary / sets_data → Standings
```

**Roles operativos:** `ADMIN` (liga), `CLUB_ADMIN`, `COACH`, `PLAYER`, `REFEREE`, `SCORER`.  
**Onboarding externo:** links de invitación 48h → registro público → aprobación ADMIN → Club/CLUB_ADMIN o staff (árbitro/planillero).

### Estado actual (veredicto)

El sistema cubre el **ciclo operativo base** de una liga: alta de actores, armado de torneos, fixture manual, consulta pública y dashboards por rol. Está en un estado de **MVP funcional avanzado**, no de producto cerrado.

**Fortalezas**
- Separación clara público (`/public/`) vs gestión (`/internal/` + JWT).
- Dominio deportivo coherente (categoría, rama, sets, standings con reglas 3-0 / 3-1 / 3-2).
- Flujos ADMIN maduros: torneos, fechas, partidos, afiliaciones pendientes, métricas.
- Platform con servicios de dominio particionados; landing ya consume torneos reales.

**Debilidades estructurales**
- **Desconexión crítica frontend↔backend en el corazón del producto:** existe `POST .../partidos/finalizar/` y `matchService.finishMatch`, pero **ninguna UI lo invoca**. “Finalizar” en pantalla suele marcar estado sin cargar sets. Las posiciones dependen de scores que muchas veces no se capturan.
- Landing incompleta: equipos mock + overlay “Próximamente”, contacto simulado, header/footer duplicados, CTAs rotos hacia platform, filtros decorativos en detalle de torneo.
- RBAC irregular: permisos ad-hoc en backend (JWT ≠ autorización); `/inscripciones` funcional pero fuera del Navbar; REFEREE/SCORER con superficie mínima.
- Deuda técnica alta: secretos/DB en settings, soft-delete inconsistente, estados fantasma (`SCHEDULED`, `SUSPENDED`), deps no usadas (DRF, simplejwt, channels), app `external` vacía, sin Docker ni docs de producto.

**Conclusión:** el mayor ROI no es “más pantallas decorativas”, sino **cerrar el loop operativo partido → planilla de sets → posiciones**, endurecer permisos, y simplificar la UI hacia un puesto de trabajo denso y rápido por rol.

---

## 2. Propuestas de Nuevas Features

Priorizadas por valor comercial/operativo (impacto × factibilidad relativa al dominio ya modelado).

### P0 — Cierre del loop de resultados (core del negocio)

| Feature | Descripción | Valor |
|---------|-------------|--------|
| **Carga de planilla de sets** | UI dedicada (modal o página) para SCORER / REFEREE / ADMIN: ingresar sets set-a-set, validar mejor de 5, llamar `finalizar` y persistir `sets_data` + `score_summary` (el backend tiene TODO explícito en `MatchFinishView`). | Sin esto, tabla de posiciones y landing pierden credibilidad. |
| **Cola “Partidos a planillar”** | Lista del día filtrada por rol (mis partidos como árbitro/planillero) con CTA único “Cargar resultado”. | Reduce tiempo de jornada; hoy REFEREE/SCORER casi no tienen flujo propio. |
| **Corrección de resultado con auditoría** | Reabrir partido finalizado → editar sets → recalcular standings; log de quién/cuándo. | Evita “arreglos” por WhatsApp y datos inconsistentes. |

### P1 — Operación de liga (alta frecuencia semanal)

| Feature | Descripción | Valor |
|---------|-------------|--------|
| **Generador de fixture** | Round-robin / jornadas a partir de equipos inscritos + canchas disponibles + ventanas horarias. | Hoy el fixture es 100% manual (cuello de botella del ADMIN). |
| **Detección de conflictos en UI** | Superficie visual de las colisiones que el backend ya calcula (árbitro, equipo, cancha ±1h). | Evita trial-and-error en el detalle de torneo. |
| **Inscripción guiada de equipos** | Absorber `/inscripciones` dentro del detalle de torneo (o exponerla en nav): torneo activo → equipos elegibles (misma cat/rama) → confirmar. | Flujo existe pero está oculto. |
| **Gestión de canchas en UI** | Court CRUD ya está en API; platform solo hace GET. Alta/edición/habilitación desde club o ADMIN. | Completa el recurso físico del fixture. |
| **Cumplimiento federativo** | Gate de inscripción/alineación por `is_federated` + certificado médico vigente. | El campo ya existe en modelo; no hay regla de negocio. |
| **Directorio público de clubes/equipos** | Reemplazar mock de landing `/equipos` por API pública filtrable (`/public/equipos` o `/public/clubes`). | Aumenta valor de la landing como escaparate. |

### P2 — Retención, confianza y monetización soft

| Feature | Descripción | Valor |
|---------|-------------|--------|
| **Notificaciones operativas** | Email/WhatsApp/push: partido reprogramado, resultado cargado, invitación, rechazo de afiliación. | Hoy el mail de aprobación falla silencioso sin SMTP configurado. |
| **Recuperación de contraseña** | Flujo estándar (UI comentada / ausente en login). | Bloqueo de adopción. |
| **Live score / jornada en vivo** | Vista pública “hoy” con estados EN VIVO (ya hay auto `IN_PROGRESS` por horario en `match_status.py`). | Engagement de aficionados y clubes. |
| **Estadísticas por jugador** | Puntos/saques/bloques opcionales por set (extiende `sets_data` o modelo liviano). | Diferenciador vs planillas Excel. |
| **Multi-liga / white-label** | Selector de `Organization` + branding por tenant. | El tenant ya está; falta producto alrededor. |
| **Exportables** | PDF planilla, CSV posiciones, fixture imprimible. | Necesidad real de mesas y prensa local. |
| **Sanciones / walkover / WO** | Estado y reglas de puntos automáticos. | Completa reglamento competitivo. |
| **Contacto / afiliación pública reales** | Reemplazar `alert` / éxito falso por ticket o lead persistido. | Captura de prospectos. |

### Features a **no** priorizar ahora

- Redes sociales internas, chat, marketplace, gamificación.
- Rediseño “marketing-heavy” de platform: el estándar debe ser herramienta de trabajo, no brochure.
- App móvil nativa antes de cerrar planilla + fixture + permisos.
- WebSockets / Channels mientras no exista jornada en vivo (dep instalada, código ausente).

---

## 3. Mejoras de UX (Experiencia de Usuario)

Principio rector: **una tarea primaria por pantalla, feedback inmediato, cero navegación ornamental**.

### 3.1 Fricciones detectadas (mapa)

| Flujo | Fricción | Impacto |
|-------|----------|---------|
| Landing → Login | Mezcla de `localhost:3001/login` hardcodeado vs `href="/login"` (404 en landing) | CTA principal inconsistente/roto |
| Carga de resultado | `finishMatch` / `rescheduleMatch` en servicio **sin callers de UI** | Datos de liga incompletos |
| ADMIN fixture | Torneo → fechas → partido a partido (wizard + detalle largo) | Alto tiempo operativo |
| Setup de club | Tres pantallas: `gestion-club` + `mis-equipos` + `mis-datos` para un club usable | Onboarding lento |
| Inscripciones | Ruta existe, no está en Navbar; AuthContext la restringe | Feature invisible |
| REFEREE / SCORER | Navbar: Inicio + Resultados + Mis Datos | Roles “de papel” |
| Landing equipos | UI completa detrás de “Próximamente” + datos mock | Expectativa incumplida |
| Detalle torneo público | Filtros Categoría/Rama/Jornada decorativos; badge “FECHA 5” hardcodeado | Confusión y desconfianza |
| Contacto / afiliación pública | Éxito falso / `alert` | Pérdida de leads |
| Sesión expirada | 401 limpia token, no redirige a login | Usuario “trabando” |
| Auth dual | `AuthContext` + `authService` + `fetch` manual mezclados por página | Estados inconsistentes |
| Platform mobile | Navbar horizontal sin colapso; `padding-top: 15vh` | Scroll vacío e inusable en campo |
| Sitemap landing | Enlaces a `/dashboard`, `/dashboard/jugadores` inexistentes | Rutas muertas |
| Login UX | Label “Documento” pero POST de `email` | Desconfianza en el primer contacto |

### 3.2 Propuestas precisas (reducir clics / tiempo)

1. **Jornada del día (Home por rol)**  
   Reemplazar dashboards genéricos con una lista accionable:
   - ADMIN: partidos sin árbitro / sin planillero / sin resultado + pendientes de afiliación.
   - SCORER/REFEREE: “Mis partidos de hoy” → un clic a planilla.
   - CLUB_ADMIN/COACH: próximos partidos de mis equipos + alertas de plantel incompleto.  
   *Activar el componente `PendingAlerts` (importado en home y no renderizado) con `pending_actions` del dashboard.*

2. **Planilla en 2 clics**  
   Resultados (o cola del día) → partido → modal de sets (local/visitante por set) → Guardar y finalizar. Validación inline (no cerrar 2-2). Inputs numéricos grandes + Tab/Enter para mesas.

3. **Fixture “desde inscripción”**  
   En `/torneos/[id]`, botón primario “Generar jornada” cuando hay N equipos inscritos; el formulario manual queda como modo avanzado.

4. **Unificar setup de club en un solo flujo**  
   Wizard o tabs en una sola superficie: Datos del club → Entrenadores/Jugadores → Equipos. Hoy el CLUB_ADMIN salta entre tres destinos.

5. **Navbar por tarea, no por entidad**  
   - ADMIN: Inicio · Torneos · Afiliaciones · Resultados · Personas (usuarios/clubes/árbitros/planilleros en un menú).  
   - CLUB: Inicio · Club · Equipos · Resultados.  
   - Operativos: Inicio · Mis partidos · Resultados · Mis datos.  
   Absorber **Inscripciones** dentro del detalle de torneo (preferible a un destino más).

6. **Arreglar el puente Landing → Platform**  
   Una sola fuente: `NEXT_PUBLIC_PLATFORM_URL`. Eliminar hardcodes y `href="/login"` relativos en landing.

7. **Estados vacíos accionables**  
   “No hay partidos” → CTA “Crear fecha” / “Inscribir equipos” según rol. Nunca empty state ornamental.

8. **Feedback de mutaciones**  
   Toast de éxito/error en create/update/finish; hoy hay mucho `console.error` y poco feedback en flujos públicos (detalle torneo landing falla en silencio).

9. **Sesión**  
   Interceptor 401 → redirect `/login?next=...`. Mantener confirmación de logout.

10. **Landing: menos promesas rotas**  
    Ocultar o deshabilitar Equipos/Contacto hasta tener API; eliminar filtros no funcionales; H1 = nombre real del torneo.

11. **Registro por invitación**  
    Al completar, deep-link al login con email precargado y mensaje explícito “pendiente de aprobación” vs “aprobado, ya podés entrar”.

12. **Densidad operativa**  
    Reducir `padding-top: 15vh` a offset de navbar real (~64–80px). Cada píxel vacío es fricción en mobile en cancha.

---

## 4. Mejoras de UI (Interfaz de Usuario)

Estándar: **alto contraste, tipografía legible, densidad operativa, cero cards decorativas**.

### 4.1 Sistema visual unificado (platform primero)

| Elemento | Situación | Propuesta |
|----------|-----------|-----------|
| Tokens | Navy `#001F54` / naranja `#F97316` en landing; CSS Modules + inline + Bootstrap Icons en platform | CSS variables únicas: `--bg`, `--surface`, `--text`, `--text-muted`, `--accent`, `--danger`, `--border`, `--success` |
| Tipografía | Geist declarado, Arial efectivo en `body` | Una familia UI legible + tabular nums solo para marcadores/sets |
| Iconografía | Lucide + Bootstrap Icons | Una sola librería (Lucide) |
| Cards | Default casi siempre (`rounded-3xl` + sombra) | Cards **solo** para ítems accionables (partido, solicitud). Secciones informativas = tipografía + separación, sin caja |
| Contraste | Footer `text-blue-200/35–50`; overlays `bg-slate-50/85` / white/60; labels `text-[9px]` | Texto primario ≥ 4.5:1; labels ≥ 12px; estados con color **+** label textual |
| Espaciado | `custom_container` con 15vh de aire superior | Shell denso: top bar fija + contenido full-width sin “marketing spacing” |

### 4.2 Reorganización visual por superficie

**Landing (consulta)**
- Extraer `SiteHeader` / `SiteFooter` únicos (hoy copiados en ~8 páginas → inconsistencias “Conocenos” vs “La Plataforma”).
- Hero: marca dominante + una línea de valor + un CTA; **sacar** listados/stats del primer viewport.
- Detalle de torneo: H1 = nombre del torneo; subtítulo = cat/rama/año; tabs “Fixture | Posiciones”; filtros reales o eliminarlos.
- Tabla de posiciones: tipografía tabular, filas zebra leves, columna Pts enfatizada.
- Eliminar páginas huérfanas de marketing dentro de platform (`/equipos`, `/contacto` clones) o no montar Navbar de gestión sobre ellas.

**Platform (operación)**
- Listas de partidos: fila compacta `[hora] Local vs Visitante | cancha | estado | acción primaria`.
- Formulario de sets: grilla 2 columnas (Local | Visitante), inputs numéricos grandes, contraste máximo; un solo botón primario “Publicar resultado”.
- Dashboard ADMIN: KPIs en fila simple (no tarjetas profundas); alertas como lista clickeable vía `PendingAlerts`.
- Navbar ADMIN: menú “Más” o sidebar en desktop; hamburger en mobile.
- Preferir tablas/listas sobre grids de cards para usuarios, clubes y partidos.

### 4.3 Jerarquía y legibilidad

- Badges de estado: vocabulario único alineado al modelo (`PREPARATION`, `IN_PROGRESS`, `FINISHED`, `CANCELLED`) — no mostrar `SCHEDULED` / `PENDING` si no están en `STATUS_CHOICES`.
- Traducciones de rol coherentes (`CLUB_ADMIN` = “Admin de club”; `ADMIN` = “Admin de liga”; evitar “League Admin” mezclado).
- Evitar H1 genéricos (“Resultados y Posiciones del Torneo”) sin contexto del torneo seleccionado.
- Login: label alineado al campo real (Email), no “Documento”.

### 4.4 Motion (mínimo, intencional)

- Transición de estado de partido (prep → vivo → final).
- Spinner solo en mutaciones; skeletons en listados.
- Evitar hover-scale decorativo en elementos no interactivos.

---

## 5. Deuda Técnica y Rendimiento

Recomendaciones **periféricas/arquitectónicas** para escalar sin reescribir el dominio.

### 5.1 Seguridad y configuración (urgente)

- Extraer `SECRET_KEY`, credenciales PostgreSQL y `DEBUG` a variables de entorno; rotar secretos ya expuestos en repo.
- `CORS_ALLOW_ALL_ORIGINS = False` + whitelist de landing/platform.
- Definir `FRONTEND_BASE_URL` / `PLATFORM_BASE_URL` para links de invitación.
- Unificar auth: JWT custom documentado y testeado, **o** adoptar `simplejwt` (instalado y no usado).
- Endurecer autorización en views de Club / Court / Enrollment / Stage / Match / Tournament: scope por `organization` / `club` y rol; hoy JWT ≠ permiso (cualquier autenticado puede mutar si conoce la API).
- Configurar SMTP real o desactivar `send_mail` con cola/retry visible.
- Rate limit en login y en `public/club-registration`.

### 5.2 Consistencia de dominio

- Alinear `STATUS_CHOICES` con el código que usa `SCHEDULED` / `SUSPENDED`, o eliminar esas ramas.
- Remover referencias a rol `OWNER` inexistente en `UserView`.
- Implementar soft-delete de punta a punta **o** hard-delete consciente; hoy solo Teams lo aplica bien y el login filtra `is_deleted`.
- Completar `MatchFinishView` para escribir `sets_data` (TODO en `internal/views/matches.py`).
- Enforce “un equipo en un solo torneo activo” (documentado en modelo, no enforced).
- No marcar partidos como `FINISHED` sin score al cerrar torneo (contamina standings).
- Revisar `serialize_match_detail` con campos `score_local` / `score_visitor` inexistentes (código muerto/roto si se usa).
- Usar `TimestampSigner` (`core/utils/signing.py`) en links de afiliación, o documentar por qué se usa UUID plano.

### 5.3 Arquitectura de código

| Tema | Recomendación |
|------|----------------|
| Capas API | Serializers/services compartidos; hoy serialización ad-hoc por vista |
| Apps Django | Incluir `public` en `INSTALLED_APPS` o fusionar; decidir destino de `external` o eliminarla |
| Deps muertas | Quitar o cablear DRF, simplejwt, channels; asegurar `google-cloud-storage` si GCS es real |
| Front services | Eliminar o usar `landing/ApiService` y `platform/ApiService` legacy; unificar `fetch` sueltos en `apiClient`; quitar URLs hardcodeadas `127.0.0.1:8000` en detalle de torneo landing |
| Componentes muertos | Conectar `PendingAlerts`; eliminar o reubicar `platform/equipos` y `platform/contacto` |
| Naming | Ambos `package.json` se llaman `"platform"` — renombrar landing |
| Design system | Package interno mínimo: Button, Table, Badge, EmptyState, Modal, Toast |
| Auth client | Una sola fuente de verdad (`AuthContext` wrapping `authService`) |

### 5.4 Rendimiento y operación

- Paginación consistente: extender a usuarios/clubes; evitar `all()` sin filtro de org.
- Índices DB en `Match.match_datetime`, FKs de enrollment, `User.dni`, `ClubRegistrationRequest.token/status`.
- Caché corta (Redis o HTTP cache) para `/public/torneos/` y posiciones durante jornadas.
- Contenerización: `docker-compose` (postgres + backend + landing + platform) para onboarding de equipo y demos UTN.
- Observabilidad mínima: logging estructurado de 4xx/5xx auth y finish match; healthcheck.
- CI: lint + tests de reglas de standings y colisiones de partidos (lógica crítica sin red de seguridad).
- Documentación raíz: README de monorepo con puertos, seed, roles y mapa de rutas (los README de Next siguen siendo plantilla create-next-app).

### 5.5 Escalabilidad de producto (horizonte)

- Multi-tenant real: middleware/filtro global por `organization_id` del JWT en **todas** las queries internal.
- Storage: política de retención de certificados y logos; URLs firmadas.
- Separar “API read pública” cacheable de “API write operativa”.
- Activar Channels/WebSockets **solo** cuando exista jornada en vivo; no mantener la dep ociosa.

---

## Anexo A — Desconexiones Backend ↔ Frontend (consolidación)

| Capacidad backend | Uso frontend | Gap |
|-------------------|--------------|-----|
| `POST /internal/torneos/partidos/finalizar/` | `finishMatch` existe, UI no lo llama | Resultados no se cargan vía planilla |
| `POST .../partidos/reprogramar/` | `rescheduleMatch` sin callers | Reprogramación solo vía edit genérico |
| `sets_data` JSON | Lectura parcial; escritura incompleta (TODO backend) | Standings frágiles |
| Dashboard `pending_actions` | `PendingAlerts` importado, no renderizado | Alertas duplicadas/manuales |
| Colisiones de fixture en API | Sin UI de conflicto | ADMIN descubre errores tarde |
| Court CRUD completo | Solo GET en `courtService` | Canchas no gestionables en UI |
| `is_federated` | Seed/métricas | Sin gate de negocio |
| API pública clubes/equipos | Landing mock + “Próximamente” | Escaparate vacío |
| Soft-delete campos | Casi no usados | Datos “borrados” inconsistentes |
| Roles REFEREE/SCORER | Nav mínima | No hay puesto de trabajo |
| `/inscripciones` | Fuera del nav | Feature huérfana |
| Links invitación + mail | Mail frágil sin SMTP | Onboarding a medias |
| `/public/organizaciones/` | Uso escaso / URLs hardcodeadas | Tenant público infrautilizado |

---

## Anexo B — Roadmap sugerido (90 días)

| Horizonte | Entregables |
|-----------|-------------|
| **Días 1–30** | Planilla de sets + cola del día; fix puente login landing↔platform; Navbar/roles operativos; permisos backend críticos; env secrets; activar `PendingAlerts` |
| **Días 31–60** | Fixture asistido; inscripciones dentro de torneo; unificar setup de club; directorio público de clubes; header/footer únicos; design tokens + densidad UI |
| **Días 61–90** | Notificaciones; recuperación de clave; exports PDF/CSV; Court UI; Docker + README; tests de standings/colisiones; multi-tenant hardening |

---

*Documento generado a partir de análisis multipasada de estructura, backend (`core` / `internal` / `public`) y frontends (`landing` / `platform`). No incluye cambios de código fuente.*
