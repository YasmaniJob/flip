# Arquitectura Móvil - Sistema de Reservaciones

## Estado Actual del Código

### ✅ Completado

#### 1. Estructura Base
- **Separación móvil/desktop**: Código completamente separado con clases `lg:hidden` y `hidden lg:block`
- **Componentes móviles**: Todos en `apps/web/src/features/reservations/components/`
- **Hooks compartidos**: Lógica de negocio reutilizable entre móvil y desktop

#### 2. Calendario Principal (`reservaciones-client.tsx`)
```typescript
// Estructura:
// - Vista móvil: <div className="lg:hidden">
// - Vista desktop: <div className="hidden lg:block">
// - Hooks compartidos: useReservationsByDateRange, usePedagogicalHours
// - Estado compartido: selectedClassroomId, selectedShift, selectedSlots
```

**Características móviles implementadas:**
- Filtros de Aula y Turno en botones superiores
- MobileWeekStrip: Navegación horizontal de días
- MobileScheduleView: Vista de horarios del día seleccionado
- MobileReservationSheet: Bottom sheet para detalles de reserva
- SelectionActionBar: Barra flotante para crear reservas

**Calendario reducido a 5 días (Lun-Vie):**
```typescript
const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const weekDates = Array.from({ length: 5 }, ...);
const weekEnd = new Date(currentWeekStart).setDate(d.getDate() + 4);
```

#### 3. Modal de Reprogramación (`reschedule-dialog.tsx`)
**Diseño nativo móvil:**
```typescript
<DialogContent 
  className={cn(
    // Móvil: fullscreen desde abajo
    "w-[calc(100%-0rem)] max-w-none",
    "fixed inset-x-0 bottom-0 top-auto",
    "rounded-t-2xl max-h-[90vh]",
    "data-[state=open]:slide-in-from-bottom",
    
    // Desktop: centrado
    "lg:top-[50%] lg:left-[50%]",
    "lg:translate-x-[-50%] lg:translate-y-[-50%]",
    "lg:max-w-3xl lg:rounded-lg"
  )}
>
```

**Características:**
- Header sticky con título y descripción
- Contenido scrolleable con calendario semanal
- Footer sticky con botones full-width
- Filtrado por turno y aula
- Muestra horas ocupadas correctamente

#### 4. Página de Nueva Reserva (`reservaciones/nueva/page.tsx`)
**Arquitectura:**
- Página dedicada (no modal) para crear reservas en móvil
- Recibe parámetros por URL: `classroomId`, `slots`
- Grid 2 columnas para docentes frecuentes
- Inputs táctiles: `py-3`, `text-base`
- Footer fixed con `z-[101]`

#### 5. Hooks Optimizados (`use-reservations.ts`)
```typescript
// Refetch inmediato
useReservationsByDateRange: staleTime: 0

// Refetch después de mutaciones
useRescheduleBlock: {
  onSuccess: async () => {
    queryClient.invalidateQueries({ queryKey: reservationKeys.all });
    await queryClient.refetchQueries({ queryKey: reservationKeys.all });
  }
}
```

#### 6. Eliminaciones
- ❌ Drag and drop completamente removido
- ❌ DroppableCell eliminado (usar celdas `<td>` simples)
- ❌ Props de drag en ReservationCard
- ❌ Día Sábado del calendario

---

## Patrones de Diseño Establecidos

### 1. Separación Móvil/Desktop
```typescript
// ✅ CORRECTO
<div className="lg:hidden">
  {/* Código móvil */}
</div>

<div className="hidden lg:block">
  {/* Código desktop */}
</div>

// ❌ INCORRECTO - No mezclar
<div className="lg:flex-row flex-col">
  {/* Código compartido - evitar */}
</div>
```

### 2. Modales/Sheets Móviles
```typescript
// Patrón para modales nativos desde abajo:
<DialogContent 
  showCloseButton={false}
  className={cn(
    "w-[calc(100%-0rem)] max-w-none p-0 gap-0 flex flex-col",
    "fixed inset-x-0 bottom-0 top-auto translate-x-0 translate-y-0",
    "rounded-t-2xl border-t border-x-0 border-b-0",
    "max-h-[90vh]",
    "lg:inset-x-auto lg:top-[50%] lg:left-[50%]",
    "lg:max-w-3xl lg:rounded-lg lg:border"
  )}
>
  {/* Header sticky */}
  <div className="px-6 pt-6 pb-4 border-b border-border">
    <DialogHeader>...</DialogHeader>
  </div>

  {/* Contenido scrolleable */}
  <div className="flex-1 overflow-y-auto px-6 py-4">
    {/* Contenido */}
  </div>

  {/* Footer sticky */}
  <div className="px-6 py-4 border-t border-border">
    <DialogFooter className="flex-row gap-2">
      <Button className="flex-1">Cancelar</Button>
      <Button className="flex-1">Confirmar</Button>
    </DialogFooter>
  </div>
</DialogContent>
```

### 3. Navegación Móvil
```typescript
// Usar router.push para navegación entre páginas
const handleOpenDialog = () => {
  if (window.innerWidth < 1024) {
    const params = new URLSearchParams({...});
    router.push(`/ruta/nueva?${params.toString()}`);
  } else {
    setIsDialogOpen(true);
  }
};

// Usar router.back() para volver
<Button onClick={() => router.back()}>Volver</Button>
```

### 4. Componentes Táctiles
```typescript
// Inputs móviles
<Input className="py-3 text-base" /> // Mínimo 44px de altura

// Botones móviles
<Button className="py-3 px-4 text-base min-h-[44px]" />

// Grid táctil
<div className="grid grid-cols-2 gap-2"> // Máximo 2 columnas
```

---

## Estructura de Archivos

```
apps/web/src/
├── app/(dashboard)/reservaciones/
│   ├── page.tsx                          # Wrapper del cliente
│   ├── reservaciones-client.tsx          # ⭐ PRINCIPAL - Lógica completa
│   └── nueva/
│       └── page.tsx                      # Página móvil nueva reserva
│
├── features/reservations/
│   ├── components/
│   │   ├── mobile-week-strip.tsx         # Navegación días móvil
│   │   ├── mobile-schedule-view.tsx      # Vista horarios móvil
│   │   ├── mobile-reservation-sheet.tsx  # Bottom sheet detalles
│   │   ├── mobile-filter-sheet.tsx       # Sheet filtros
│   │   ├── reschedule-dialog.tsx         # ⭐ Modal reprogramar (responsive)
│   │   ├── reservation-card.tsx          # Card reserva (sin drag)
│   │   ├── reservation-popover.tsx       # Popover desktop
│   │   └── selection-action-bar.tsx      # Barra flotante selección
│   │
│   ├── hooks/
│   │   └── use-reservations.ts           # ⭐ Hooks compartidos
│   │
│   └── api/
│       └── reservations.api.ts           # API calls
│
└── components/
    ├── mobile/
    │   ├── notion-topbar.tsx             # Topbar móvil global
    │   ├── notion-menu.tsx               # Menú hamburguesa
    │   └── bottom-nav.tsx                # Navegación inferior
    │
    └── ui/
        └── dialog.tsx                    # Componente base Dialog
```

---

## Guía para Continuar

### 1. Agregar Nuevos Modales Móviles
```typescript
// Copiar estructura de reschedule-dialog.tsx
// Usar el patrón de DialogContent con clases responsive
// Mantener: Header sticky + Contenido scroll + Footer sticky
```

### 2. Agregar Nuevas Páginas Móviles
```typescript
// Crear en app/(dashboard)/[seccion]/nueva/page.tsx
// Usar router.push desde el componente principal
// Recibir parámetros por searchParams
// Footer fixed con z-[101]
```

### 3. Modificar Componentes Existentes
```typescript
// NO tocar la lógica de hooks
// NO mezclar código móvil/desktop
// Mantener separación con lg:hidden / hidden lg:block
// Usar clases responsive: text-sm lg:text-base
```

### 4. Testing Móvil
```bash
# Siempre probar en:
# 1. Chrome DevTools (iPhone 12 Pro, Pixel 5)
# 2. Ancho < 1024px (breakpoint lg)
# 3. Interacciones táctiles (click, scroll)
```

---

## Componentes Reutilizables

### MobileFilterSheet
```typescript
<MobileFilterSheet 
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Título"
  options={[{ id: '1', name: 'Opción 1' }]}
  selectedId={selectedId}
  onSelect={setSelectedId}
/>
```

### MobileReservationSheet
```typescript
<MobileReservationSheet 
  slot={slot}
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onCancel={() => {/* Lógica cancelar */}}
  onReschedule={() => {/* Lógica reprogramar */}}
  canManage={canManage}
/>
```

### SelectionActionBar
```typescript
<SelectionActionBar 
  selectedIds={selectedSlots.map(s => s.pedagogicalHourId)}
  onConfirm={handleOpenDialog}
  onClear={() => setSelectedSlots([])}
  isPending={false}
  isAdmin={canManage}
/>
```

---

## Convenciones de Código

### Clases Tailwind
```typescript
// Móvil primero, desktop después
"text-sm lg:text-base"
"p-4 lg:p-6"
"grid-cols-1 lg:grid-cols-2"

// Ocultar/mostrar
"lg:hidden"           // Solo móvil
"hidden lg:block"     // Solo desktop
"hidden lg:flex"      // Solo desktop (flex)
```

### Nombres de Variables
```typescript
// Móvil
const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
const [mobileSheetSlot, setMobileSheetSlot] = useState<ReservationSlot | null>(null);

// Desktop
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
```

### Handlers
```typescript
// Detectar móvil
const handleOpenDialog = () => {
  if (window.innerWidth < 1024) {
    // Lógica móvil
  } else {
    // Lógica desktop
  }
};

// Cerrar con delay para animación
onCancel={() => {
  setIsMobileSheetOpen(false);
  setTimeout(() => setConfirmCancelOpen(true), 300);
}}
```

---

## Próximos Pasos Sugeridos

### 1. Optimizaciones de Rendimiento
- [ ] Implementar React.memo en componentes móviles pesados
- [ ] Lazy loading de MobileScheduleView
- [ ] Virtualización de lista de horas pedagógicas (si >20 items)

### 2. Mejoras UX Móvil
- [ ] Gestos de swipe para cambiar de día
- [ ] Pull-to-refresh en calendario
- [ ] Haptic feedback en selección de slots
- [ ] Loading skeletons en lugar de spinners

### 3. Accesibilidad
- [ ] ARIA labels en todos los botones móviles
- [ ] Focus trap en modales
- [ ] Anuncios de screen reader para cambios de estado

### 4. Testing
- [ ] Tests unitarios de hooks
- [ ] Tests de integración de flujos móviles
- [ ] Tests E2E con Playwright (móvil)

---

## Notas Importantes

### ⚠️ NO Modificar
- `use-reservations.ts` - Hooks estables y optimizados
- `reservations.api.ts` - API calls funcionando correctamente
- Lógica de negocio en `reservaciones-client.tsx`

### ✅ Seguro Modificar
- Estilos y clases Tailwind
- Estructura de componentes móviles
- Animaciones y transiciones
- Textos y traducciones

### 🔄 Refactorizar Después
- Extraer lógica de filtros a custom hook
- Crear contexto para estado de reservaciones
- Separar `reservaciones-client.tsx` en componentes más pequeños

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build y verificar
npm run build

# Linting
npm run lint

# Type checking
npm run type-check

# Commit
git add -A
git commit -m "feat: descripción del cambio"
git push
```

---

## Contacto y Recursos

- **Documentación Tailwind**: https://tailwindcss.com/docs
- **Radix UI (Dialog)**: https://www.radix-ui.com/docs/primitives/components/dialog
- **React Query**: https://tanstack.com/query/latest/docs/react/overview
- **Next.js 15**: https://nextjs.org/docs

---

**Última actualización**: 2026-03-26
**Versión**: 1.0.0
**Estado**: Producción estable
