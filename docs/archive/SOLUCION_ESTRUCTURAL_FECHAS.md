# Solución Estructural: Manejo de Fechas

**Fecha:** 22 de marzo de 2026  
**Problema:** Inconsistencia en el formato de fechas entre frontend y backend

## Problema Identificado

El sistema tenía inconsistencias en cómo se manejaban las fechas:

### Síntomas
- Error 400 (Bad Request) en endpoint `/api/classroom-reservations`
- Validación fallando con mensaje: "Formato de fecha inválido"
- Frontend enviando fechas en formato `YYYY-MM-DD`
- Backend esperando formato ISO 8601 completo (`YYYY-MM-DDTHH:mm:ss.sssZ`)

### Casos de Uso Identificados

1. **Query Parameters (GET requests)**
   - Frontend: `2026-03-16` (formato simple)
   - Backend esperaba: `2026-03-16T00:00:00.000Z` (ISO completo)
   - Uso: Filtros de fecha, rangos de búsqueda

2. **Request Body (POST/PUT requests)**
   - Frontend: `2026-03-16T10:30:00.000Z` (ISO completo)
   - Backend esperaba: ISO completo ✓
   - Uso: Crear/actualizar registros con timestamps precisos

3. **Inconsistencia en Schemas**
   - Algunos usaban `z.string().datetime()`
   - Otros usaban regex `/^\d{4}-\d{2}-\d{2}$/`
   - No había estándar definido

## Solución Implementada

### 1. Módulo Centralizado de Validación de Fechas

Creado: `apps/web/src/lib/validations/date-schemas.ts`

Este módulo proporciona schemas reutilizables para diferentes casos de uso:

#### `isoDateTimeSchema`
```typescript
z.string().datetime({
  message: 'Formato de fecha/hora inválido. Use formato ISO 8601'
})
```
- **Uso:** Crear/actualizar registros con timestamps precisos
- **Formato:** `2026-03-22T10:30:00.000Z`
- **Casos:** Slots de reservaciones, fechas de vencimiento, timestamps

#### `simpleDateSchema`
```typescript
z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido')
```
- **Uso:** Query parameters para rangos de fecha
- **Formato:** `2026-03-22`
- **Casos:** Filtros de fecha, búsquedas por rango

#### `flexibleDateSchema`
```typescript
z.string().transform((val, ctx) => {
  // Acepta YYYY-MM-DD y lo convierte a ISO
  // También acepta ISO directamente
})
```
- **Uso:** APIs que necesitan retrocompatibilidad
- **Formato:** Acepta ambos, normaliza a ISO
- **Casos:** Endpoints legacy, migración gradual

### 2. Actualización de Schemas

#### Reservations Schema
```typescript
// Antes
date: z.string().datetime('Fecha inválida')

// Después
import { isoDateTimeSchema, optionalSimpleDateSchema } from './date-schemas';

// Para crear slots (body)
date: isoDateTimeSchema

// Para query params (GET)
startDate: optionalSimpleDateSchema
endDate: optionalSimpleDateSchema
```

#### Meetings Schema
```typescript
// Antes
date: z.string().datetime('Fecha inválida')
dueDate: z.string().datetime().optional()

// Después
import { isoDateTimeSchema, optionalIsoDateTimeSchema } from './date-schemas';

date: isoDateTimeSchema
dueDate: optionalIsoDateTimeSchema
```

### 3. Convenciones Establecidas

#### Para Query Parameters (GET)
- **Formato:** `YYYY-MM-DD` (simple date)
- **Schema:** `simpleDateSchema` o `optionalSimpleDateSchema`
- **Razón:** URLs más limpias, fácil de leer en logs

```typescript
// ✓ Correcto
GET /api/classroom-reservations?startDate=2026-03-16&endDate=2026-03-21

// ✗ Incorrecto (pero funcionaría con flexibleDateSchema)
GET /api/classroom-reservations?startDate=2026-03-16T00:00:00.000Z
```

#### Para Request Body (POST/PUT)
- **Formato:** ISO 8601 completo con timezone
- **Schema:** `isoDateTimeSchema` o `optionalIsoDateTimeSchema`
- **Razón:** Precisión de timestamp, manejo de zonas horarias

```typescript
// ✓ Correcto
POST /api/classroom-reservations
{
  "slots": [
    {
      "date": "2026-03-16T10:30:00.000Z",
      "pedagogicalHourId": "uuid"
    }
  ]
}
```

#### Para Fechas Opcionales
- Usar versiones `optional` de los schemas
- `optionalIsoDateTimeSchema`
- `optionalSimpleDateSchema`
- `optionalFlexibleDateSchema`

## Beneficios de la Solución

### 1. Consistencia
- Un solo lugar para definir validaciones de fecha
- Mensajes de error estandarizados
- Comportamiento predecible

### 2. Mantenibilidad
- Cambios centralizados
- Fácil de actualizar
- Documentación clara del propósito de cada schema

### 3. Reutilización
- Schemas importables en cualquier módulo
- No duplicar lógica de validación
- Reducción de código

### 4. Claridad
- Nombres descriptivos (`isoDateTimeSchema` vs `simpleDateSchema`)
- Comentarios explicando cuándo usar cada uno
- Ejemplos en la documentación

## Migración de Código Existente

### Paso 1: Identificar Uso de Fechas
```bash
# Buscar schemas con datetime
grep -r "z.string().datetime()" apps/web/src/lib/validations/schemas/

# Buscar regex de fechas
grep -r "regex.*\d{4}-\d{2}-\d{2}" apps/web/src/lib/validations/schemas/
```

### Paso 2: Importar Schemas Apropiados
```typescript
import { 
  isoDateTimeSchema, 
  simpleDateSchema,
  optionalIsoDateTimeSchema,
  optionalSimpleDateSchema 
} from '@/lib/validations/date-schemas';
```

### Paso 3: Reemplazar Validaciones
```typescript
// Antes
export const mySchema = z.object({
  createdAt: z.string().datetime(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Después
export const mySchema = z.object({
  createdAt: isoDateTimeSchema,
  startDate: optionalSimpleDateSchema,
});
```

## Casos de Uso Comunes

### Filtros de Fecha en GET
```typescript
export const querySchema = z.object({
  startDate: optionalSimpleDateSchema,
  endDate: optionalSimpleDateSchema,
});

// URL: /api/resources?startDate=2026-03-01&endDate=2026-03-31
```

### Crear Registro con Timestamp
```typescript
export const createSchema = z.object({
  scheduledAt: isoDateTimeSchema,
  dueDate: optionalIsoDateTimeSchema,
});

// Body: { "scheduledAt": "2026-03-22T14:30:00.000Z" }
```

### API con Retrocompatibilidad
```typescript
export const flexibleSchema = z.object({
  date: flexibleDateSchema, // Acepta ambos formatos
});

// Acepta: "2026-03-22" o "2026-03-22T14:30:00.000Z"
// Normaliza a: "2026-03-22T00:00:00.000Z" o mantiene el ISO
```

## Testing

### Validar Formato Simple
```typescript
import { simpleDateSchema } from '@/lib/validations/date-schemas';

// ✓ Válido
simpleDateSchema.parse('2026-03-22');

// ✗ Inválido
simpleDateSchema.parse('2026-03-22T10:30:00.000Z'); // Error
simpleDateSchema.parse('22/03/2026'); // Error
```

### Validar Formato ISO
```typescript
import { isoDateTimeSchema } from '@/lib/validations/date-schemas';

// ✓ Válido
isoDateTimeSchema.parse('2026-03-22T10:30:00.000Z');
isoDateTimeSchema.parse('2026-03-22T10:30:00+05:00');

// ✗ Inválido
isoDateTimeSchema.parse('2026-03-22'); // Error
```

## Próximos Pasos

1. ✅ Crear módulo `date-schemas.ts`
2. ✅ Actualizar schemas de `reservations`
3. ✅ Actualizar schemas de `meetings`
4. ⏳ Auditar otros módulos (loans, resources, etc.)
5. ⏳ Actualizar documentación de API
6. ⏳ Agregar tests unitarios para date-schemas

## Archivos Modificados

- ✅ `apps/web/src/lib/validations/date-schemas.ts` (nuevo)
- ✅ `apps/web/src/lib/validations/schemas/reservations.ts`
- ✅ `apps/web/src/lib/validations/schemas/meetings.ts`
- ✅ `apps/web/src/lib/validations/helpers.ts` (corrección previa)

## Notas Técnicas

### Por qué ISO 8601 para Timestamps
- Estándar internacional
- Incluye zona horaria
- Soportado nativamente por JavaScript (`new Date()`)
- Compatible con bases de datos

### Por qué YYYY-MM-DD para Query Params
- URLs más limpias
- Fácil de leer en logs
- Suficiente para filtros de fecha (sin hora)
- Estándar ISO 8601 (formato extendido de fecha)

### Manejo de Zonas Horarias
- Siempre usar UTC en el backend
- Convertir a zona local en el frontend si es necesario
- Almacenar en DB como UTC
- Formato ISO incluye timezone (`Z` = UTC)

---

**Última actualización:** 22 de marzo de 2026  
**Responsable:** Sistema de Validación Centralizada
