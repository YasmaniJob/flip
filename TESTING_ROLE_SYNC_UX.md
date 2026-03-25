# 🧪 PRUEBA DE SINCRONIZACIÓN DE ROLES CON MEJORAS DE UX

## 📋 Cambios Implementados

Se corrigió el problema donde al cambiar el rol de un staff member, el cambio no se reflejaba en la sesión del usuario. Además, se agregaron mejoras de UX para informar al usuario sobre el cambio.

### Archivos Modificados
1. `apps/web/src/app/api/staff/[id]/route.ts` - Backend
2. `apps/web/src/features/staff/hooks/use-staff.ts` - Hook de frontend
3. `apps/web/src/app/(auth)/login/page.tsx` - Página de login
4. `apps/web/src/lib/error-handler.ts` - Manejo de errores

---

## 🎯 Mejoras de UX Implementadas

### 1. Toast Informativo para el Admin
Cuando un admin cambia el rol de un usuario, ve un toast especial:

```
✅ Personal actualizado. El usuario deberá iniciar sesión nuevamente para ver los cambios.
```

### 2. Banner Informativo en Login
Cuando el usuario afectado es redirigido a login, ve:

- **Banner azul** con ícono de información
- **Título:** "Sesión expirada" o "Tu rol ha cambiado"
- **Descripción:** Explicación clara de por qué debe iniciar sesión

### 3. Toast al Cargar Login
Además del banner, se muestra un toast informativo azul con el mismo mensaje.

### 4. Redirección con Contexto
El error handler ahora redirige a `/login?session_expired=true` en lugar de solo `/login`, lo que activa los mensajes informativos.

---

## 🔄 Flujo Completo con UX Mejorada

```
┌─────────────────────────────────────────────────────────────┐
│ Admin cambia rol de "docente" a "admin"                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PATCH /api/staff/[id]                                        │
│ 1. Actualiza staff.role = "admin"                           │
│ 2. Actualiza users.role = "admin"                           │
│ 3. Elimina todas las sesiones del usuario                   │
│ 4. Retorna _meta.sessionsInvalidated = true                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Admin)                                             │
│ - Hook detecta _meta.sessionsInvalidated                    │
│ - Toast verde: "Personal actualizado. El usuario deberá     │
│   iniciar sesión nuevamente para ver los cambios."          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Usuario afectado (en otra ventana)                          │
│ - Próxima navegación detecta sesión inválida (401)          │
│ - Error handler espera 2 segundos                           │
│ - Redirige a /login?session_expired=true                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Página de Login                                              │
│ - Detecta ?session_expired=true                             │
│ - Muestra banner azul informativo                           │
│ - Muestra toast informativo                                 │
│ - Usuario entiende por qué debe re-loguearse                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Usuario vuelve a iniciar sesión                             │
│ - Better Auth crea nueva sesión                             │
│ - session.user.role = "admin" (nuevo rol)                   │
│ - Sidebar muestra opciones de admin                         │
│ - Badge muestra "Administrador"                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Cómo Probar

### Preparación
```bash
cd apps/web
pnpm dev
```

### Escenario de Prueba Completo

**Ventana 1 (Admin - TÚ):**
1. Loguéate como admin
2. Ve a `/personal`
3. Edita un docente que tenga cuenta de usuario
4. Cambia su rol de `docente` a `admin`
5. Guarda los cambios
6. **✅ VERIFICA:** Toast verde que dice "Personal actualizado. El usuario deberá iniciar sesión nuevamente para ver los cambios."

**Ventana 2 (Docente - Incógnito):**
1. Mantén la sesión del docente abierta
2. Después de que el admin guarde el cambio de rol
3. Intenta navegar a cualquier página (ej: `/dashboard`)
4. **✅ VERIFICA:** 
   - Después de ~2 segundos, redirigido a `/login?session_expired=true`
   - Banner azul visible con ícono de información
   - Título: "Sesión expirada"
   - Descripción: "Por seguridad, tu sesión ha expirado..."
   - Toast informativo azul

**Ventana 2 (Docente - Continúa):**
5. Lee el mensaje del banner
6. Vuelve a iniciar sesión con las mismas credenciales
7. **✅ VERIFICA:** 
   - Acceso a funciones de admin
   - Sidebar muestra: Inventario, Personal, Configuración
   - Badge de rol muestra "Administrador"

---

## ✅ Checklist de Verificación

### Backend
- [ ] `staff.role` se actualiza correctamente
- [ ] `users.role` se sincroniza
- [ ] Sesiones se eliminan de la tabla `sessions`
- [ ] Respuesta incluye `_meta.sessionsInvalidated = true`

### Frontend (Admin)
- [ ] Toast verde con mensaje especial cuando se invalidan sesiones
- [ ] Toast normal cuando NO se invalidan sesiones (staff sin cuenta)

### Frontend (Usuario Afectado)
- [ ] Redirigido a `/login?session_expired=true`
- [ ] Banner azul visible en la página de login
- [ ] Toast informativo azul al cargar
- [ ] Mensaje claro y comprensible

### Después del Re-login
- [ ] Nuevo rol aplicado correctamente
- [ ] Sidebar muestra opciones correctas
- [ ] Badge de rol actualizado
- [ ] Permisos funcionan correctamente

---

## 🎨 Elementos Visuales

### Toast del Admin (Verde)
```
✅ Personal actualizado. El usuario deberá iniciar sesión nuevamente para ver los cambios.
```

### Banner en Login (Azul)
```
ℹ️ Sesión expirada

Por seguridad, tu sesión ha expirado. Por favor, inicia sesión nuevamente.
```

### Toast en Login (Azul)
```
ℹ️ Sesión expirada

Tu sesión ha expirado. Por favor, inicia sesión nuevamente.
```

---

## 🐛 Casos Edge a Probar

### Caso 1: Staff sin cuenta de usuario
- Admin cambia rol de staff que NO tiene cuenta
- **Resultado:** Toast normal "Personal actualizado correctamente"
- **Razón:** No hay sesiones que invalidar

### Caso 2: Usuario con múltiples sesiones
- Usuario logueado en PC y móvil
- Admin cambia su rol
- **Resultado:** Ambas sesiones se invalidan
- **Verificar:** Ambos dispositivos redirigen a login

### Caso 3: Usuario no logueado
- Admin cambia rol de usuario que NO está logueado
- **Resultado:** Toast especial igual (por si acaso)
- **Verificar:** Próximo login del usuario muestra nuevo rol

### Caso 4: Cambio de rol sin cambiar email
- Admin actualiza otros campos pero NO el rol
- **Resultado:** Toast normal, sesiones NO se invalidan

---

## 📝 Notas Técnicas

### Parámetros URL Soportados
- `?session_expired=true` - Sesión expirada genérica
- `?role_changed=true` - Cambio de rol específico (futuro)

### Metadata en Respuesta API
```typescript
{
  ...updatedStaff,
  _meta: {
    userAccountUpdated: true,
    sessionsInvalidated: true,
    message: "El rol se actualizó correctamente. El usuario deberá iniciar sesión nuevamente para ver los cambios."
  }
}
```

### Detección en Hook
```typescript
if (response?._meta?.sessionsInvalidated) {
  showSuccess(response._meta.message || 'Mensaje por defecto');
}
```

---

## 🚀 Próximos Pasos

1. ✅ Probar todos los escenarios listados
2. ✅ Verificar que los mensajes son claros
3. ✅ Confirmar que no hay errores en consola
4. ✅ Probar en diferentes navegadores
5. ✅ Si todo funciona, hacer commit y push

---

## 💡 Mejoras Futuras (Opcional)

1. **WebSockets:** Notificación en tiempo real sin esperar navegación
2. **Countdown:** Mostrar "Sesión expirará en 5... 4... 3..."
3. **Historial:** Log de cambios de rol en la BD
4. **Email:** Enviar email al usuario notificando el cambio
