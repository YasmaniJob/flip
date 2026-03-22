# 🔍 Diagnóstico Profundo: Error de Login en Vercel

**Fecha:** 22 de Marzo, 2026  
**Problema:** Login falla con error "invalid origin" (400 Bad Request)

---

## 🎯 Problema Identificado

El error "invalid origin" indica que Better Auth está rechazando las peticiones porque el origen (origin) de la petición no coincide con la configuración esperada.

### Errores Observados

```
400 Bad Request - invalid origin
Failed to load resource: the server responded with a status of 400
```

---

## 🔍 Análisis del Problema

### 1. Configuración de URLs

Better Auth necesita que el `baseURL` del servidor coincida con el origen de las peticiones del cliente.

**Servidor (Better Auth):**
- Usa `process.env.NEXT_PUBLIC_APP_URL` o `process.env.VERCEL_URL`
- Configurado en `apps/web/src/lib/auth/index.ts`

**Cliente (Browser):**
- Usa `window.location.origin` en el navegador
- Configurado en `apps/web/src/lib/auth-client.ts`

### 2. El Problema con `trustedOrigins`

Better Auth valida que las peticiones vengan de orígenes confiables:

- `trustedOrigins: []` → Rechaza TODOS los orígenes ❌
- `trustedOrigins: ['*']` → No es válido en Better Auth ❌
- Sin `trustedOrigins` → Usa comportamiento por defecto (same-origin) ✅

### 3. Variables de Entorno en Vercel

Vercel proporciona automáticamente:
- `VERCEL_URL`: URL del deployment (sin `https://`)
- `NEXT_PUBLIC_APP_URL`: Debe configurarse manualmente

---

## 🛠️ Soluciones Implementadas

### Intento 1: Usar VERCEL_URL automáticamente

```typescript
const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
};
```

**Resultado:** No funcionó porque `trustedOrigins` estaba mal configurado.

### Intento 2: Deshabilitar validación de orígenes

```typescript
trustedOrigins: []  // ❌ Esto rechaza TODO
```

**Resultado:** Empeoró el problema.

### Intento 3: Eliminar `trustedOrigins` completamente

```typescript
// Sin trustedOrigins - usa comportamiento por defecto
export const auth = betterAuth({
  baseURL,
  // ... resto de configuración
  // NO incluir trustedOrigins
});
```

**Resultado:** En prueba... ⏳

---

## 📊 Comportamiento Esperado

Con la configuración actual:

1. **En Vercel:**
   - `baseURL` = `https://flip-web-uqsh.vercel.app` (desde `VERCEL_URL`)
   - Cliente hace peticiones a `https://flip-web-uqsh.vercel.app/api/auth/*`
   - Better Auth acepta porque es same-origin

2. **En Local:**
   - `baseURL` = `http://localhost:3000`
   - Cliente hace peticiones a `http://localhost:3000/api/auth/*`
   - Better Auth acepta porque es same-origin

---

## 🔄 Próximos Pasos

### Si el problema persiste:

1. **Verificar logs de Vercel:**
   - Dashboard → Deployments → Runtime Logs
   - Buscar los console.log que agregamos:
     ```
     [Better Auth] Base URL: ...
     [Better Auth] VERCEL_URL: ...
     [Better Auth] NEXT_PUBLIC_APP_URL: ...
     ```

2. **Verificar conexión a base de datos:**
   - El error 400 también puede ser por fallo de conexión a PostgreSQL
   - Verificar que `DATABASE_URL` esté correctamente configurada en Vercel

3. **Verificar tablas de Better Auth:**
   - Asegurar que las tablas existen en Neon:
     - `users`
     - `sessions`
     - `accounts`
     - `verification`

---

## 🎯 Configuración Actual

### Variables de Entorno en Vercel

```env
DATABASE_URL=postgresql://neondb_owner:****@ep-jolly-wave-acz30twt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
TURSO_DATABASE_URL=libsql://flip-v2-yasmanijob.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=eyJ...
BETTER_AUTH_SECRET=4quRwA5VPAYmkvBkUWC4fsmQITeyypueF4b8yLKBp18=
NEXT_PUBLIC_APP_URL=https://flip-web-uqsh.vercel.app
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false
```

### Archivos Modificados

1. `apps/web/src/lib/auth/index.ts`
   - Detección automática de `baseURL`
   - Logging para debugging
   - Eliminado `trustedOrigins`

2. `apps/web/next.config.ts`
   - Expone `VERCEL_URL` al servidor

---

## 📝 Notas Importantes

- Better Auth es muy estricto con CORS por seguridad
- `VERCEL_URL` no incluye el protocolo `https://`
- `NEXT_PUBLIC_*` variables son visibles en el cliente
- Las peticiones del cliente deben ir al mismo origen que `baseURL`

---

**Estado:** En prueba después del último deploy
**Commit:** `ca26642` - Remove trustedOrigins to use Better Auth default behavior
