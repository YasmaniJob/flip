# 📱 Guía de Desarrollo Móvil - Flip

## 🎯 Principios de Diseño

### Mobile-First
- Diseñar primero para móvil (< 1024px)
- Desktop como extensión, no al revés
- Usar breakpoint `lg:` (1024px) para mostrar/ocultar

### Touch-Friendly
- Mínimo 44x44px para elementos interactivos
- Espaciado generoso entre elementos táctiles
- Sin hover states en móvil
- Feedback visual inmediato al tocar

### Performance
- Lazy loading de componentes pesados
- Imágenes optimizadas
- Cache offline para módulos principales
- Promise.all para llamadas paralelas

---

## 🧩 Componentes Móviles Disponibles

### Navegación

#### `<BottomNav />`
```tsx
import { BottomNav } from "@/components/mobile/bottom-nav";

<BottomNav 
  showCenterButton={true}
  onCenterButtonClick={() => {
    // Abrir modal/sheet de nueva acción
  }}
/>
```

**Props:**
- `showCenterButton?: boolean` - Mostrar botón central elevado
- `onCenterButtonClick?: () => void` - Handler para botón central

**Uso:**
- Se muestra automáticamente en < 1024px
- Oculto en desktop (lg:hidden)
- Items: Inicio, Inventario, Nuevo (opcional), Reservas, Personal

#### `<MobileDrawer />`
```tsx
import { MobileDrawer } from "@/components/mobile/mobile-drawer";

<MobileDrawer 
  open={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

**Props:**
- `open: boolean` - Estado del drawer
- `onClose: () => void` - Handler para cerrar

**Características:**
- Overlay oscuro con tap-to-close
- Swipe desde izquierda (pendiente implementar)
- Previene scroll del body
- Muestra todos los módulos del sistema

#### `<MobileTopbar />`
```tsx
import { MobileTopbar } from "@/components/mobile/mobile-topbar";

<MobileTopbar 
  title="Dashboard"
  onMenuClick={() => setDrawerOpen(true)}
  showAvatar={true}
  showSearch={false}
  showFilter={false}
/>
```

**Props:**
- `title: string` - Título de la página
- `onMenuClick: () => void` - Handler para abrir drawer
- `showAvatar?: boolean` - Mostrar avatar del usuario
- `showSearch?: boolean` - Mostrar botón de búsqueda
- `showFilter?: boolean` - Mostrar botón de filtro
- `onSearchClick?: () => void` - Handler para búsqueda
- `onFilterClick?: () => void` - Handler para filtro

---

### Bottom Sheets

#### `<BottomSheet />`
```tsx
import { BottomSheet } from "@/components/mobile/bottom-sheet";

<BottomSheet
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Nueva reserva"
  maxHeight="85vh"
>
  {/* Contenido del sheet */}
</BottomSheet>
```

**Props:**
- `open: boolean` - Estado del sheet
- `onClose: () => void` - Handler para cerrar
- `title: string` - Título del sheet
- `children: React.ReactNode` - Contenido
- `maxHeight?: string` - Altura máxima (default: 85vh)

**Características:**
- Handle visual para swipe
- Swipe-to-dismiss
- Overlay con tap-to-close
- Border radius 16px arriba
- Previene scroll del body

---

### Dashboard Móvil

#### `<MobileDashboardHeader />`
```tsx
import { MobileDashboardHeader } from "@/features/dashboard/components/mobile-dashboard-header";

<MobileDashboardHeader 
  userName="Juan Pérez"
  institutionName="Colegio San Carlos"
/>
```

#### `<MobileMetricsGrid />`
```tsx
import { MobileMetricsGrid } from "@/features/dashboard/components/mobile-metrics-grid";

<MobileMetricsGrid 
  stats={{
    weekReservations: 12,
    totalResources: 45,
    activeLoans: 8,
    totalStaff: 23
  }}
/>
```

#### `<MobileQuickActions />`
```tsx
import { MobileQuickActions } from "@/features/dashboard/components/mobile-quick-actions";

<MobileQuickActions />
```

#### `<MobileRecentActivity />`
```tsx
import { MobileRecentActivity } from "@/features/dashboard/components/mobile-recent-activity";

<MobileRecentActivity activities={activities} />
```

---

### Reservas Móvil

#### `<MobileShiftSelector />`
```tsx
import { MobileShiftSelector } from "@/features/reservations/components/mobile-shift-selector";

<MobileShiftSelector 
  selectedShift="mañana"
  onShiftChange={(shift) => setShift(shift)}
/>
```

#### `<MobileWeekStrip />`
```tsx
import { MobileWeekStrip } from "@/features/reservations/components/mobile-week-strip";

<MobileWeekStrip 
  weekDates={weekDates}
  currentWeekStart={currentWeekStart}
  onNavigate={(direction) => navigateWeek(direction)}
/>
```

#### `<MobileScheduleView />`
```tsx
import { MobileScheduleView } from "@/features/reservations/components/mobile-schedule-view";

<MobileScheduleView 
  pedagogicalHours={hours}
  weekDates={weekDates}
  slotMap={slotMap}
  onSlotClick={(slot, date, hourId) => handleClick(slot, date, hourId)}
/>
```

---

## 🎨 Clases CSS Útiles

### Safe Area
```tsx
// Para dispositivos con notch
<div className="safe-area-pt">  {/* padding-top */}
<div className="safe-area-pb">  {/* padding-bottom */}
<div className="safe-area-pl">  {/* padding-left */}
<div className="safe-area-pr">  {/* padding-right */}
```

### Responsive
```tsx
// Ocultar en móvil, mostrar en desktop
<div className="hidden lg:block">

// Mostrar en móvil, ocultar en desktop
<div className="lg:hidden">

// Padding bottom para bottom nav
<main className="pb-20 lg:pb-0">
```

### Touch
```tsx
// Elementos táctiles (automático en < 1024px)
// Min 44x44px aplicado globalmente

// Remover tap highlight
className="tap-highlight-transparent"
```

---

## 🔧 Eventos Globales

### Abrir Drawer
```tsx
// Desde cualquier componente
window.dispatchEvent(new Event('open-mobile-drawer'));
```

### Botón Central Click
```tsx
// Escuchar en la página
useEffect(() => {
  const handler = () => {
    // Abrir modal/sheet
  };
  window.addEventListener('mobile-center-button-click', handler);
  return () => window.removeEventListener('mobile-center-button-click', handler);
}, []);
```

---

## 📐 Breakpoints

```css
/* Tailwind breakpoints */
sm: 640px   /* Tablet pequeño */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop - PRINCIPAL */
xl: 1280px  /* Desktop grande */
2xl: 1536px /* Desktop extra grande */
```

**Uso principal:**
- `< 1024px` = Móvil (mostrar bottom nav, ocultar sidebar)
- `≥ 1024px` = Desktop (mostrar sidebar, ocultar bottom nav)

---

## 🎨 Colores

### Principal
- `#185FA5` - Azul institucional
- Usar en: botones activos, highlights, botón central

### Semánticos
```tsx
// Reservas
bg-blue-50 dark:bg-blue-950/30      // Sesión de clase
bg-emerald-50 dark:bg-emerald-950/30 // Taller/Proyecto
bg-amber-50 dark:bg-amber-950/30     // Gestión/Otro

// Estados
bg-card           // Fondo de tarjetas
bg-muted          // Fondo secundario
text-foreground   // Texto principal
text-muted-foreground // Texto secundario
border-border     // Bordes
```

---

## ✅ Checklist para Nuevas Páginas Móviles

- [ ] Crear versión móvil separada con `lg:hidden`
- [ ] Mantener versión desktop con `hidden lg:block`
- [ ] Agregar `MobileTopbar` si es necesario
- [ ] Usar `BottomSheet` en lugar de modales
- [ ] Elementos interactivos mínimo 44x44px
- [ ] Usar chips táctiles en lugar de dropdowns
- [ ] Agregar padding bottom (pb-20) para bottom nav
- [ ] Probar en diferentes tamaños de pantalla
- [ ] Verificar safe-area en dispositivos con notch
- [ ] Sin hover states en móvil
- [ ] Transiciones suaves (transition-all)

---

## 🚀 Performance Tips

### Lazy Loading
```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { loading: () => <div>Cargando...</div> }
);
```

### Parallel Fetching
```tsx
// ❌ Secuencial (lento)
const classrooms = await fetchClassrooms();
const hours = await fetchHours();
const staff = await fetchStaff();

// ✅ Paralelo (rápido)
const [classrooms, hours, staff] = await Promise.all([
  fetchClassrooms(),
  fetchHours(),
  fetchStaff()
]);
```

### Prefetch Control
```tsx
// Deshabilitar prefetch en sidebar
<Link href="/page" prefetch={false}>
```

---

## 🐛 Debugging

### Ver en móvil desde desktop
1. Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Seleccionar dispositivo o custom size
3. Probar touch events y gestures

### PWA Testing
1. Build: `pnpm build`
2. Start: `pnpm start`
3. Chrome → DevTools → Application → Manifest
4. Verificar service worker y cache

### Safe Area Testing
- Usar simulador iOS con notch
- O agregar CSS temporal: `padding-top: 44px`

---

## 📚 Recursos

- [Tailwind Docs](https://tailwindcss.com/docs)
- [Next.js PWA](https://github.com/DuCanhGH/next-pwa)
- [Touch Target Size](https://web.dev/accessible-tap-targets/)
- [Safe Area Insets](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
