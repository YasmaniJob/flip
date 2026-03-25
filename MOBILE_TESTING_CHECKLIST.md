# 📱 Checklist de Pruebas Móviles - Local

## 🚀 Cómo Probar

1. **Iniciar el servidor de desarrollo:**
   ```bash
   cd apps/web
   pnpm dev
   ```

2. **Abrir en el navegador:**
   - URL: `http://localhost:3000`
   - Abrir DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M o Cmd+Shift+M)
   - Seleccionar un dispositivo móvil (ej: iPhone 12 Pro)

---

## ✅ Checklist de Verificación

### 1. Login Page
- [ ] La página carga sin errores
- [ ] No hay warnings de Suspense en consola
- [ ] El formulario funciona correctamente
- [ ] Puedes iniciar sesión

### 2. Dashboard Móvil (< 1024px)

#### Header
- [ ] Aparece el botón de menú (hamburger) a la izquierda
- [ ] Aparece el saludo personalizado (Buenos días/tardes/noches)
- [ ] Aparece el avatar del usuario a la derecha
- [ ] Aparece el badge de institución con punto verde

#### Métricas
- [ ] Se muestra el grid 2x2 de métricas
- [ ] Las métricas tienen colores correctos (azul, verde, ámbar, púrpura)
- [ ] Al hacer clic en una métrica, navega a la página correcta

#### Acciones Rápidas
- [ ] Se muestran 4 botones de acción
- [ ] Los botones tienen íconos y colores correctos
- [ ] Al hacer clic, navegan a las páginas correctas

#### Actividad Reciente
- [ ] Se muestra la lista de actividades
- [ ] Cada actividad tiene ícono, título, descripción y timestamp

### 3. Navegación Móvil

#### Bottom Navigation
- [ ] Aparece la barra inferior fija
- [ ] Tiene 5 items: Inicio, Inventario, Reservas, Personal
- [ ] El item activo se destaca en azul (#185FA5)
- [ ] Al hacer clic en cada item, navega correctamente:
  - Inicio → `/dashboard`
  - Inventario → `/inventario`
  - Reservas → `/reservaciones`
  - Personal → `/personal`

#### Drawer (Menú Lateral)
- [ ] Al hacer clic en el botón de menú (hamburger), se abre el drawer
- [ ] Aparece un overlay oscuro
- [ ] El drawer se desliza desde la izquierda
- [ ] Muestra el avatar y nombre del usuario
- [ ] Muestra todos los módulos:
  - Dashboard
  - Inventario
  - Préstamos
  - Reservas
  - Reuniones
  - Personal
  - Configuración
- [ ] Al hacer clic en un item, navega y cierra el drawer
- [ ] Al hacer clic en el overlay, cierra el drawer
- [ ] Al hacer clic en la X, cierra el drawer

### 4. Rutas Correctas

Verifica que estas rutas NO den 404:
- [ ] `/dashboard` - Funciona
- [ ] `/inventario` - Funciona
- [ ] `/reservaciones` - Funciona
- [ ] `/personal` - Funciona
- [ ] `/loans` - Funciona
- [ ] `/reuniones` - Funciona
- [ ] `/settings` - Funciona

### 5. Desktop (≥ 1024px)

- [ ] El sidebar aparece a la izquierda
- [ ] El bottom nav NO aparece
- [ ] El drawer NO aparece
- [ ] El dashboard muestra la versión desktop (sin componentes móviles)
- [ ] Todo funciona como antes

### 6. Responsive

Prueba cambiando el tamaño de la ventana:
- [ ] A 1023px: Aparece bottom nav, desaparece sidebar
- [ ] A 1024px: Aparece sidebar, desaparece bottom nav
- [ ] La transición es suave

### 7. Dark Mode

- [ ] Cambia a dark mode (botón en el sidebar/drawer)
- [ ] Todos los componentes móviles se ven bien en dark mode
- [ ] Los colores se adaptan correctamente

---

## 🐛 Errores Comunes a Verificar

### En Consola (DevTools)
- [ ] No hay errores rojos
- [ ] No hay warnings de Suspense
- [ ] No hay 404s en Network tab

### En UI
- [ ] No hay elementos superpuestos
- [ ] No hay scroll horizontal no deseado
- [ ] Los botones son táctiles (mínimo 44px)
- [ ] Las transiciones son suaves

---

## 🔧 Si Encuentras Problemas

### Problema: El drawer no se abre
**Solución:**
1. Abre la consola
2. Escribe: `window.dispatchEvent(new Event('open-mobile-drawer'))`
3. Si se abre, el problema es el botón. Si no, el problema es el listener.

### Problema: Rutas dan 404
**Verificar:**
1. La ruta en el código
2. La ruta real en `apps/web/src/app/(dashboard)/`
3. Que coincidan exactamente

### Problema: Bottom nav no aparece
**Verificar:**
1. Que el ancho de la ventana sea < 1024px
2. Que no haya errores en consola
3. Que el componente esté en el layout

### Problema: Componentes móviles no se ven
**Verificar:**
1. Que tengas `lg:hidden` en los componentes móviles
2. Que tengas `hidden lg:block` en los componentes desktop
3. Que el ancho sea < 1024px

---

## 📸 Screenshots Recomendados

Toma screenshots de:
1. Dashboard móvil completo
2. Drawer abierto
3. Bottom nav
4. Una página con el botón central (Inventario/Reservas)
5. Desktop para comparar

---

## ✅ Cuando Todo Funcione

1. Haz commit de los cambios:
   ```bash
   git add -A
   git commit -m "fix: correct mobile routes and add menu button"
   git push origin master
   ```

2. Verifica que el deploy en Vercel funcione

3. Prueba en un dispositivo real si es posible

---

## 📞 Notas

- Si algo no funciona, revisa la consola primero
- Los errores de TypeScript se muestran en el editor
- Los errores de runtime se muestran en la consola del navegador
- El hot reload puede tardar unos segundos

**Última actualización:** Después de corregir rutas y agregar botón de menú
