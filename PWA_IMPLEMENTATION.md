# 📱 Implementación PWA Mobile-First - Flip

## ✅ Fase 1: Configuración Base y Navegación (COMPLETADO)

### 1. PWA - Configuración Base

**Archivos creados/modificados:**
- ✅ `apps/web/next.config.ts` - Configurado con @ducanh2912/next-pwa
- ✅ `apps/web/public/manifest.json` - Manifest con nombre "Flip", color #185FA5
- ✅ `apps/web/src/app/layout.tsx` - Meta tags PWA agregados

**Características:**
- Service Worker configurado con NetworkFirst strategy
- Cache offline para 200 entradas
- Manifest con shortcuts a Inventario, Préstamos, Reservas
- Theme color #185FA5
- Soporte para íconos 192x192 y 512x512 (pendiente crear imágenes)
- Deshabilitado en desarrollo, habilitado en producción

**Módulos offline (configurados):**
- Inventario (lectura)
- Préstamos (lectura + registro en cola)
- Reservas (lectura)
- Dashboard (métricas cacheadas)

---

### 2. Sistema de Navegación Móvil

**Componentes creados:**

#### `apps/web/src/components/mobile/bottom-nav.tsx`
- Bottom navigation fija con 4-5 ítems
- Botón central "Nuevo" elevado (-18px) con border-radius 14px
- Color #185FA5 con borde blanco de 3px
- Aparece solo en módulos específicos (Inventario, Reservas, Préstamos)
- Oculto en desktop (lg:hidden)
- Safe area support para dispositivos con notch

#### `apps/web/src/components/mobile/mobile-drawer.tsx`
- Drawer lateral con overlay oscuro
- Abre con swipe desde izquierda (pendiente implementar gesture)
- Contiene todos los módulos del sistema
- Avatar y nombre de usuario en header
- Indicador visual de página activa
- Footer con versión e institución
- Previene scroll del body cuando está abierto

#### `apps/web/src/components/mobile/mobile-topbar.tsx`
- Topbar con título de página (17px, font-weight 500)
- Botón de menú (izquierda)
- Avatar del usuario (derecha, opcional)
- Botones de búsqueda/filtro (opcionales)
- Safe area support
- Sticky top con z-index 40

**Layout actualizado:**
- ✅ `apps/web/src/app/(dashboard)/layout.tsx`
  - Integra BottomNav, MobileDrawer
  - Padding bottom en main (pb-20 lg:pb-0)
  - Lógica para mostrar/ocultar botón central según ruta
  - Event listener para click en botón central

**Sidebar actualizado:**
- ✅ `apps/web/src/components/sidebar.tsx`
  - Oculto en móvil (hidden lg:flex)
  - Sin cambios en funcionalidad desktop

**Estilos globales:**
- ✅ `apps/web/src/app/globals.css`
  - Safe area utilities (.safe-area-pt, .safe-area-pb, etc.)
  - Touch improvements (tap-highlight, min-height 44px)

---

## 🎨 Breakpoints Utilizados

```css
lg: 1024px  /* Desktop - muestra sidebar, oculta bottom nav */
md: 768px   /* Tablet - ajustes intermedios */
< 1024px    /* Móvil - oculta sidebar, muestra bottom nav */
```

---

## 🎯 Navegación Móvil - Comportamiento

### Bottom Nav Items:
1. **Inicio** → `/dashboard`
2. **Inventario** → `/inventory`
3. **●NUEVO●** → Botón central (solo en Inventario, Reservas, Préstamos)
4. **Reservas** → `/reservations`
5. **Personal** → `/staff`

### Drawer Items:
- Dashboard
- Inventario
- Préstamos
- Reservas
- Reuniones
- Personal
- Configuración

---

## 📦 Dependencias Instaladas

```json
{
  "@ducanh2912/next-pwa": "^latest"
}
```

---

## ✅ Fase 2: Dashboard Móvil (COMPLETADO)

### Componentes Creados

**`apps/web/src/features/dashboard/components/mobile-dashboard-header.tsx`**
- Header con saludo personalizado (Buenos días/tardes/noches)
- Nombre del usuario (primer nombre)
- Fecha actual en español
- Avatar del usuario (derecha)
- Badge de institución con punto verde animado

**`apps/web/src/features/dashboard/components/mobile-metrics-grid.tsx`**
- Grid 2x2 de métricas principales
- Cards con íconos de colores (azul, verde, ámbar, púrpura)
- Métricas: Reservas semana, Equipos inventario, Préstamos activos, Docentes staff
- Links a cada módulo correspondiente
- Hover states con border color #185FA5

**`apps/web/src/features/dashboard/components/mobile-overdue-alert.tsx`**
- Alerta naranja para préstamos que vencen hoy
- Solo se muestra si count > 0
- Ícono de advertencia
- Link directo a préstamos con filtro overdue
- Diseño con fondo ámbar y borde

**`apps/web/src/features/dashboard/components/mobile-quick-actions.tsx`**
- Fila de 4 acciones rápidas con íconos grandes
- Botones circulares de colores (azul, verde, púrpura, ámbar)
- Acciones: Nuevo préstamo, Buscar equipo, Reservar aula, Ver inventario
- Tamaño táctil 56x56px (14x14 con padding)

**`apps/web/src/features/dashboard/components/mobile-recent-activity.tsx`**
- Lista de últimas 5 actividades
- Íconos por tipo (préstamo, reserva, inventario, personal)
- Timestamp relativo (hace X minutos/horas)
- Separadores de 0.5px entre items
- Mock data incluido para testing

### Dashboard Page Actualizado

**`apps/web/src/app/(dashboard)/dashboard/page.tsx`**
- Versión móvil completamente separada (lg:hidden)
- Versión desktop sin cambios (hidden lg:block)
- Integra todos los componentes móviles
- Stats dinámicos desde institution data
- Responsive y optimizado para touch

### Características Implementadas

✅ Header con saludo personalizado según hora del día
✅ Badge de institución con punto verde animado
✅ Grid 2x2 de métricas con colores distintivos
✅ Alerta naranja condicional para préstamos vencidos
✅ 4 acciones rápidas con íconos grandes y táctiles
✅ Lista de actividad reciente (últimas 5 acciones)
✅ Separación completa entre móvil y desktop
✅ Sin cambios en funcionalidad desktop existente

---

## ✅ Fase 3: Reservas Móvil (COMPLETADO)

### Componentes Creados

**`apps/web/src/components/mobile/bottom-sheet.tsx`**
- Componente base reutilizable para bottom sheets
- Handle visual (barra gris 36x4px) para swipe
- Swipe to dismiss con detección táctil
- Max height configurable (default 85vh)
- Border radius 16px 16px 0 0
- Overlay oscuro con tap to close
- Previene scroll del body cuando está abierto

**`apps/web/src/features/reservations/components/mobile-shift-selector.tsx`**
- Selector Mañana/Tarde con diseño pill
- Tabs con fondo redondeado
- Activo en color #185FA5
- Transiciones suaves

**`apps/web/src/features/reservations/components/mobile-week-strip.tsx`**
- Strip horizontal de días de la semana
- Scroll horizontal con auto-scroll a hoy
- Navegación prev/next con flechas
- Día actual destacado en #185FA5
- Sticky top para mantener visible
- Formato compacto: Lun 15, Mar 16, etc.

**`apps/web/src/features/reservations/components/mobile-schedule-view.tsx`**
- Vista vertical de horario por horas
- Grid 3 columnas para días
- Bloques de color por tipo:
  - Azul: Sesión de clase
  - Verde: Proyecto/Taller
  - Ámbar: Gestión y otros
- Celdas vacías muestran "Disponible"
- Min-height 80px para touch
- Ring indicator para día actual
- Muestra staff y título en cada slot

**`apps/web/src/features/reservations/components/mobile-new-reservation-sheet.tsx`**
- Bottom sheet para nueva reserva
- Chips táctiles seleccionables con checkmark
- Secciones: Propósito, Área curricular, Grado, Sección
- Botones de 44px min-height
- Color #185FA5 para selección
- Botón "Confirmar reserva" al fondo
- Reset automático al cerrar

### Características Implementadas

✅ Selector Mañana/Tarde como tabs pill
✅ Strip de días horizontal con scroll
✅ Vista de horario vertical por horas
✅ Bloques de color por tipo de reserva
✅ Celdas vacías con estado "Disponible"
✅ Bottom sheet con swipe to dismiss
✅ Chips táctiles para selección
✅ Botón confirmar al fondo del sheet
✅ Touch-friendly (min 44px height)
✅ Auto-scroll a día actual

---

## 🚀 Próximos Pasos

### Fase 3: Reservas Móvil ✅ COMPLETADO
- [x] Selector Mañana/Tarde (tabs pill)
- [x] Strip horizontal de días (scroll)
- [x] Vista de horario vertical
- [x] Bloques de color por tipo (Azul/Verde/Ámbar)
- [x] Bottom sheet para nueva reserva
- [x] Chips táctiles para selección

### Fase 4: Bottom Sheets Globales
- [ ] Componente base de bottom sheet
- [ ] Handle visual (barra gris 36x4px)
- [ ] Swipe to dismiss
- [ ] Max height 85vh
- [ ] Border radius 16px 16px 0 0
- [ ] Convertir modales existentes

### Fase 5: Componentes Táctiles
- [ ] Chips seleccionables
- [ ] Listas con separadores 0.5px
- [ ] Remover hover states en móvil
- [ ] Asegurar min-height 44px en todos los interactivos

### Fase 6: Performance
- [ ] Agregar prefetch={false} en Links del sidebar (✅ YA HECHO)
- [ ] Promise.all en página de reservas para llamadas paralelas
- [ ] Optimizar imágenes
- [ ] Lazy loading de componentes pesados

### Fase 7: Íconos PWA
- [ ] Crear icon-192x192.png
- [ ] Crear icon-512x512.png
- [ ] Agregar a public/

---

## 🧪 Testing

### Desktop (≥ 1024px)
- [x] Sidebar visible
- [x] Bottom nav oculto
- [x] Sin cambios en funcionalidad existente

### Móvil (< 1024px)
- [x] Sidebar oculto
- [x] Bottom nav visible y fijo
- [x] Botón central elevado en rutas correctas
- [x] Drawer abre/cierra correctamente
- [ ] Swipe gesture para abrir drawer (pendiente)
- [ ] Safe area en dispositivos con notch (pendiente testing real)

---

## 📝 Notas Técnicas

### Color Principal
- **#185FA5** - Azul institucional usado en:
  - Botón central del bottom nav
  - Items activos en navegación
  - Theme color del manifest
  - Íconos y acentos

### Z-Index Layers
- `z-50` - Bottom nav y drawer
- `z-40` - Mobile topbar
- `z-[100]` - Trial banner
- `z-[99999]` - Tooltips y popovers

### Event System
- Custom event `mobile-center-button-click` para comunicación entre layout y páginas
- Cada página debe escuchar este evento para abrir su modal/sheet correspondiente

---

## 🔧 Configuración Recomendada

### Vercel Deployment
```bash
# Root Directory
apps/web

# Build Command
pnpm build

# Install Command
pnpm install
```

### Environment Variables
```env
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false
NODE_ENV=production
```

---

## 📚 Referencias

- [Next PWA Docs](https://github.com/DuCanhGH/next-pwa)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Safe Area Insets](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [Touch Target Size](https://web.dev/accessible-tap-targets/)
