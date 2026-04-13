# SaaS Role Architecture Fix

## Problema Identificado

El sistema estaba creando múltiples usuarios con `role: 'superadmin'` - uno por cada institución creada. Esto violaba la arquitectura SaaS donde solo debe haber 1 superadmin (el dueño de la plataforma).

## Arquitectura Correcta

### Roles en el Sistema
1. **1 Superadmin** = Dueño de la plataforma SaaS
   - `role: 'superadmin'`
   - `isSuperAdmin: true`
   - Acceso completo a toda la plataforma

2. **N Admins** = Administradores de instituciones
   - `role: 'admin'`
   - `isSuperAdmin: false`
   - Acceso admin a su propia institución

3. **N Docentes/Otros** = Usuarios regulares
   - `role: 'docente'` (u otros)
   - `isSuperAdmin: false`
   - Acceso limitado

### Flujo de Onboarding

**Caso 1: Usuario crea NUEVA institución**
```
Usuario se registra → role: 'docente'
Usuario hace onboarding → CREA nueva IE → role: 'admin' ✅
```

**Caso 2: Usuario se une a institución EXISTENTE**
```
Usuario se registra → role: 'docente'
Usuario hace onboarding → SE UNE a IE existente → role: 'admin' ✅
```

## Cambios Implementados

### 1. Corregido Endpoint de Onboarding
**Archivo**: `apps/web/src/app/api/institutions/onboard/route.ts`

```typescript
// ANTES (INCORRECTO)
await tx.update(users).set({
  institutionId: newInst.id,
  role: 'superadmin', // ❌ Creaba múltiples superadmins
  isSuperAdmin: true,
})

// DESPUÉS (CORRECTO)
await tx.update(users).set({
  institutionId: newInst.id,
  role: 'admin', // ✅ Admin de su institución
})
```

### 2. Script de Migración de Datos
**Archivo**: `apps/web/scripts/fix-superadmin-to-admin.ts`

Convierte usuarios con `role: 'superadmin'` a `role: 'admin'`, EXCEPTO el primer usuario (dueño de la plataforma).

**Resultados de la Migración**:
```
👑 PLATFORM OWNER (kept as superadmin):
   Yasmani Guillén (yasmanijguillen@gmail.com)
   Institution: f218daed-5b3f-47c1-ac55-371b56e9d449

🔧 CONVERTED to admin:
   Yasmani Guillén (yasmaniguillen@ugelchucuito.edu.pe)
   Institution: 906d1149-9fea-4868-aeb2-d633f2de5b69

✅ Migration complete!
   Platform owner: 1 (kept as superadmin)
   Converted to admin: 1
```

### 3. Estado Final Verificado
```
📋 Yasmani Guillén (yasmanijguillen@gmail.com)
   role: 'superadmin' ✅
   isSuperAdmin: true ✅
   institutionId: f218daed-5b3f-47c1-ac55-371b56e9d449

📋 AMERICO SONCCO CALAPUJA (avilmor.22.04@gmail.com)
   role: 'admin' ✅
   isSuperAdmin: false ✅
   institutionId: f218daed-5b3f-47c1-ac55-371b56e9d449

📋 Yasmani Guillén (yasmaniguillen@ugelchucuito.edu.pe)
   role: 'admin' ✅
   isSuperAdmin: false ✅
   institutionId: 906d1149-9fea-4868-aeb2-d633f2de5b69
```

## Permisos en Módulo de Diagnóstico

El middleware de autenticación verifica:
```typescript
const adminRoles = ['director', 'coordinador', 'admin', 'superadmin'];
const isAdmin = adminRoles.includes(user.role) || user.isSuperAdmin;
```

**Usuarios con acceso**:
- ✅ Superadmin (dueño de la plataforma)
- ✅ Admins (administradores de instituciones)
- ✅ Directores
- ✅ Coordinadores

**Usuarios SIN acceso**:
- ❌ Docentes
- ❌ Otros roles no administrativos

## Testing

### Verificar Estado Actual
```bash
pnpm dotenv -e .env.local -- tsx scripts/check-admin-users.ts
```

### Test de Onboarding (Local)
1. Crear nuevo usuario
2. Completar onboarding creando nueva institución
3. Verificar que el usuario tiene `role: 'admin'` (NO superadmin)
4. Hacer logout y login
5. Acceder a `/settings/diagnostico`
6. Verificar acceso correcto sin errores 403

### Test de Usuario Existente
Para usuarios que ya tienen sesión activa:
1. Hacer logout
2. Hacer login nuevamente
3. Acceder a módulo de diagnóstico
4. Verificar acceso correcto

## Archivos Modificados

### Core Fix
- ✅ `apps/web/src/app/api/institutions/onboard/route.ts` - Asigna `role: 'admin'` en lugar de `superadmin`

### Scripts
- ✅ `apps/web/scripts/fix-superadmin-to-admin.ts` - Migración de datos (NUEVO)
- ✅ `apps/web/scripts/check-admin-users.ts` - Verificación de usuarios admin

### Middleware (ya estaba correcto)
- ✅ `apps/web/src/features/diagnostic/lib/auth-middleware.ts` - Incluye 'admin' en adminRoles

## Próximos Pasos

1. ✅ Código corregido
2. ✅ Datos migrados
3. ✅ Estado verificado
4. ⏳ Test local del flujo completo
5. ⏳ Commit y push cuando funcione en local

## Nota Importante

Esta es la arquitectura correcta para un SaaS multi-tenant:
- **1 superadmin** = Dueño de la plataforma (tú)
- **N admins** = Administradores de sus propias instituciones
- **N docentes** = Usuarios regulares

Cada institución tiene su propio admin, pero solo hay 1 superadmin en toda la plataforma.
