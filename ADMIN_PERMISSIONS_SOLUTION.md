# Admin Permissions Solution

## Problema

Usuario con `role: 'admin'` no puede aprobar/rechazar sesiones de diagnóstico, recibiendo error 403.

## Verificación Realizada

```bash
pnpm dotenv -e .env.local -- tsx scripts/check-user-by-email.ts yasmaniguillen@ugelchucuito.edu.pe
```

**Resultado**:
```
📋 User Details:
   Name: Yasmani Guillén
   Email: yasmaniguillen@ugelchucuito.edu.pe
   Role: admin ✅
   isSuperAdmin: false
   Institution ID: 906d1149-9fea-4868-aeb2-d633f2de5b69

🔐 Permission Check:
   Role in adminRoles: true ✅
   isSuperAdmin flag: false
   Has admin access: ✅ YES

✅ User SHOULD have access to:
   - Diagnostic module configuration
   - Approve/reject diagnostic sessions
   - View diagnostic results
```

## Análisis

1. **Base de datos**: ✅ Usuario tiene `role: 'admin'` correctamente
2. **Middleware**: ✅ Incluye 'admin' en adminRoles
3. **Endpoints**: ✅ Usan `verifyAdminAccess` que acepta admins
4. **Problema**: ❌ Sesión no actualizada con el nuevo rol

## Causa Raíz

El usuario completó el onboarding y se le asignó `role: 'admin'` en la base de datos, pero:
- La sesión de Better Auth NO se actualizó automáticamente
- Better Auth está sirviendo la sesión vieja desde caché
- La sesión vieja tiene el rol anterior (probablemente 'docente')

## Solución

El usuario necesita hacer **logout y login** para que Better Auth cree una nueva sesión con el rol actualizado.

### Pasos para el Usuario

1. Hacer clic en el menú de usuario (esquina superior derecha)
2. Seleccionar "Cerrar sesión"
3. Volver a iniciar sesión con sus credenciales
4. Intentar aprobar/rechazar sesiones de diagnóstico nuevamente

### Verificación Post-Login

Después del login, la sesión tendrá:
```javascript
{
  user: {
    id: "...",
    email: "yasmaniguillen@ugelchucuito.edu.pe",
    role: "admin", // ✅ Actualizado
    institutionId: "906d1149-9fea-4868-aeb2-d633f2de5b69"
  }
}
```

## Permisos de Admin

Los usuarios con `role: 'admin'` tienen acceso completo a:

### Módulo de Diagnóstico
- ✅ Configurar diagnóstico (habilitar/deshabilitar, mensaje personalizado)
- ✅ Ver sesiones pendientes
- ✅ Aprobar sesiones individuales
- ✅ Rechazar sesiones individuales
- ✅ Aprobar todas las sesiones en lote
- ✅ Rechazar todas las sesiones en lote
- ✅ Ver resultados de diagnóstico
- ✅ Gestionar preguntas personalizadas

### Otros Módulos
- ✅ Gestión de personal (staff)
- ✅ Gestión de recursos (inventario)
- ✅ Gestión de préstamos
- ✅ Gestión de reservaciones
- ✅ Configuración de la institución

## Prevención Futura

El código ya está corregido para forzar logout después del onboarding:

```typescript
// apps/web/src/app/(onboarding)/onboarding/page.tsx
if (result.requiresReauth) {
    const { authClient } = await import('@/lib/auth-client');
    await authClient.signOut(); // ✅ Fuerza logout
    window.location.href = '/login?message=onboarding_complete';
    return;
}
```

Nuevos usuarios que completen el onboarding serán forzados a hacer login nuevamente, evitando este problema.

## Scripts de Verificación

### Verificar usuario específico
```bash
pnpm dotenv -e .env.local -- tsx scripts/check-user-by-email.ts <email>
```

### Verificar todos los admins
```bash
pnpm dotenv -e .env.local -- tsx scripts/check-admin-users.ts
```

## Resumen

- ✅ Base de datos correcta
- ✅ Middleware correcto
- ✅ Endpoints correctos
- ❌ Sesión desactualizada

**Solución**: Usuario debe hacer logout/login para actualizar sesión.
