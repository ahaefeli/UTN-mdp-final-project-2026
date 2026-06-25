# Reporte de Auditoría Frontend: Nuevos Accesos Rápidos (ADMIN)

## 1. Corrección Conceptual y Auditoría Estructural
Aunque en `page.js` existe un comentario ` {/* Sección Acciones Rápidas */} `, el código no está inline sino modularizado. La renderización de estos botones ocurre en un componente dedicado ubicado en `platform/src/components/QuickActions/QuickActions.js`.

**Error Conceptual Detectado:** 
Mencionaste el uso de *Bootstrap Icons* (clases `bi-person-badge`, etc.). Sin embargo, la auditoría revela que el componente actual utiliza **Lucide React** (`lucide-react`) para la iconografía y mapea los botones dinámicamente a través de un array de objetos (`const actions = [...]`).

## 2. Ubicación del Bloque
El código debe inyectarse directamente en el archivo `platform/src/components/QuickActions/QuickActions.js`.

No se necesita crear JSX crudo para cada botón; el componente ya cuenta con un motor de mapeo. Solo necesitamos:
1. Importar los nuevos íconos de `lucide-react` (ej. `BadgeCheck` y `ClipboardList`).
2. Agregar los dos nuevos objetos al array `actions`.

## 3. Código JSX a Inyectar

**Modificación 1: Actualizar los imports (Línea 3)**
Reemplaza la importación de `lucide-react` actual por esta:
```javascript
import { Trophy, Users, ShieldPlus, BadgeCheck, ClipboardList } from 'lucide-react';
```

**Modificación 2: Expandir el array `actions` (Línea 9)**
Inserta los dos nuevos objetos al final del array `actions`, calcando la estructura de atributos (`label`, `icon`, `path`, `description`, `colorClass`):

```javascript
  const actions = [
    // ... (Mantener los 3 objetos existentes: Torneo, Usuarios, Clubes) ...
    {
      label: 'Crear nuevo club',
      icon: ShieldPlus,
      path: '/clubes',
      description: 'Genera invitaciones para registrar nuevos clubes.',
      colorClass: styles.greenIcon
    },
    // --- CÓDIGO A INYECTAR: NUEVOS ACCESOS RÁPIDOS ---
    {
      label: 'Gestión de Árbitros',
      icon: BadgeCheck,
      path: '/arbitros',
      description: 'Administra inscripciones y designaciones arbitrales.',
      colorClass: styles.orangeIcon 
    },
    {
      label: 'Gestión de Planilleros',
      icon: ClipboardList,
      path: '/planilleros',
      description: 'Administra y designa a los encargados de mesa.',
      colorClass: styles.blueIcon 
    }
  ];
```
*(Nota: Se reutilizaron las clases CSS `styles.orangeIcon` y `styles.blueIcon` presentes en el módulo para mantener la consistencia cromática, ya que el componente mapea estas variables CSS).*
