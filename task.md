# Checklist de Tareas: Conexión API en Explorar Torneos, Contacto y Reglamentos

- `[x]` Crear nuevos estados para la API (`tournaments`, `isLoading`, `error`) en `landing/src/app/torneos/page.js`
- `[x]` Implementar `useEffect` con dependencias `[searchTerm, selectedLiga, selectedRama, selectedCategoria]` en `landing/src/app/torneos/page.js`
- `[x]` Construir dinámicamente URL params descartando valores `"Todas"` en la llamada a la API
- `[x]` Modificar el backend en `backend/internal/views/tournaments.py` para admitir búsqueda por `search`, `liga`, `rama` y `categoria`, y permitir acceso GET público (bypasseando `jwt_required`)
- `[x]` Eliminar el arreglo local `mockTournaments` y la lógica de filtrado cliente
- `[x]` Actualizar renderizado en el JSX con control de estados (Loading, Error, Tarjetas y Empty State)
- `[x]` Sincronizar el Navbar de la página de Contacto (`landing/src/app/contacto/page.js`) removiendo el enlace de "Resultados" (en escritorio y móvil) y manteniendo la marca "VOLEYHUB"
- `[x]` Sincronizar el Footer de la página de Contacto (`landing/src/app/contacto/page.js`) reemplazando "LIGA NECOCHENSE DE VOLEY" con "VOLEYHUB" (en el logo y copyright)
- `[x]` Reemplazar la funcionalidad de descarga simulada (`handleDownload`) por enlaces HTML estáticos reales (`<a>`) en `landing/src/app/reglamento/page.js`
- `[x]` Configurar los atributos `href` apuntando a `/docs/reglamento_juego_2026.pdf`, `/docs/codigo_penas_2023.pdf`, `/docs/lista_buena_fe.pdf`, `/docs/pase_jugador.pdf` y `/docs/planilla_partido.pdf`
- `[x]` Configurar `target="_blank"` y `rel="noopener noreferrer"` en todos los enlaces de descarga para abrirlos en una pestaña nueva
- `[x]` Eliminar la sección "Documentación Institucional" (y sus datos "Estatuto LNV" y "Manual de Marca") de `landing/src/app/reglamento/page.js`
- `[x]` Limpiar imports de íconos en `landing/src/app/reglamento/page.js` (remover `Landmark` de `lucide-react`)
- `[x]` Verificar compilación del frontend `landing` con `npm run build`
