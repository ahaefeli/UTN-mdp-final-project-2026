# Walkthrough: Conexión API en Explorar Torneos, Sincronización de Contacto y Enlaces de Reglamento

Hemos refactorizado con éxito el componente de **Explorar Torneos** (`landing/src/app/torneos/page.js`) y el backend de Django (`backend/internal/views/tournaments.py`) para consumir datos reales de la base de datos aplicando los filtros correspondientes desde el servidor. Asimismo, sincronizamos el Navbar y el Footer de la página de **Contacto** (`landing/src/app/contacto/page.js`), configuramos los enlaces reales de descarga en la página de **Reglamento** (`landing/src/app/reglamento/page.js`), y eliminamos la sección redundante de **Documentación Institucional**.

---

## 🛠️ Cambios Realizados

### 1. Backend: Soporte de Parámetros y Acceso Público

#### [MODIFY] [tournaments.py](file:///c:/Users/monic/Documents/GitHub/UTN-mdp-final-project-2026/backend/internal/views/tournaments.py)
* **Acceso Público para GET**: Se sobrescribió el método `dispatch` en `TournamentView` para derivar las solicitudes `GET` directamente al despachador base de Django (`View.dispatch`), salteándose el decorador `@jwt_required` (autenticación obligatoria) de `BaseCrudView`. El resto de métodos (`POST`, `PUT`, `DELETE`) conservan la seguridad JWT intacta.
* **Filtros por Query Parameters**: Se añadió soporte en el método `get` para filtrar por:
  * `search` (búsqueda parcial en el nombre del torneo).
  * `liga` (búsqueda parcial en el nombre de la organización/liga).
  * `rama` (mapea `"Femenino"` a `"FEMALE"` y `"Masculino"` a `"MALE"`).
  * `categoria` (mapea valores del front como `"Sub-14"` a `"SUB_14"`, `"Primera"` a `"PRIMERA"`, etc.).
* **Nombre de la Organización**: Se actualizó la función `serialize_tournament` para incluir el atributo `organization_name` en la respuesta JSON, lo cual es necesario para renderizar la ubicación del torneo en la UI.

---

### 2. Frontend: Refactorización de la Vista de Torneos

#### [MODIFY] [page.js](file:///c:/Users/monic/Documents/GitHub/UTN-mdp-final-project-2026/landing/src/app/torneos/page.js)
* **Nuevos Estados**: Se incorporaron los estados `tournaments` (`[]`), `isLoading` (`true`) y `error` (`null`).
* **Eliminación de Mock Data**: Se eliminó el array vacío local `mockTournaments` y toda la lógica local de filtrado (`filteredTournaments` y su `.filter()`), delegando esta tarea por completo al backend.
* **Llamada Dinámica a la API (useEffect)**:
  * Se implementé un hook `useEffect` dependiente de `[searchTerm, selectedLiga, selectedRama, selectedCategoria]`.
  * Se limpia cada filtro cuyo valor sea el por defecto (`"Todas"`), evitando enviarlo como parámetro.
  * La URL se construye dinámicamente apuntando a `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/internal'}/torneos/`.
* **Mapeo de Datos**:
  * Se mapean las propiedades de la respuesta JSON a los campos requeridos por las tarjetas (`title`, `category`, `badgeText`, `badgeType`, `dateInfo`, `locationInfo`, `buttonText`, `image` e `href`).
  * Los estados del torneo (`IN_PROGRESS`, `PREPARATION`, `FINISHED`) se mapean a badges visuales claros (`EN DISPUTA` con tipo `live` animado, `PRÓXIMAMENTE` con tipo `upcoming`, etc.).
* **Renderizado Condicional**:
  * **Cargando**: Mientras `isLoading` sea `true`, se muestra un spinner animado de Tailwind y la leyenda *"Cargando torneos..."*.
  * **Error**: Si la API falla, se muestra un banner rojo informativo con el detalle del error.
  * **Grilla**: Al cargar correctamente, se itera sobre `tournaments` para pintar las tarjetas.
  * **Vacío**: Si la lista está vacía tras cargar, se conserva el diseño original del *Empty State* con borde discontinuo e información de ayuda.

---

### 3. Frontend: Sincronización de la Página de Contacto

#### [MODIFY] [page.js](file:///c:/Users/monic/Documents/GitHub/UTN-mdp-final-project-2026/landing/src/app/contacto/page.js)
* **Navbar**:
  * Se eliminó el enlace obsoleto a `"Resultados"` tanto de la navegación principal para desktop como del menú desplegable móvil.
  * Se mantiene la marca `"VOLEYHUB"` en la cabecera.
* **Footer**:
  * Se reemplazaron todas las referencias a `"LIGA NECOCHENSE DE VOLEY"` por la marca `"VOLEYHUB"`, tanto en el bloque principal del logotipo del pie de página como en la sección inferior de copyright.
  * Se validó que el tamaño de fuente de la descripción (`text-xs`) coincida armónicamente con el tamaño de fuente empleado para las listas de navegación de los enlaces del pie de página (`text-xs`).

---

### 4. Frontend: Enlaces Reales en la Página de Reglamento

#### [MODIFY] [page.js](file:///c:/Users/monic/Documents/GitHub/UTN-mdp-final-project-2026/landing/src/app/reglamento/page.js)
* **Eliminación de la simulación**: Se eliminó la función `handleDownload` y los eventos `onClick` de alerta simulada.
* **Conversión a enlaces `<a>`**:
  * Se convirtieron los botones `<button>` de reglamentos generales y las tarjetas envolventes `<div>` de formularios a etiquetas HTML de enlace directo `<a>`.
  * Se conservaron todas las clases originales de Tailwind (`className`) para no alterar el diseño visual e interactivo.
* **Asignación de Rutas PDF**:
  * Se configuraron los atributos `href` de cada enlace apuntando a su archivo real en la carpeta `public/docs/`:
    * *Reglamento Oficial de Juego 2026*: `/docs/reglamento_juego_2026.pdf`
    * *Código de Penas y Disciplina*: `/docs/codigo_penas_2023.pdf`
    * *Lista de Buena Fe*: `/docs/lista_buena_fe.pdf`
    * *Pase de Jugador*: `/docs/pase_jugador.pdf`
    * *Planilla de Partido*: `/docs/planilla_partido.pdf`
* **Comportamiento seguro**: Se agregaron los atributos `target="_blank"` y `rel="noopener noreferrer"` en todos los enlaces para asegurar la apertura directa en una nueva pestaña del navegador.
* **Remoción de la sección de Documentos Institucionales**:
  * Se eliminó por completo el contenedor JSX (`section`) que contenía el título "Documentación Institucional" y sus tarjetas de "Estatuto LNV" y "Manual de Marca".
  * Se limpiaron los datos estáticos de la sección (`institucional` del mock data) para evitar código muerto.
  * Se removieron las importaciones no utilizadas en la cabecera (se eliminó el ícono `Landmark` de la librería `lucide-react`).
  * Se verificó la consistencia del layout: el espaciado inferior general se mantiene intacto mediante la clase `py-10` en el contenedor `<main>`, previniendo que las tarjetas superiores queden pegadas al Footer.

---

## 🧪 Verificación Realizada

### 1. Compilación Exitosa
* Ejecutamos `npm run build` en el subdirectorio `landing` y el proyecto Next.js compiló perfectamente todas sus páginas públicas y administrativas sin warnings ni errores.
