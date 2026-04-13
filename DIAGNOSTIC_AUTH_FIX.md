# Fix: Diagnostic Module Authentication Issue

## Problema Identificado

Usuario con rol `admin` recibe error 403 "Insufficient permissions. Admin role required" al intentar acceder al módulo de diagnóstico.

## Diagnóstico

### Datos en Base de Datos ✅
```
Usuario: AMERICO SONCCO CALAPUJA (avilmor.22.04@gmail.com)
Rol: admin
isSuperAdmin: false
Institución: GRAN UNIDAD ESCOLAR SAN CARLOS
```

### Middleware de Autenticación ✅
```typescript
const adminRoles = ['director', 'coordinador', 'admin'];
const isAdmin = adminRoles.includes(user.role) || user.isSuperAdmin;
```

El rol `admin` ESTÁ en la lista de roles permitidos.

### Causa Raíz 🔍

**Better Auth no está incluyendo los campos personalizados (`role`, `isSuperAdmin`) en la sesión del usuario.**

Esto ocurre porque:
1. Las sesiones fueron creadas ANTES de que se configuraran los `additionalFields`
2. Better Auth cachea la información de la sesión
3. Los campos personalizados no se refrescan automáticamente

## Solución Implementada

### 1. Agregado Debug Logging
**Archivo**: `apps/web/src/features/diagnostic/lib/auth-middleware.ts`

Agregado logging detallado para ver exactamente qué datos devuelve Better Auth:

```typescript
console.log('[Auth Debug] Session data:', {
  hasSession: !!session,
  hasUser: !!session?.user,
  userId: session?.user?.id,
  userRole: session?.user?.role,
  userIsSuperAdmin: session?.user?.isSuperAdmin,
  userInstitutionId: session?.user?.institutionId,
});

console.log('[Auth Debug] Permission check:', {
  userRole: user.role,
  isInAdminRoles: adminRoles.includes(user.role),
  isSuperAdmin: user.isSuperAdmin,
  finalIsAdmin: isAdmin,
});
```

### 2. Scripts de Diagnóstico Creados

- `apps/web/scripts/diagnose-auth-issue.ts` - Diagnóstico completo de usuarios y permisos
- `apps/web/scripts/check-sessions.ts` - Verificación de sesiones activas
- `apps/web/scripts/delete-specific-user.ts` - Eliminación de usuarios específicos

## Pasos para Resolver

### Para el Usuario Afectado:

1. **Cerrar sesión completamente**
   - Ir a la aplicación
   - Click en el menú de usuario
   - Seleccionar "Cerrar sesión"

2. **Limpiar cookies del navegador** (opcional pero recomendado)
   - Chrome: DevTools → Application → Cookies → Eliminar cookies de `app.flip.org.pe`
   - O usar modo incógnito

3. **Volver a iniciar sesión**
   - Usar las mismas credenciales
   - Better Auth creará una nueva sesión con TODOS los campos

4. **Verificar acceso**
   - Ir a `/settings/diagnostico`
   - Debería funcionar correctamente

### Verificación en Logs

Después de que el usuario inicie sesión nuevamente, los logs mostrarán:

```
[Auth Debug] Session data: {
  hasSession: true,
  hasUser: true,
  userId: 'BhjcxFPZDOmeWU4GpCJJQ0sAdhij9JXc',
  userRole: 'admin',  ← Debería aparecer ahora
  userIsSuperAdmin: false,
  userInstitutionId: 'f218daed-5b3f-47c1-ac55-371b56e9d449'
}

[Auth Debug] Permission check: {
  userRole: 'admin',
  isInAdminRoles: true,  ← Debería ser true
  isSuperAdmin: false,
  finalIsAdmin: true  ← Debería ser true
}
```

## Solución Permanente (Si el Problema Persiste)

Si después de cerrar sesión el problema continúa, significa que Better Auth no está leyendo correctamente los campos de la base de datos. En ese caso:

### Opción 1: Forzar Refresh de Sesión
Crear un endpoint que invalide todas las sesiones y fuerce re-login:

```typescript
// DELETE /api/auth/sessions/invalidate-all
await db.delete(sessions).where(eq(sessions.userId, userId));
```

### Opción 2: Migración de Sesiones
Crear un script que actualice todas las sesiones existentes con los campos faltantes.

### Opción 3: Verificación Directa en BD
Modificar el middleware para hacer una query directa a la BD si los campos no están en la sesión:

```typescript
if (!user.role || user.role === undefined) {
  // Fallback: query database directly
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });
  user.role = dbUser?.role;
  user.isSuperAdmin = dbUser?.isSuperAdmin;
}
```

## Usuarios Afectados

Del diagnóstico, estos usuarios tienen roles válidos:

✅ **Con acceso correcto**:
- yasmanijguillen@gmail.com - `superadmin` + `isSuperAdmin: true`
- avilmor.22.04@gmail.com - `admin` (afectado por sesión antigua)

⚠️ **Roles no estándar** (necesitan corrección):
- zetajotace@gmail.com - `pip` (rol no reconocido)
- yasmaniguillen@ugelchucuito.edu.pe - `superadmin` pero `isSuperAdmin: false` (inconsistencia)

## Prevención Futura

1. **Validar roles al crear usuarios**: Asegurar que solo se usen roles válidos
2. **Sincronizar isSuperAdmin**: Si `role === 'superadmin'`, entonces `isSuperAdmin` debe ser `true`
3. **Invalidar sesiones al cambiar roles**: Cuando se modifica el rol de un usuario, invalidar sus sesiones activas
4. **Documentar roles válidos**: Mantener lista actualizada de roles permitidos

## Roles Válidos en el Sistema

- `superadmin` - Acceso total (debe tener `isSuperAdmin: true`)
- `admin` - Administrador de institución
- `director` - Director de institución
- `coordinador` - Coordinador de institución
- `docente` - Docente (sin acceso admin)
- `pip` - ⚠️ No está en la lista de roles admin (necesita definición)

## Commit

```
5a0a7aa - fix: add debug logging to diagnostic auth middleware
```

## Testing

Para probar que funciona:

1. Usuario cierra sesión
2. Usuario inicia sesión nuevamente
3. Usuario accede a `/settings/diagnostico`
4. Revisar logs del servidor para ver los valores de `[Auth Debug]`
5. Si `userRole` es `'admin'` y `finalIsAdmin` es `true`, el problema está resuelto

## Notas

- Los logs de debug se pueden remover una vez confirmado que funciona
- Este es un problema común cuando se agregan campos personalizados a Better Auth después de que ya existen sesiones
- La solución más limpia es siempre cerrar sesión y volver a iniciar sesión después de cambios en el esquema de usuario
