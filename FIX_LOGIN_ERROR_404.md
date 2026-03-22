# 🔧 Fix: Error de Login - 404 en Better Auth

**Fecha:** 22 de Marzo, 2026  
**Error:** 404 en `/api/auth/sign-in/email`  
**Causa:** `NEXT_PUBLIC_APP_URL` no coincide con la URL real de Vercel

---

## ❌ Errores Detectados

Según la consola del navegador:
```
404 GET https://flip-web-uqsh.vercel.app/api/auth/sign-in/email
404 POST https://flip-web-uqsh.vercel.app/api/auth/sign-in/email
403 POST https://flip-web-uqsh.vercel.app/api/auth/sign-in/email (Forbidden)
```

---

## 🔍 Causa del Problema

Better Auth usa `NEXT_PUBLIC_APP_URL` para configurar:
1. `baseURL` - URL base de la aplicación
2. `trustedOrigins` - Orígenes permitidos para CORS

Si `NEXT_PUBLIC_APP_URL` no coincide con la URL real, Better Auth rechaza las peticiones.

**En tu caso:**
- Variable configurada: `https://flip-v2.vercel.app` (probablemente)
- URL real de Vercel: `https://flip-web-uqsh.vercel.app`

---

## ✅ Solución

### Paso 1: Verificar la URL Real

Tu URL de Vercel es: **`https://flip-web-uqsh.vercel.app`**

### Paso 2: Actualizar Variable de Entorno

1. Ve a **Vercel Dashboard**
2. Click en tu proyecto
3. **Settings → Environment Variables**
4. Busca `NEXT_PUBLIC_APP_URL`
5. Click en **Edit** (los 3 puntos)
6. Cambia el valor a: `https://flip-web-uqsh.vercel.app`
7. **Save**

### Paso 3: Redeploy

1. Ve a **Deployments**
2. Click en los 3 puntos del último deployment
3. Click en **Redeploy**
4. Espera 2-3 minutos

---

## 🎯 Verificación Post-Fix

Después del redeploy:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Network**
3. Intenta hacer login
4. Verifica que las peticiones a `/api/auth/*` devuelvan **200** (no 404)

---

## 📝 Configuración Correcta de Better Auth

En `apps/web/src/lib/auth/index.ts`:

```typescript
export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  // ...
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
  ].filter(Boolean) as string[],
});
```

**Importante:** `NEXT_PUBLIC_APP_URL` debe ser EXACTAMENTE la URL de Vercel.

---

## 🔄 Alternativa: Usar Variable de Entorno Dinámica

Si quieres que funcione automáticamente sin configurar la URL:

### Opción 1: Usar VERCEL_URL (Recomendado)

Vercel proporciona automáticamente `VERCEL_URL`. Podemos usarla:

```typescript
const baseURL = process.env.NEXT_PUBLIC_APP_URL 
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
```

### Opción 2: Detectar Automáticamente

```typescript
const baseURL = typeof window !== 'undefined' 
  ? window.location.origin 
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
```

---

## ⚠️ Importante

- `NEXT_PUBLIC_*` variables son visibles en el cliente
- Deben configurarse en Vercel Dashboard
- Requieren redeploy para aplicarse
- Deben coincidir EXACTAMENTE con la URL de Vercel

---

## 🎯 Resumen

1. **Problema:** URL configurada no coincide con URL real
2. **Solución:** Actualizar `NEXT_PUBLIC_APP_URL` a `https://flip-web-uqsh.vercel.app`
3. **Acción:** Redeploy después de actualizar
4. **Verificación:** Login debe funcionar sin errores 404

---

**Siguiente paso:** Actualizar la variable de entorno en Vercel Dashboard
