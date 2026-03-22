# Fix de Endpoints de Instituciones - COMPLETADO ✅

## Fecha
21 de marzo de 2026

## Problema Identificado

### 1. Error 405 en `/api/institutions/provincias`
- **Causa**: Archivo corrupto/vacío sin exports nombrados
- **Síntoma**: Next.js reportaba "default export" y "no HTTP methods exported"

### 2. Error 500 en `/api/institutions/search`
- **Causa**: Conversión incorrecta de `searchParams` a objeto antes de validar
- **Síntoma**: Error de tipo en validación

### 3. Tipo incorrecto en `validateQuery`
- **Causa**: No aceptaba `ReadonlyURLSearchParams` de Next.js 15
- **Síntoma**: Error de tipo TypeScript

## Soluciones Aplicadas

### 1. Corregido `/api/institutions/search/route.ts` ✅
- Ahora pasa `searchParams` directamente a `validateQuery`
- No convierte a objeto antes de validar
- **Estado**: Funcionando correctamente (200 OK)

### 2. Actualizado `/lib/validations/helpers.ts` ✅
- `validateQuery` ahora acepta `ReadonlyURLSearchParams`
- Convierte internamente a objeto usando `Object.fromEntries(params.entries())`
- **Estado**: Funcionando correctamente

### 3. Recreado `/api/institutions/provincias/route.ts` ✅
- **Problema persistente**: El archivo se corrompía repetidamente al intentar escribirlo
- **Solución final**: Usar PowerShell `Set-Content` directamente
- **Pasos realizados**:
  1. Limpieza completa de caché (`.next` y `.turbo`)
  2. Eliminación del archivo corrupto
  3. Creación mediante script PowerShell con encoding UTF-8
  4. Reinicio del servidor
- **Estado**: Funcionando correctamente (200 OK)

## Estructura Final del Endpoint de Provincias

```typescript
import { NextRequest } from 'next/server';
import { turso } from '@/lib/db/turso';
import { educationInstitutionsMinedu } from '@/lib/db/schema-turso';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { ValidationError } from '@/lib/utils/errors';
import { sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

export async function GET(request: NextRequest) {
  try {
    const departamento = request.nextUrl.searchParams.get('departamento');

    if (!departamento) {
      throw new ValidationError('El parametro departamento es requerido');
    }

    const getProvincias = unstable_cache(
      async (dept: string) => {
        const results = await turso
          .selectDistinct({
            provincia: educationInstitutionsMinedu.provincia,
          })
          .from(educationInstitutionsMinedu)
          .where(
            sql`${educationInstitutionsMinedu.provincia} IS NOT NULL AND ${educationInstitutionsMinedu.departamento} LIKE ${dept.trim()}`
          )
          .orderBy(educationInstitutionsMinedu.provincia);

        return results.map((r) => r.provincia).filter(Boolean);
      },
      ['provincias', departamento],
      { revalidate: 3600, tags: ['provincias', `provincias-${departamento}`] }
    );

    const provincias = await getProvincias(departamento);

    return successResponse(provincias);
  } catch (error) {
    return errorResponse(error);
  }
}
```

## Verificación de Endpoints

Todos los endpoints de instituciones funcionan correctamente:

### 1. `/api/institutions/departamentos` ✅
- **Método**: GET
- **Parámetros**: Ninguno
- **Respuesta**: 200 OK
- **Caché**: 1 hora

### 2. `/api/institutions/provincias?departamento=LIMA` ✅
- **Método**: GET
- **Parámetros**: `departamento` (requerido)
- **Respuesta**: 200 OK
- **Caché**: 1 hora por departamento

### 3. `/api/institutions/distritos?departamento=LIMA&provincia=LIMA` ✅
- **Método**: GET
- **Parámetros**: `departamento` y `provincia` (requeridos)
- **Respuesta**: 200 OK
- **Caché**: 1 hora por provincia

### 4. `/api/institutions/search?q=san` ✅
- **Método**: GET
- **Parámetros**: `q` (término de búsqueda)
- **Respuesta**: 200 OK
- **Caché**: No aplica (búsqueda dinámica)

## Logs del Servidor

```
✓ Compiled /api/institutions/departamentos in 1617ms
GET /api/institutions/departamentos 200 in 3297ms

✓ Compiled /api/institutions/provincias in 139ms
GET /api/institutions/provincias?departamento=LIMA 200 in 649ms

✓ Compiled /api/institutions/distritos in 133ms
GET /api/institutions/distritos?departamento=LIMA&provincia=LIMA 200 in 599ms

✓ Compiled /api/institutions/search in 195ms
GET /api/institutions/search?q=san 200 in 959ms
```

## Archivos Modificados

1. `apps/web/src/app/api/institutions/search/route.ts` - Corregido
2. `apps/web/src/lib/validations/helpers.ts` - Actualizado
3. `apps/web/src/app/api/institutions/provincias/route.ts` - Recreado

## Notas Técnicas

### Problema de Escritura de Archivos
Durante la corrección, se encontró un problema persistente al intentar escribir el archivo `provincias/route.ts`:
- `fsWrite` creaba archivos vacíos
- `fsAppend` no funcionaba si el archivo estaba vacío
- `strReplace` no aplicaba cambios correctamente
- Las template strings se corrompían al usar PowerShell `Out-File`

**Solución**: Usar PowerShell `Set-Content` con encoding UTF-8 explícito funcionó correctamente.

### Caché de Turbopack
El caché de Turbopack puede causar que archivos corruptos persistan incluso después de corregirlos. Es importante:
1. Detener el servidor
2. Eliminar `.next` y `.turbo`
3. Recrear el archivo
4. Reiniciar el servidor

## Estado Final

✅ **TODOS LOS ENDPOINTS FUNCIONANDO CORRECTAMENTE**

- Autenticación: ✅ Funcionando
- Instituciones: ✅ Todos los endpoints OK
- Optimizaciones de caché: ✅ Implementadas
- Sistema de templates: ✅ Completado

## Próximos Pasos

El sistema está listo para uso. Los datos de instituciones MINEDU se cargarán desde Turso cuando se realicen las primeras consultas.
