# Página de Nueva Reserva Móvil

## Cambio de Arquitectura

Se cambió de modal a página dedicada para móvil por las siguientes razones:

1. **Simplicidad**: Una página es más simple que un modal fullscreen
2. **Funcionalidad nativa**: Navegación estándar con router.push/back
3. **Sin conflictos**: No hay problemas de z-index, overlays o eventos táctiles
4. **Mejor UX**: Comportamiento esperado en móviles (back button funciona)

## Archivos Modificados

### Nueva Página
- `apps/web/src/app/(dashboard)/reservaciones/nueva/page.tsx`
  - Página dedicada para crear reservas en móvil
  - Recibe parámetros por URL: `classroomId` y `slots`
  - Grid 2 columnas para docentes frecuentes (máximo 6)
  - Inputs con `py-3` y `text-base` para mejor táctil
  - Navegación con `router.back()` y `router.push()`

### Cliente de Reservaciones
- `apps/web/src/app/(dashboard)/reservaciones/reservaciones-client.tsx`
  - `handleOpenDialog()` ahora detecta móvil (`window.innerWidth < 1024`)
  - En móvil: navega a `/reservaciones/nueva` con params
  - En desktop: abre modal como antes

## Flujo Móvil

1. Usuario selecciona slots en calendario móvil
2. Click en botón "Crear Reserva"
3. `handleOpenDialog()` detecta móvil
4. Navega a `/reservaciones/nueva?classroomId=X&slots=[...]`
5. Página muestra wizard de 2 pasos
6. Al crear: `router.push('/reservaciones')` regresa al calendario

## Características

- **Paso 1**: Selección de docente (búsqueda + frecuentes) y propósito
- **Paso 2**: Detalles opcionales (área, grado, sección, propósito)
- **Docentes frecuentes**: Grid 2x3 (6 docentes máximo)
- **Búsqueda**: Debounce 300ms, muestra hasta 20 resultados
- **Validación**: Botón "Siguiente" deshabilitado sin docente y propósito
- **Safe area**: Footer con `paddingBottom: calc(1rem + env(safe-area-inset-bottom))`

## Componente Modal (Deprecado en Móvil)

- `mobile-reservation-wizard.tsx` ya NO se usa en móvil
- Se mantiene para desktop si es necesario
- Puede eliminarse si solo se usa en móvil
