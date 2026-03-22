# 📋 Análisis Completo: Módulo Resources

**Fecha:** 21 de marzo de 2026  
**Complejidad:** 🔴 Alta (CQRS, batch creation, secuencias atómicas)

---

## 🎯 Endpoints del Módulo

### 1. POST /api/resources
**Método:** POST  
**Ruta:** `/resources`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  name: string;              // required
  categoryId?: string;       // optional UUID
  templateId?: string;       // optional UUID
  brand?: string;
  model?: string;
  serialNumber?: string;
  condition?: string;        // 'bueno' | 'regular' | 'malo'
  status?: string;           // 'disponible' | 'prestado' | 'mantenimiento' | 'baja'
  notes?: string;
  stock?: number;            // default 1
}
```
**Lógica especial:**
- Genera `internalId` automático usando secuencias atómicas
- Formato: `PREFIX-NNNN` (ej: `LAP-0001`, `MON-0042`)
- Prefix se deriva del nombre de la categoría (si existe) o usa 'REC' por defecto
- Usa `getNextSequence()` con upsert atómico para evitar colisiones

---

### 2. POST /api/resources/batch
**Método:** POST  
**Ruta:** `/resources/batch`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  resource: CreateResourceDto;  // Datos base del recurso
  quantity: number;             // 1-100
  items?: Array<{               // Opcional: datos específicos por item
    serialNumber?: string;
    condition?: string;
    status?: string;
  }>;
}
```
**Lógica especial:**
- Crea múltiples recursos con un solo request
- Cada recurso obtiene su propio `internalId` secuencial
- Validación: quantity entre 1 y 100
- Loop secuencial (no paralelo) para garantizar secuencias consecutivas
- Si `items` está presente, usa datos específicos por índice
- Cada recurso tiene `stock: 1` (individual)

---

### 3. GET /api/resources
**Método:** GET  
**Ruta:** `/resources`  
**Roles:** Autenticado (AuthGuard)  
**Query params:**
```typescript
{
  search?: string;      // Busca en: name, brand, model, serialNumber, internalId
  categoryId?: string;  // Filtro por categoría
  status?: string;      // Filtro por status
  condition?: string;   // Filtro por condición
}
```
**Lógica especial:**
- Búsqueda con LIKE en múltiples campos
- Ordenamiento: `internalId ASC, createdAt ASC`
- Retorna array completo (sin paginación)

---

### 4. GET /api/resources/stats
**Método:** GET  
**Ruta:** `/resources/stats`  
**Roles:** Autenticado (AuthGuard)  
**Response:**
```typescript
{
  total: number;
  disponible: number;
  prestado: number;
  mantenimiento: number;
  baja: number;
}
```
**Lógica especial:**
- Usa `Promise.all()` para queries paralelas
- 5 queries de count simultáneas

---

### 5. PUT /api/resources/:id
**Método:** PUT  
**Ruta:** `/resources/:id`  
**Roles:** Autenticado (AuthGuard)  
**Body:** Partial de CreateResourceDto + campos de mantenimiento
```typescript
{
  name?: string;
  categoryId?: string;
  templateId?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  condition?: string;
  status?: string;
  notes?: string;
  stock?: number;
  maintenanceProgress?: number;      // 0-100
  maintenanceState?: object | null;  // null limpia el estado
}
```
**Lógica especial:**
- **Partial updates**: Solo actualiza campos presentes en el body
- **null es válido**: `maintenanceState: null` limpia el estado (finalizar mantenimiento)
- Usa `toDbPatch()` que filtra `undefined` pero permite `null`
- Validación: recurso debe existir y pertenecer a la institución

---

### 6. DELETE /api/resources/:id
**Método:** DELETE  
**Ruta:** `/resources/:id`  
**Roles:** Autenticado (AuthGuard)  
**Response:** 204 No Content  
**Lógica especial:**
- Validación: recurso debe existir
- Hard delete (no soft delete)

---

### 7. GET /api/resources/:resourceId/last-damage-report
**Método:** GET  
**Ruta:** `/resources/:resourceId/last-damage-report`  
**Roles:** Autenticado (AuthGuard)  
**Response:**
```typescript
{
  loanId: string;
  reportDate: Date;
  reportedBy: string;      // Nombre del staff o usuario
  damages: string[];       // commonProblems + otherNotes
  suggestions: string[];   // commonSuggestions + otherNotes
} | null
```
**Lógica especial:**
- **Joins complejos:**
  1. Busca en `loan_resources` todos los préstamos que contienen este recurso
  2. Filtra préstamos con `status='returned'` y `damageReports IS NOT NULL`
  3. Ordena por `returnDate DESC` (más reciente primero)
  4. Join con `staff` para obtener nombre del reportero
- **Estructura de damageReports:**
  ```typescript
  {
    [resourceId]: {
      commonProblems: string[];
      otherNotes?: string;
    }
  }
  ```
- **Estructura de suggestionReports:**
  ```typescript
  {
    [resourceId]: {
      commonSuggestions: string[];
      otherNotes?: string;
    }
  }
  ```
- Si el préstamo no tiene `staffId`, busca en `users` usando `requestedByUserId`
- Retorna `null` si no hay reportes o si están vacíos

---

## 🏗️ Arquitectura CQRS

### Commands (Escritura)
1. **CreateResourceCommand**
   - Genera prefix desde categoría
   - Obtiene secuencia atómica
   - Crea entidad Resource
   - Persiste con `save()`

2. **CreateBatchResourcesCommand**
   - Validación: 1-100 items
   - Loop secuencial para secuencias consecutivas
   - Cada item obtiene su propio `internalId`
   - Soporta datos específicos por item

3. **UpdateResourceCommand**
   - Validación: recurso existe
   - Usa `update()` con partial data
   - Permite `null` en `maintenanceState`

4. **DeleteResourceCommand**
   - Validación: recurso existe
   - Hard delete

### Queries (Lectura)
1. **FindResourcesQuery**
   - Filtros múltiples (search, category, status, condition)
   - Búsqueda LIKE en 5 campos
   - Ordenamiento por internalId

2. **GetResourceStatsQuery**
   - Queries paralelas con Promise.all()
   - 5 counts por status

---

## 🔧 Repositorio (DrizzleResourceRepository)

### Métodos clave:

#### `save(resource: Resource)`
- Insert con `onConflictDoUpdate`
- Upsert completo

#### `update(institutionId, id, data: Partial<Resource>)`
- Usa `toDbPatch()` para filtrar undefined
- **Permite null** en maintenanceState
- Optimización: si patch vacío, retorna sin query

#### `toDbPatch(data: Partial<Resource>)`
**CRÍTICO:** Método que construye el patch para updates
```typescript
// Solo incluye campos !== undefined
if (data.name !== undefined) patch.name = data.name;
if (data.maintenanceState !== undefined) patch.maintenanceState = data.maintenanceState;
// null ES un valor válido aquí ↑
```

#### `getNextSequence(institutionId, prefix)`
**Secuencias atómicas:**
```sql
INSERT INTO category_sequences (id, institutionId, categoryPrefix, lastNumber)
VALUES (uuid, inst, prefix, 1)
ON CONFLICT (institutionId, categoryPrefix)
DO UPDATE SET lastNumber = lastNumber + 1
RETURNING lastNumber
```
- Garantiza IDs únicos y consecutivos
- Thread-safe (upsert atómico)

#### `findAll(institutionId, filters)`
- Búsqueda con LIKE en múltiples campos
- Filtros opcionales: category, status, condition
- Ordenamiento: internalId ASC, createdAt ASC

#### `getStats(institutionId)`
- 5 queries paralelas con Promise.all()
- Retorna counts por status

---

## 📦 Entidad Resource (Domain)

### Propiedades:
```typescript
class Resource {
  id: string;                    // UUID
  institutionId: string;         // Multi-tenancy
  internalId: string;            // LAP-0001, MON-0042, etc.
  name: string;
  status: ResourceStatus;        // disponible | prestado | mantenimiento | baja
  condition: ResourceCondition;  // bueno | regular | malo
  stock: number;
  categoryId?: string;
  templateId?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  notes?: string;
  attributes?: Record<string, any>;
  maintenanceProgress?: number;  // 0-100
  maintenanceState?: any;        // null limpia el estado
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Métodos de dominio:
- `markAsBorrowed()` → status = 'prestado'
- `markAsAvailable()` → status = 'disponible'
- `markAsMaintenance()` → status = 'mantenimiento'
- `markAsDecommissioned()` → status = 'baja'

---

## 🔑 Puntos Críticos para la Migración

### 1. Secuencias Atómicas
- Usar `onConflictDoUpdate` con `sql` template
- Garantizar atomicidad en batch creation
- Loop secuencial (no paralelo) para IDs consecutivos

### 2. Partial Updates con null
- `maintenanceState: null` debe limpiar el campo
- Filtrar `undefined` pero permitir `null`
- Implementar `toDbPatch()` equivalente

### 3. Batch Creation
- Validación: 1-100 items
- Loop secuencial para secuencias
- Soportar `items` array con datos específicos

### 4. Last Damage Report
- Joins complejos: loanResources → loans → staff/users
- Filtros: status='returned', damageReports IS NOT NULL
- Ordenamiento: returnDate DESC
- Parsear JSON: damageReports[resourceId], suggestionReports[resourceId]
- Fallback: si no hay staffId, buscar en users

### 5. Búsqueda Multi-campo
- LIKE en 5 campos: name, brand, model, serialNumber, internalId
- Usar `or()` con `like()` en Drizzle

### 6. Stats con Queries Paralelas
- Promise.all() con 5 queries de count
- Mapear resultados a objeto con keys por status

---

## 📝 Archivos a Crear

### Esquemas Zod (1 archivo)
- `lib/validations/schemas/resources.ts`
  - createResourceSchema
  - updateResourceSchema (permite null en maintenanceState)
  - batchCreateResourceSchema
  - resourcesQuerySchema

### Route Handlers (5 archivos)
- `app/api/resources/route.ts` (GET, POST)
- `app/api/resources/batch/route.ts` (POST)
- `app/api/resources/stats/route.ts` (GET)
- `app/api/resources/[id]/route.ts` (PUT, DELETE)
- `app/api/resources/[id]/last-damage-report/route.ts` (GET)

### Helpers (1 archivo)
- `lib/services/resources.ts`
  - `getNextSequence(institutionId, prefix)` - Secuencias atómicas
  - `generatePrefix(categoryName)` - Genera prefix desde nombre
  - `toDbPatch(data)` - Filtra undefined, permite null

**Total:** 7 archivos

---

## ⚠️ Validaciones Importantes

1. **Batch quantity:** 1-100
2. **Recurso existe:** En UPDATE y DELETE
3. **Multi-tenancy:** Siempre filtrar por institutionId
4. **maintenanceState:** Validar que sea object o null (no undefined)
5. **Secuencias:** Usar transacción implícita del upsert

---

## 🧪 Testing Crítico

1. ✅ Secuencias consecutivas en batch creation
2. ✅ Partial update con null limpia maintenanceState
3. ✅ Last damage report con joins complejos
4. ✅ Búsqueda multi-campo funciona
5. ✅ Stats retorna counts correctos
6. ✅ Batch creation con items específicos
7. ✅ Prefix se genera correctamente desde categoría

---

## 📚 Referencias

- Controller: `apps/api/src/infrastructure/http/controllers/resource.controller.ts`
- Repository: `apps/api/src/infrastructure/persistence/drizzle/repositories/drizzle-resource.repository.ts`
- Entity: `apps/api/src/core/domain/entities/resource.entity.ts`
- Commands: `apps/api/src/application/use-cases/resources/commands/`
- Queries: `apps/api/src/application/use-cases/resources/queries/`
