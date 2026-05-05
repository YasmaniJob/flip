# Fix: Onboarding Institutions Not Loading

**Fecha**: 21 de Marzo de 2026  
**Problema**: La pantalla de onboarding no cargaba las instituciones educativas  
**Estado**: ✅ RESUELTO

---

## Problema Identificado

La pantalla de onboarding mostraba "EXPLORA POR REGIÓN O BUSCA POR NOMBRE" pero no cargaba ninguna institución educativa de la base de datos MINEDU.

### Causa Raíz

Desajuste entre la estructura de respuesta del backend y lo que esperaba el frontend:

**Backend** (usando `successResponse` helper):
```json
{
  "success": true,
  "data": ["Lima", "Arequipa", "Cusco", ...]
}
```

**Frontend** (esperaba datos directamente):
```typescript
const res = await fetch('/api/institutions/departamentos');
const departamentos = await res.json(); // Esperaba array directamente
```

El frontend recibía `{ success: true, data: [...] }` pero intentaba usar ese objeto como si fuera un array, causando que no se renderizaran las opciones.

---

## Solución Implementada

Actualizado el componente `StepInstitucion.tsx` para extraer `data` de la respuesta del backend:

### 1. Endpoint de Departamentos

```typescript
// ANTES
const res = await fetch('/api/institutions/departamentos');
return res.json();

// DESPUÉS
const res = await fetch('/api/institutions/departamentos');
const json = await res.json();
return json.data || json; // Extrae data si existe, sino usa json directamente
```

### 2. Endpoint de Provincias

```typescript
// ANTES
const res = await fetch(`/api/institutions/provincias?departamento=${...}`);
return res.json();

// DESPUÉS
const res = await fetch(`/api/institutions/provincias?departamento=${...}`);
const json = await res.json();
return json.data || json;
```

### 3. Endpoint de Distritos

```typescript
// ANTES
const res = await fetch(`/api/institutions/distritos?departamento=${...}&provincia=${...}`);
return res.json();

// DESPUÉS
const res = await fetch(`/api/institutions/distritos?departamento=${...}&provincia=${...}`);
const json = await res.json();
return json.data || json;
```

### 4. Endpoint de Búsqueda de Instituciones

```typescript
// ANTES
const res = await fetch(url);
return res.json();

// DESPUÉS
const res = await fetch(url);
const json = await res.json();
return json.data || json;
```

---

## Archivos Modificados

1. **`apps/web/src/app/(onboarding)/onboarding/components/StepInstitucion.tsx`**
   - Actualizado 4 queries de React Query
   - Agregado extracción de `data` de respuestas

---

## Verificación

### Antes del Fix
- ❌ No se cargaban departamentos
- ❌ No se cargaban provincias
- ❌ No se cargaban distritos
- ❌ No se cargaban instituciones en búsqueda
- ❌ Pantalla mostraba solo mensaje de estado vacío

### Después del Fix
- ✅ Departamentos se cargan correctamente
- ✅ Provincias se cargan al seleccionar departamento
- ✅ Distritos se cargan al seleccionar provincia
- ✅ Instituciones se cargan en búsqueda
- ✅ Interfaz funcional y responsive

---

## Patrón Establecido

Para todos los endpoints que usan `successResponse()`, el frontend debe extraer `data`:

```typescript
// Patrón correcto para consumir endpoints con successResponse
const res = await fetch('/api/endpoint');
const json = await res.json();
const data = json.data || json; // Maneja ambos casos
```

### Alternativa: Función Helper

Se podría crear un helper para estandarizar esto:

```typescript
// lib/utils/api.ts
export async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data || json;
}

// Uso
const departamentos = await fetchApi<string[]>('/api/institutions/departamentos');
```

---

## Endpoints Afectados

Todos los endpoints de institutions que usan `successResponse`:

1. ✅ `/api/institutions/departamentos` - GET
2. ✅ `/api/institutions/provincias` - GET
3. ✅ `/api/institutions/distritos` - GET
4. ✅ `/api/institutions/search` - GET

---

## Lecciones Aprendidas

### 1. Consistencia en Respuestas

Todos los endpoints deben usar el mismo formato de respuesta. Si se usa `successResponse()`, el frontend debe estar preparado para extraer `data`.

### 2. Documentación de API

Es importante documentar la estructura de respuesta de cada endpoint para evitar este tipo de problemas.

### 3. Type Safety

TypeScript podría haber detectado este problema si se hubieran definido tipos explícitos para las respuestas:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Uso
const res = await fetch('/api/institutions/departamentos');
const json: ApiResponse<string[]> = await res.json();
const departamentos = json.data;
```

---

## Recomendaciones Futuras

### 1. Crear Helper de Fetch

```typescript
// lib/utils/api.ts
export async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'API request failed');
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}
```

### 2. Usar en Todos los Queries

```typescript
const { data: departamentos = [] } = useQuery({
  queryKey: ['departamentos'],
  queryFn: () => fetchApi<string[]>('/api/institutions/departamentos')
});
```

### 3. Definir Tipos de Respuesta

```typescript
// types/api.ts
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

---

## Testing

### Casos de Prueba

1. ✅ Cargar departamentos al abrir la pantalla
2. ✅ Cargar provincias al seleccionar departamento
3. ✅ Cargar distritos al seleccionar provincia
4. ✅ Buscar instituciones por nombre
5. ✅ Buscar instituciones por código modular
6. ✅ Filtrar por departamento + búsqueda
7. ✅ Filtrar por provincia + búsqueda
8. ✅ Filtrar por distrito + búsqueda
9. ✅ Infinite scroll en resultados
10. ✅ Modo manual de registro

---

## Conclusión

✅ **Problema resuelto exitosamente**

El onboarding ahora carga correctamente todas las instituciones educativas de la base de datos MINEDU. Los usuarios pueden:

- Explorar por región (departamento, provincia, distrito)
- Buscar por nombre o código modular
- Ver resultados con infinite scroll
- Registrar manualmente si no encuentran su institución

---

**Ejecutado por**: Kiro AI Assistant  
**Fecha**: 21 de Marzo de 2026  
**Estado**: ✅ RESUELTO
