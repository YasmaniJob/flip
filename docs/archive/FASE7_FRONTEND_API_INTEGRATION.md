# Fase 7: Integración Frontend - API Migrada

**Fecha**: 2026-03-21  
**Estado**: ANÁLISIS COMPLETADO  
**Siguiente**: ACTUALIZACIÓN DE API CLIENTS

---

## RESUMEN EJECUTIVO

### Problema Identificado

El frontend usa `/api/v1/*` para todas las llamadas HTTP, pero los endpoints migrados están en `/api/*`.

```
❌ Frontend → /api/v1/loans → Rewrite → Backend NestJS (puerto 4000)
✅ Endpoint migrado → /api/loans (Next.js App Router)
```

**Resultado**: El frontend sigue llamando al backend NestJS antiguo.

---

## ANÁLISIS COMPLETADO

### Documentos Creados

1. **`ANALISIS_FRONTEND_HTTP_CLIENT.md`**
   - Configuración del cliente HTTP (`useApiClient`)
   - Variables de entorno (`NEXT_PUBLIC_API_URL`)
   - Configuración de Next.js (rewrites)
   - Patrones de uso en el frontend
   - 3 estrategias de migración evaluadas
   - Recomendación final

2. **`LISTA_ARCHIVOS_ACTUALIZAR_API.md`**
   - 14 archivos a modificar (prioridad ALTA)
   - 4 archivos a NO modificar (módulos no migrados)
   - Estrategia de actualización en 4 pasos
   - Patrón de reemplazo con regex
   - Testing checklist completo

---

## HALLAZGOS CLAVE

### Cliente HTTP

**Archivo**: `apps/web/src/lib/api-client.ts`

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';

export function useApiClient() {
    const { data: session } = useSession();
    const token = session?.session?.token;
    
    // Agrega automáticamente Authorization header
    // Usa credentials: 'include' para cookies
}
```

**Uso**: Poco usado en el código actual. La mayoría usa `fetch` directo.

---

### Variables de Entorno

**Archivo**: `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

**Problema**: Apunta al backend NestJS en puerto 4000.

---

### Rewrites en Next.js

**Archivo**: `apps/web/next.config.ts`

```typescript
async rewrites() {
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

**Función**: Proxy para evitar problemas CORS con cookies.

---

### Patrones de Uso

#### Patrón A: Fetch directo con rutas hardcodeadas (más común)

```typescript
// loans.api.ts
const res = await fetch('/api/v1/loans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
});
```

#### Patrón B: Fetch con constante BASE_URL

```typescript
// reservations.api.ts
const BASE_URL = '/api/v1/classroom-reservations';

const res = await fetch(`${BASE_URL}?startDate=${startDate}`, {
    method: 'GET',
});
```

#### Patrón C: React Query + useApiClient

```typescript
// wizard-step-2.tsx
const apiClient = useApiClient();

const createMutation = useMutation({
    mutationFn: async () => {
        return apiClient.post('/resources', resourceData);
    },
});
```

---

## MÓDULOS AFECTADOS

### Migrados (Actualizar YA)

1. **Loans** (1 archivo)
   - `apps/web/src/features/loans/api/loans.api.ts`

2. **Reservations** (1 archivo)
   - `apps/web/src/features/reservations/api/reservations.api.ts`

3. **Meetings** (1 archivo)
   - `apps/web/src/features/meetings/api/meetings.api.ts`

4. **Institutions** (11 archivos)
   - Onboarding: 2 archivos
   - Branding: 2 archivos
   - Settings: 6 archivos
   - Dashboard: 1 archivo

**Total**: 14 archivos

---

### No Migrados (Dejar como está)

1. **Dashboard** (1 archivo)
   - `apps/web/src/features/dashboard/api/dashboard.api.ts`

2. **Users** (2 archivos)
   - `apps/web/src/app/(dashboard)/settings/settings-client.tsx`
   - `apps/web/src/hooks/use-academic-defaults.ts`

3. **Pedagogical Hours** (1 archivo)
   - `apps/web/src/features/settings/hooks/use-pedagogical-hours.ts`

**Total**: 4 archivos

---

## ESTRATEGIA RECOMENDADA

### Opción Elegida: Actualización Directa (Opción A)

**Ventajas**:
- Limpio y explícito
- Elimina dependencia de rewrites
- Fácil de entender y mantener
- Permite eliminar `NEXT_PUBLIC_API_URL` eventualmente

**Desventajas**:
- Requiere actualizar 14 archivos
- Riesgo de olvidar algún endpoint

---

### Plan de Ejecución

#### Paso 1: Actualizar API Clients (3 archivos)
```
apps/web/src/features/loans/api/loans.api.ts
apps/web/src/features/reservations/api/reservations.api.ts
apps/web/src/features/meetings/api/meetings.api.ts
```

**Cambio**:
```typescript
// ANTES
const res = await fetch('/api/v1/loans', { ... });

// DESPUÉS
const res = await fetch('/api/loans', { ... });
```

---

#### Paso 2: Actualizar Onboarding (2 archivos)
```
apps/web/src/app/(onboarding)/onboarding/page.tsx
apps/web/src/app/(onboarding)/onboarding/components/StepInstitucion.tsx
```

**Cambios**:
- `/api/v1/institutions/onboard` → `/api/institutions/onboard`
- `/api/v1/institutions/search` → `/api/institutions/search`
- `/api/v1/institutions/departamentos` → `/api/institutions/departamentos`
- `/api/v1/institutions/provincias` → `/api/institutions/provincias`
- `/api/v1/institutions/distritos` → `/api/institutions/distritos`

---

#### Paso 3: Actualizar Branding (2 archivos)
```
apps/web/src/lib/use-auth-branding.ts
apps/web/src/components/brand-color-provider.tsx
```

**Cambios**:
- `/api/v1/institutions/public/branding` → `/api/institutions/public/branding`
- `/api/v1/institutions/my-institution` → `/api/institutions/my-institution`

---

#### Paso 4: Actualizar Settings y Dashboard (7 archivos)
```
apps/web/src/components/sidebar.tsx
apps/web/src/app/(dashboard)/settings/areas/page.tsx
apps/web/src/app/(dashboard)/settings/settings-client.tsx
apps/web/src/app/(dashboard)/settings/grados/page.tsx
apps/web/src/app/(dashboard)/layout.tsx
apps/web/src/app/(dashboard)/dashboard/page.tsx
```

**Cambios**:
- `/api/v1/institutions/my-institution` → `/api/institutions/my-institution`
- `/api/v1/institutions/my-institution/brand` → `/api/institutions/my-institution/brand`

---

## PATRÓN DE REEMPLAZO

### Búsqueda y Reemplazo (Regex)

```regex
# Buscar
/api/v1/(loans|classroom-reservations|meetings|institutions)

# Reemplazar
/api/$1
```

### Verificación Post-Cambio

```bash
# Verificar que NO queden referencias a módulos migrados
grep -r "/api/v1/loans" apps/web/src/
grep -r "/api/v1/classroom-reservations" apps/web/src/
grep -r "/api/v1/meetings" apps/web/src/
grep -r "/api/v1/institutions" apps/web/src/

# Resultado esperado: 0 matches
```

---

## TESTING CHECKLIST

### Loans
- [ ] Listar préstamos
- [ ] Crear préstamo
- [ ] Aprobar préstamo (admin/pip)
- [ ] Rechazar préstamo (admin/pip)
- [ ] Devolver préstamo

### Reservations
- [ ] Ver calendario de reservas
- [ ] Crear reserva (bloque)
- [ ] Cancelar reserva completa
- [ ] Cancelar slot individual
- [ ] Marcar asistencia en slot
- [ ] Reprogramar slot
- [ ] Reprogramar bloque
- [ ] Gestionar attendance (workshops)
- [ ] Gestionar tasks (workshops)

### Meetings
- [ ] Listar reuniones
- [ ] Ver detalle de reunión
- [ ] Crear reunión
- [ ] Eliminar reunión
- [ ] Crear tarea
- [ ] Actualizar tarea
- [ ] Eliminar tarea

### Institutions
- [ ] Onboarding manual
- [ ] Onboarding con búsqueda MINEDU
- [ ] Buscar por departamento/provincia/distrito
- [ ] Ver mi institución
- [ ] Actualizar branding
- [ ] Ver branding público
- [ ] Seeding de categorías y templates

---

## RIESGOS IDENTIFICADOS

### Alto Riesgo
1. **Auth roto**: Si Better Auth no funciona con las nuevas rutas
   - **Mitigación**: Better Auth está en `/api/auth/*`, no afectado
   
2. **Cookies perdidas**: Si CORS no está configurado correctamente
   - **Mitigación**: Next.js y frontend en mismo origen, no hay CORS

3. **Multi-tenancy roto**: Si `getInstitutionId()` no funciona
   - **Mitigación**: Ya probado en route handlers, funciona correctamente

### Medio Riesgo
1. **Endpoints olvidados**: Algún API client no actualizado
   - **Mitigación**: Búsqueda exhaustiva con grep completada

2. **Rutas hardcodeadas**: Llamadas a `/api/v1/` en componentes
   - **Mitigación**: Grep encontró todas las referencias

### Bajo Riesgo
1. **Performance**: Los rewrites tienen overhead mínimo
   - **Mitigación**: Eliminar rewrites después de migración completa

2. **Cache**: React Query debería seguir funcionando igual
   - **Mitigación**: Solo cambia la URL, no la lógica de cache

---

## CONSIDERACIONES ESPECIALES

### Better Auth

**Rutas**: `/api/auth/*`

```typescript
// next.config.ts - MANTENER
{
    source: '/api/auth/:path*',
    destination: `${apiUrl}/api/auth/:path*`,
}
```

**Estado**: Better Auth está en el backend NestJS, NO migrado.  
**Acción**: Mantener rewrite de `/api/auth/*` indefinidamente.

---

### Cookies y CORS

**Situación actual**:
- Frontend: `http://localhost:3000` (Next.js)
- Backend: `http://localhost:4000` (NestJS)
- Rewrites en `next.config.ts` para proxy

**Después de migración**:
- Frontend + API: `http://localhost:3000` (Next.js)
- Backend (solo auth): `http://localhost:4000` (NestJS)
- Rewrite solo para `/api/auth/*`

**Ventaja**: Elimina problemas de CORS para módulos migrados.

---

### Multi-tenancy

**Verificación necesaria**:
- ¿Better Auth incluye `institutionId` en el token/sesión?
- ¿`getInstitutionId()` funciona correctamente con Better Auth?

**Acción**: Probar en desarrollo después de actualizar API clients.

---

## PRÓXIMOS PASOS

### Inmediato
1. ✅ Análisis completado
2. ✅ Lista de archivos identificada
3. ⏳ Actualizar 14 archivos (siguiente tarea)

### Corto Plazo
4. Testing manual de cada módulo
5. Verificar auth y multi-tenancy
6. Documentar problemas encontrados

### Mediano Plazo
7. Testing en staging
8. Eliminar `NEXT_PUBLIC_API_URL` de `.env.local`
9. Eliminar rewrite `/api/v1/*` de `next.config.ts`
10. Actualizar `MIGRATION_COMPLETE.md`

---

## ARCHIVOS DE REFERENCIA

1. **`docs/ANALISIS_FRONTEND_HTTP_CLIENT.md`**
   - Análisis técnico completo
   - Evaluación de 3 estrategias
   - Ejemplos de código

2. **`docs/LISTA_ARCHIVOS_ACTUALIZAR_API.md`**
   - Lista detallada de 14 archivos
   - Líneas específicas a cambiar
   - Estrategia de actualización

3. **`apps/web/MIGRATION_COMPLETE.md`**
   - Estado de la migración backend
   - 61 route handlers migrados

4. **`docs/FASE6_TESTING_CLEANUP_COMPLETADA.md`**
   - Verificación de consistencia
   - Checklist de seguridad

---

## CONCLUSIÓN

**Análisis completado exitosamente**. Identificados 14 archivos que necesitan actualización para conectar el frontend con los endpoints migrados.

**Siguiente acción**: Actualizar los 14 archivos siguiendo el plan de ejecución en 4 pasos.

**Tiempo estimado**: 30-45 minutos para actualización + 1-2 horas para testing completo.
