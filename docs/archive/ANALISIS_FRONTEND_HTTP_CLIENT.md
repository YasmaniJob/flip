# Análisis: Cliente HTTP del Frontend

**Fecha**: 2026-03-21  
**Objetivo**: Analizar cómo el frontend hace llamadas HTTP y determinar estrategia de migración

---

## 1. CONFIGURACIÓN DEL CLIENTE HTTP

### Cliente Principal: `apps/web/src/lib/api-client.ts`

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';

export function useApiClient() {
    const { data: session } = useSession();
    const token = session?.session?.token;

    const request = async <T>(endpoint: string, config: RequestConfig = {}): Promise<T> => {
        const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        };

        const response = await fetch(url, {
            ...config,
            headers,
            credentials: 'include', // CORS cookies
        });

        // ... manejo de errores
    };

    return { get, post, put, delete, patch };
}
```

**Características**:
- Hook React que usa Better Auth para obtener el token
- Agrega automáticamente `Authorization: Bearer ${token}`
- Usa `credentials: 'include'` para cookies CORS
- Construye URL completa: `BASE_URL + endpoint`

---

## 2. VARIABLES DE ENTORNO

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false
```

**Problema**: La URL apunta al backend NestJS en puerto 4000 con prefijo `/api/v1`

---

## 3. CONFIGURACIÓN DE NEXT.JS

### `apps/web/next.config.ts`

```typescript
async rewrites() {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
    const apiUrl = rawApiUrl.replace(/\/api\/v1\/?$/, '');
    
    return [
        {
            source: '/api/auth/:path*',
            destination: `${apiUrl}/api/auth/:path*`,
        },
        {
            source: '/api/v1/:path*',
            destination: `${apiUrl}/api/v1/:path*`,
        },
    ];
}
```

**Función**: Proxy de requests para evitar problemas CORS con cookies
- `/api/auth/*` → Backend NestJS (Better Auth)
- `/api/v1/*` → Backend NestJS (API REST)

---

## 4. PATRONES DE USO EN EL FRONTEND

### Patrón A: Fetch directo con `/api/v1/` (más común)

**Ejemplo**: `apps/web/src/features/loans/api/loans.api.ts`

```typescript
export const LoansApi = {
    getAll: async (params?: { page?: number, limit?: number }): Promise<Loan[]> => {
        const url = new URL('/api/v1/loans', window.location.origin);
        // ...
        const res = await fetch(url.toString(), { cache: 'no-store' });
        return res.json();
    },

    create: async (data: CreateLoanData): Promise<Loan> => {
        const res = await fetch('/api/v1/loans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    approve: async (id: string): Promise<Loan> => {
        const res = await fetch(`/api/v1/loans/${id}/approve`, {
            method: 'PATCH',
            // ...
        });
        return res.json();
    },
};
```

**Características**:
- Usa `fetch` directo (NO usa `useApiClient`)
- Rutas hardcodeadas con `/api/v1/`
- Manejo manual de errores
- Sin token automático (depende de cookies)

---

### Patrón B: Fetch directo con constante BASE_URL

**Ejemplo**: `apps/web/src/features/reservations/api/reservations.api.ts`

```typescript
const BASE_URL = '/api/v1/classroom-reservations';

export const ReservationsApi = {
    getByDateRange: async (startDate: string, endDate: string): Promise<ReservationSlot[]> => {
        let url = `${BASE_URL}?startDate=${startDate}&endDate=${endDate}`;
        const res = await fetch(url);
        return handleResponse<ReservationSlot[]>(res);
    },

    create: async (data: CreateReservationData): Promise<any> => {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<any>(res);
    },
};
```

**Características**:
- Constante local `BASE_URL = '/api/v1/...'`
- Helper `handleResponse` para manejo de errores
- Más organizado que Patrón A

---

### Patrón C: Meetings API (similar a B)

**Ejemplo**: `apps/web/src/features/meetings/api/meetings.api.ts`

```typescript
export const meetingsApi = {
    findAll: async (): Promise<Meeting[]> => {
        const res = await fetch('/api/v1/meetings');
        return handleResponse<Meeting[]>(res);
    },
    
    create: async (input: CreateMeetingInput): Promise<Meeting> => {
        const res = await fetch('/api/v1/meetings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
        return handleResponse<Meeting>(res);
    },
};
```

---

## 5. USO DE REACT QUERY

**Encontrado en**: `apps/web/src/features/inventory/components/wizard-step-2.tsx`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
const apiClient = useApiClient();

const createMutation = useMutation({
    mutationFn: async () => {
        const resourceData = { /* ... */ };
        return apiClient.post('/resources', resourceData);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
});
```

**Patrón**:
- React Query para cache y estado
- `useApiClient()` para hacer las llamadas
- Invalidación de queries después de mutaciones

---

## 6. PROBLEMA CRÍTICO IDENTIFICADO

### Estado Actual

```
Frontend API Clients → /api/v1/* → Rewrite en next.config.ts → Backend NestJS (puerto 4000)
```

### Endpoints Migrados

```
Nuevos Route Handlers → /api/* (Next.js App Router, mismo proceso)
```

### Conflicto

**Todos los API clients del frontend usan `/api/v1/`**, pero los nuevos endpoints están en `/api/`:

- ❌ Frontend llama: `/api/v1/loans`
- ✅ Endpoint migrado: `/api/loans`
- ❌ Frontend llama: `/api/v1/resources`
- ✅ Endpoint migrado: `/api/resources`
- ❌ Frontend llama: `/api/v1/meetings`
- ✅ Endpoint migrado: `/api/meetings`

**Resultado**: El frontend seguirá llamando al backend NestJS antiguo en puerto 4000.

---

## 7. MÓDULOS CON API CLIENTS IDENTIFICADOS

### Migrados (necesitan actualización):
1. **Loans**: `apps/web/src/features/loans/api/loans.api.ts`
   - `/api/v1/loans` → `/api/loans`
   - `/api/v1/loans/:id/approve` → `/api/loans/:id/approve`
   - `/api/v1/loans/:id/reject` → `/api/loans/:id/reject`

2. **Reservations**: `apps/web/src/features/reservations/api/reservations.api.ts`
   - `/api/v1/classroom-reservations` → `/api/classroom-reservations`
   - Múltiples sub-rutas (slots, attendance, tasks)

3. **Meetings**: `apps/web/src/features/meetings/api/meetings.api.ts`
   - `/api/v1/meetings` → `/api/meetings`
   - Sub-rutas de tasks

4. **Resources** (Inventory): Probablemente en `apps/web/src/features/inventory/`
   - `/api/v1/resources` → `/api/resources`

5. **Institutions**: Probablemente en `apps/web/src/features/settings/` o similar
   - `/api/v1/institutions` → `/api/institutions`

### Pendientes de migración:
- Staff
- Grades
- Classrooms
- Otros módulos no migrados aún

---

## 8. ESTRATEGIAS DE MIGRACIÓN

### Opción A: Actualizar todos los API clients (RECOMENDADA)

**Pros**:
- Limpio y explícito
- Elimina dependencia de rewrites
- Fácil de entender y mantener
- Permite eliminar `NEXT_PUBLIC_API_URL` eventualmente

**Contras**:
- Requiere actualizar múltiples archivos
- Riesgo de olvidar algún endpoint

**Implementación**:
```typescript
// ANTES
const res = await fetch('/api/v1/loans', { ... });

// DESPUÉS
const res = await fetch('/api/loans', { ... });
```

**Archivos a modificar**:
- `apps/web/src/features/loans/api/loans.api.ts`
- `apps/web/src/features/reservations/api/reservations.api.ts`
- `apps/web/src/features/meetings/api/meetings.api.ts`
- `apps/web/src/features/inventory/api/*.ts` (buscar)
- Cualquier otro API client

---

### Opción B: Rewrite en next.config.ts

**Pros**:
- No requiere cambios en el frontend
- Migración transparente

**Contras**:
- Confuso: `/api/v1/loans` realmente apunta a `/api/loans`
- Mantiene deuda técnica
- Dificulta debugging
- Requiere mantener rewrites indefinidamente

**Implementación**:
```typescript
// next.config.ts
async rewrites() {
    return [
        // Nuevos endpoints migrados
        {
            source: '/api/v1/loans/:path*',
            destination: '/api/loans/:path*',
        },
        {
            source: '/api/v1/resources/:path*',
            destination: '/api/resources/:path*',
        },
        // ... uno por cada módulo migrado
        
        // Endpoints aún en NestJS
        {
            source: '/api/v1/:path*',
            destination: 'http://localhost:4000/api/v1/:path*',
        },
    ];
}
```

---

### Opción C: Middleware de Next.js

**Pros**:
- Más flexible que rewrites
- Puede hacer lógica condicional

**Contras**:
- Más complejo
- Overhead en cada request
- Dificulta debugging

**Implementación**:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();
    
    if (url.pathname.startsWith('/api/v1/')) {
        // Remover /v1 de la ruta
        url.pathname = url.pathname.replace('/api/v1/', '/api/');
        return NextResponse.rewrite(url);
    }
    
    return NextResponse.next();
}
```

---

## 9. RECOMENDACIÓN FINAL

### Estrategia Híbrida (Opción A + Transición Gradual)

**Fase 1: Migración Inmediata (Módulos ya migrados)**
1. Actualizar API clients de módulos migrados:
   - `loans.api.ts`: `/api/v1/loans` → `/api/loans`
   - `reservations.api.ts`: `/api/v1/classroom-reservations` → `/api/classroom-reservations`
   - `meetings.api.ts`: `/api/v1/meetings` → `/api/meetings`
   - Buscar y actualizar `resources` e `institutions`

2. Mantener rewrite temporal en `next.config.ts` como fallback:
   ```typescript
   {
       source: '/api/v1/:path*',
       destination: 'http://localhost:4000/api/v1/:path*',
   }
   ```

**Fase 2: Testing**
1. Probar cada módulo migrado en desarrollo
2. Verificar que auth (Better Auth) funcione correctamente
3. Verificar que cookies y CORS funcionen

**Fase 3: Cleanup**
1. Cuando todos los módulos estén migrados, eliminar:
   - Variable `NEXT_PUBLIC_API_URL` de `.env.local`
   - Rewrite `/api/v1/*` de `next.config.ts`
   - Hook `useApiClient` (si ya no se usa)

---

## 10. CONSIDERACIONES ESPECIALES

### Better Auth

**Rutas de auth**: `/api/auth/*`

```typescript
// next.config.ts - MANTENER
{
    source: '/api/auth/:path*',
    destination: `${apiUrl}/api/auth/:path*`,
}
```

**Pregunta**: ¿Better Auth está en NestJS o en Next.js?
- Si está en NestJS → Mantener rewrite
- Si está en Next.js → Eliminar rewrite

**Acción**: Verificar dónde está configurado Better Auth

---

### Cookies y CORS

Los API clients actuales NO usan `credentials: 'include'` explícitamente (excepto `useApiClient`).

**Verificar**:
- ¿Los nuevos route handlers en Next.js necesitan `credentials: 'include'`?
- ¿Las cookies de sesión funcionan correctamente?
- ¿Hay problemas de CORS?

**Probable respuesta**: NO, porque Next.js y el frontend están en el mismo origen (mismo puerto en producción).

---

### Multi-tenancy

Los nuevos route handlers usan `getInstitutionId()` que obtiene el `institutionId` del usuario autenticado.

**Verificar**:
- ¿Better Auth incluye `institutionId` en el token/sesión?
- ¿`getInstitutionId()` funciona correctamente con Better Auth?

---

## 11. PRÓXIMOS PASOS

### Paso 1: Buscar todos los API clients
```bash
# Buscar archivos que contengan '/api/v1/'
grep -r "/api/v1/" apps/web/src/features/
```

### Paso 2: Crear lista completa de archivos a modificar

### Paso 3: Actualizar API clients uno por uno
- Cambiar `/api/v1/` → `/api/`
- Verificar que no haya rutas hardcodeadas en componentes

### Paso 4: Testing manual
- Probar cada módulo en desarrollo
- Verificar auth, permisos, multi-tenancy

### Paso 5: Cleanup
- Eliminar rewrites innecesarios
- Actualizar documentación

---

## 12. RIESGOS IDENTIFICADOS

### Alto Riesgo
1. **Auth roto**: Si Better Auth no funciona con las nuevas rutas
2. **Cookies perdidas**: Si CORS no está configurado correctamente
3. **Multi-tenancy roto**: Si `getInstitutionId()` no funciona

### Medio Riesgo
1. **Endpoints olvidados**: Algún API client no actualizado
2. **Rutas hardcodeadas**: Llamadas a `/api/v1/` en componentes

### Bajo Riesgo
1. **Performance**: Los rewrites tienen overhead mínimo
2. **Cache**: React Query debería seguir funcionando igual

---

## CONCLUSIÓN

**Problema crítico confirmado**: Todos los API clients del frontend usan `/api/v1/`, pero los endpoints migrados están en `/api/`.

**Solución recomendada**: Actualizar todos los API clients de módulos migrados (Opción A) con transición gradual.

**Siguiente acción**: Buscar y listar TODOS los archivos que contienen `/api/v1/` en el frontend.
