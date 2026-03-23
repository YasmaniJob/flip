# Refactorización del Sistema de Inventario

## Problema Identificado

El usuario reportó que al agregar recursos, estos no aparecían en la tabla. Después de una investigación profunda, se identificó que:

1. **El diseño de base de datos es CORRECTO** (no es un parche):
   - `resource_templates`: Plantillas/tipos de recursos (ej: "Laptop HP")
   - `resources`: Recursos físicos individuales (ej: "Laptop #001 con S/N ABC123")

2. **El problema era en el flujo de UI**:
   - El wizard solo activaba templates (correcto)
   - El AddStockModal creaba resources (correcto)
   - PERO el inventario-client NO mostraba el TemplateGrid para hacer clic y abrir el AddStockModal
   - Siempre intentaba mostrar ResourceTable, que estaba vacío

## Solución Implementada

### 1. Lógica de Visualización Inteligente

```typescript
// Decide which view to show:
// - If we have individual resources, show ResourceTable
// - If we only have templates (no resources yet), show TemplateGrid
const showResourceTable = hasResources;
const showTemplateGrid = !hasResources && hasTemplates;
```

### 2. Flujo Correcto

**Paso 1: Activar Templates**
- Usuario hace clic en "Nuevo Recurso"
- Se abre el Wizard (WizardStep1)
- Usuario selecciona subcategorías del catálogo estándar
- Se crean/activan templates en `resource_templates`

**Paso 2: Ver Templates Agregados**
- Si NO hay resources individuales, se muestra `TemplateGrid`
- Muestra las plantillas con estadísticas agregadas
- Cada fila es clickeable

**Paso 3: Añadir Stock (Recursos Individuales)**
- Usuario hace clic en una fila del TemplateGrid
- Se abre `AddStockModal`
- Usuario puede crear:
  - **Unidad Única**: 1 recurso con todos sus detalles
  - **Lote (Múltiples)**: N recursos con tabla editable

**Paso 4: Ver Recursos Individuales**
- Una vez creados resources, se muestra `ResourceTable`
- Tabla con columnas: ITEM, RECURSO, CATEGORÍA, ESTADO, S/N / MODELO, ACCIONES
- Cada fila es un recurso físico individual

### 3. Componentes Actualizados

**inventario-client.tsx**
- Agregado lógica para decidir qué vista mostrar
- Importado `TemplateGrid` component
- Agregado tipo `InventoryTemplateAggregation`
- Mejorado `onSuccess` del AddStockModal para invalidar queries

**Componentes Involucrados**
- `ResourceWizard` → Activa templates
- `TemplateGrid` → Muestra templates agregados (cuando no hay resources)
- `AddStockModal` → Crea resources individuales
- `ResourceTable` → Muestra resources individuales (cuando existen)
- `InventoryHeader` → Muestra estadísticas visuales

## Arquitectura de Datos

### resource_templates
```sql
- id: UUID
- institution_id: UUID
- category_id: UUID
- name: string (ej: "Laptop")
- icon: string (ej: "💻")
- default_brand: string (opcional)
- default_model: string (opcional)
```

**Propósito**: Define QUÉ TIPOS de recursos existen en el catálogo de la institución.

### resources
```sql
- id: UUID
- institution_id: UUID
- category_id: UUID
- template_id: UUID (referencia a resource_templates)
- internal_id: string (ej: "LAP-001")
- name: string (ej: "Laptop HP ProBook")
- brand: string
- model: string
- serial_number: string
- status: enum (disponible, prestado, mantenimiento, baja)
- condition: enum (nuevo, bueno, regular, malo)
- notes: text
- maintenance_progress: int
- maintenance_state: jsonb
```

**Propósito**: Representa cada objeto físico individual que puede ser prestado, rastreado, etc.

## Endpoints API

### GET /api/inventory-templates
Retorna templates con estadísticas agregadas:
```typescript
{
  templateId: string;
  templateName: string;
  categoryName: string;
  totalStock: number;      // COUNT de resources
  available: number;       // COUNT donde status = 'disponible'
  borrowed: number;        // COUNT donde status = 'prestado'
  maintenance: number;     // COUNT donde status = 'mantenimiento'
  retired: number;         // COUNT donde status = 'baja'
}
```

### GET /api/resources
Retorna resources individuales con filtros:
- search: busca en name, brand, model, serialNumber, internalId
- categoryId: filtra por categoría
- status: filtra por estado
- condition: filtra por condición

### POST /api/resources
Crea un recurso individual con ID interno generado automáticamente.

### POST /api/resources/batch
Crea múltiples recursos con IDs consecutivos (LAP-001, LAP-002, etc.)

## Flujo de Usuario Completo

1. **Primera vez (sin templates)**:
   - Click "Nuevo Recurso" → Wizard
   - Selecciona "Laptop", "Proyector", etc.
   - Se crean templates
   - Se muestra TemplateGrid con 0 unidades

2. **Añadir stock**:
   - Click en fila "Laptop" del TemplateGrid
   - Se abre AddStockModal
   - Crea 5 laptops individuales
   - Se actualiza TemplateGrid: "Laptop (5 unidades)"

3. **Ver recursos individuales**:
   - Una vez hay resources, automáticamente cambia a ResourceTable
   - Muestra cada laptop con su S/N, estado, etc.
   - Puede editar, eliminar, mantenimiento individual

4. **Añadir más stock**:
   - Si quiere añadir más laptops, debe usar el botón "Nuevo Recurso"
   - O podemos agregar un botón "Añadir Stock" en el header

## Mejoras Futuras

1. **Botón "Añadir Stock" en Header**: Para facilitar añadir más unidades cuando ya hay resources
2. **Vista Híbrida**: Mostrar templates Y resources en pestañas
3. **Importación Masiva**: CSV/Excel para crear muchos resources de una vez
4. **Códigos QR**: Generar QR por cada recurso individual

## Estado Actual

✅ Wizard activa templates correctamente
✅ TemplateGrid muestra templates cuando no hay resources
✅ AddStockModal crea resources individuales
✅ ResourceTable muestra resources cuando existen
✅ Estadísticas visuales funcionan con ambas vistas
✅ Filtros funcionan en ambas vistas

## Testing

Para probar el flujo completo:

1. Ir a /inventario
2. Click "Nuevo Recurso"
3. Seleccionar 2-3 subcategorías (ej: Laptop, Proyector)
4. Guardar → Se muestra TemplateGrid
5. Click en fila "Laptop"
6. En AddStockModal, cambiar a "Lote (Múltiples)"
7. Ajustar cantidad a 3
8. Guardar → Se crean 3 laptops
9. Automáticamente cambia a ResourceTable
10. Ver las 3 laptops con IDs LAP-001, LAP-002, LAP-003

---

**Fecha**: 2026-03-22
**Autor**: Kiro AI Assistant
**Estado**: ✅ Completado
