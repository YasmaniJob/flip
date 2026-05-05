# 🔍 Debug: ¿Por qué no veo el menú móvil?

## Posibles Causas

### 1. Estás viendo la versión desktop
El menú móvil solo aparece cuando el ancho de la ventana es **menor a 1024px**.

**Cómo verificar:**
1. Abre DevTools (F12)
2. En la consola, escribe:
   ```javascript
   window.innerWidth
   ```
3. Si el resultado es ≥ 1024, estás en desktop

**Solución:**
- Presiona Ctrl+Shift+M (Cmd+Shift+M en Mac) para activar el modo responsive
- O arrastra la ventana del navegador para hacerla más pequeña
- O en DevTools, selecciona un dispositivo móvil del dropdown

### 2. El componente no se está renderizando

**Cómo verificar:**
1. Abre DevTools
2. Ve a la pestaña Elements/Elementos
3. Busca (Ctrl+F) por "lg:hidden"
4. Deberías ver el div con clase "lg:hidden bg-background min-h-screen"

**Si NO lo ves:**
- El componente no se está renderizando
- Puede ser un error de JavaScript
- Revisa la consola por errores

### 3. Hay un error de JavaScript

**Cómo verificar:**
1. Abre la consola (F12 → Console)
2. Busca errores rojos
3. Si hay errores, cópialos y compártelos

### 4. El CSS no se está aplicando

**Cómo verificar:**
1. En DevTools, inspecciona el botón de menú
2. Verifica que tenga las clases correctas
3. Verifica que `lg:hidden` esté funcionando

## 🧪 Prueba Rápida

Abre la consola y ejecuta esto:

```javascript
// Ver el ancho actual
console.log('Ancho:', window.innerWidth);

// Ver si el componente móvil existe
console.log('Componente móvil:', document.querySelector('.lg\\:hidden'));

// Forzar apertura del drawer
window.dispatchEvent(new Event('open-mobile-drawer'));
```

## 📱 Pasos para Ver el Menú Móvil

1. **Abre el navegador en modo responsive:**
   - Chrome: F12 → Ctrl+Shift+M
   - Firefox: F12 → Ctrl+Shift+M
   - Edge: F12 → Ctrl+Shift+M

2. **Selecciona un dispositivo:**
   - iPhone 12 Pro (390px)
   - iPhone SE (375px)
   - Pixel 5 (393px)
   - O custom: 375px de ancho

3. **Recarga la página:**
   - Ctrl+R o F5

4. **Deberías ver:**
   - Botón de menú (☰) arriba a la izquierda
   - Saludo en el centro
   - Avatar a la derecha
   - Bottom nav abajo

## 🎯 Verificación Visual

### Desktop (≥ 1024px):
```
┌─────────────────────────────────────┐
│ [Sidebar]  │  Dashboard Content     │
│            │                        │
│            │  ¡Hola, Usuario!       │
│            │                        │
└─────────────────────────────────────┘
```

### Móvil (< 1024px):
```
┌─────────────────────────────────────┐
│ ☰  Buenos días, Usuario      [👤]  │
│                                     │
│ [Métricas Grid 2x2]                 │
│                                     │
│ [Acciones Rápidas]                  │
│                                     │
│ [Actividad Reciente]                │
│                                     │
│ [🏠] [📦] [📅] [👥]  ← Bottom Nav  │
└─────────────────────────────────────┘
```

## 🔧 Si Aún No Funciona

1. **Limpia el cache:**
   ```bash
   # En la terminal
   cd apps/web
   rm -rf .next
   pnpm dev
   ```

2. **Verifica que el servidor esté corriendo:**
   - Deberías ver "Ready in X ms" en la terminal
   - La URL debería ser http://localhost:3000

3. **Verifica que estés logueado:**
   - El dashboard requiere autenticación
   - Si no estás logueado, te redirige a /login

4. **Toma un screenshot:**
   - De lo que ves actualmente
   - De la consola (si hay errores)
   - Del inspector de elementos

## 💡 Tip Rápido

Si quieres ver SOLO la versión móvil sin importar el ancho:

1. Abre: `apps/web/src/features/dashboard/components/mobile-dashboard-header.tsx`
2. Cambia temporalmente:
   ```tsx
   // De esto:
   <div className="lg:hidden px-4 pt-6 pb-4">
   
   // A esto:
   <div className="px-4 pt-6 pb-4">
   ```
3. Guarda y recarga

Esto mostrará el header móvil siempre (incluso en desktop) para que puedas verificar que funciona.

**IMPORTANTE:** Revierte este cambio después de probar.
