# Fix: Diagnostic Approval Workflow and Statistics

## Problemas Identificados

### 1. Sesiones pendientes incluidas en estadísticas
Las sesiones con status `'completed'` (pendientes de aprobación) estaban siendo incluidas en las estadísticas institucionales, distorsionando los promedios.

### 2. Funcionalidad de rechazo rota
El botón "Rechazar" intentaba usar el status `'rejected'` que no existía en el schema de la base de datos.

### 3. Todas las sesiones quedaban como 'completed'
Independientemente de la configuración `diagnosticRequiresApproval`, todas las sesiones quedaban en estado `'completed'`, incluso cuando el docente ya existía en el staff.

### 4. Docentes existentes no se auto-aprobaban
Cuando un docente que ya estaba en el staff completaba el diagnóstico, la sesión no se vinculaba automáticamente a su cuenta.

---

## Soluciones Implementadas

### 1. Actualización del Schema
**Archivo**: `apps/web/src/lib/db/schema.ts`

```typescript
// Antes:
status: text('status').default('in_progress'), // 'in_progress' | 'completed' | 'approved'

// Después:
status: text('status').default('in_progress'), // 'in_progress' | 'completed' | 'approved' | 'rejected'
```

### 2. Lógica Inteligente de Aprobación
**Archivo**: `apps/web/src/app/api/diagnostic/[slug]/complete/route.ts`

Implementada lógica que determina el estado final basándose en:

#### Caso 1: Staff ya existe
```typescript
if (existingStaff) {
  finalStatus = 'approved';
  staffId = existingStaff.id;
}
```
- La sesión se marca como `'approved'` automáticamente
- Se vincula al staff existente

#### Caso 2: Staff no existe + No requiere aprobación
```typescript
else if (!institution.diagnosticRequiresApproval) {
  // Crear nuevo staff
  const [newStaff] = await db.insert(staff).values({...}).returning();
  finalStatus = 'approved';
  staffId = newStaff.id;
}
```
- Se crea el staff automáticamente
- La sesión se marca como `'approved'`

#### Caso 3: Staff no existe + Requiere aprobación
```typescript
// else: leave as 'completed' (pending)
```
- La sesión queda en estado `'completed'`
- Aparece en la pestaña "Pendientes" para aprobación manual

### 3. Filtrado de Estadísticas
**Archivo**: `apps/web/src/app/api/institutions/[id]/diagnostic/results/route.ts`

```typescript
// Antes:
const completedSessions = await db.query.diagnosticSessions.findMany({
  where: and(
    eq(diagnosticSessions.institutionId, institutionId),
    isNotNull(diagnosticSessions.overallScore)
  ),
});

// Después:
const completedSessions = await db.query.diagnosticSessions.findMany({
  where: and(
    eq(diagnosticSessions.institutionId, institutionId),
    eq(diagnosticSessions.status, 'approved'),
    isNotNull(diagnosticSessions.overallScore)
  ),
});
```

Ahora solo se incluyen sesiones con status `'approved'` en las estadísticas.

### 4. Script de Migración
**Archivo**: `apps/web/scripts/fix-diagnostic-sessions-status.ts`

Script creado para corregir sesiones existentes:
- Identifica sesiones con status `'completed'`
- Verifica si el staff existe
- Aplica la lógica de aprobación retroactivamente

**Resultado de ejecución**:
```
📊 Found 1 sessions with status 'completed'
✅ Session 1f81439e-cb3e-46bb-b40e-8cd41474a9db (Yasmani) → approved (linked to staff 53f0b2a4-e572-4951-b3fc-a79337782897)

📈 Summary:
   - Approved: 1
   - Pending: 0
   - Total processed: 1
```

---

## Comportamiento Actual

### Estados de Sesión

| Estado | Descripción | Incluido en Estadísticas |
|--------|-------------|--------------------------|
| `in_progress` | Diagnóstico en curso | ❌ No |
| `completed` | Completado, pendiente de aprobación | ❌ No |
| `approved` | Aprobado y vinculado a staff | ✅ Sí |
| `rejected` | Rechazado por administrador | ❌ No |

### Flujo de Aprobación

```
Usuario completa diagnóstico
         ↓
¿Staff existe?
    ↓ Sí → Auto-aprobar + Vincular → status='approved'
    ↓ No
         ↓
¿Requiere aprobación?
    ↓ No → Crear staff + Auto-aprobar → status='approved'
    ↓ Sí → Dejar pendiente → status='completed'
         ↓
    Admin aprueba/rechaza
         ↓
    status='approved' o 'rejected'
```

### Pestaña "Pendientes"
- Muestra solo sesiones con status `'completed'`
- Botón "Aprobar": crea/vincula staff y cambia a `'approved'`
- Botón "Rechazar": cambia a `'rejected'`

### Pestaña "Resultados"
- Muestra solo sesiones con status `'approved'`
- Calcula promedios solo con sesiones aprobadas
- Excluye pendientes y rechazadas

---

## Commit

**Hash**: `cb2ad70`
**Mensaje**: feat(diagnostic): implement SaaS features including history tracking, analytics gaps, and frictionless staff bridging

**Archivos modificados**:
- `apps/web/scripts/fix-diagnostic-sessions-status.ts` (nuevo)
- `apps/web/src/app/api/diagnostic/[slug]/complete/route.ts`
- `apps/web/src/app/api/institutions/[id]/diagnostic/approve/[sessionId]/route.ts`
- `apps/web/src/app/api/institutions/[id]/diagnostic/results/route.ts`
- `apps/web/src/lib/db/schema.ts`

---

## Testing

### Escenario 1: Docente existente completa diagnóstico
✅ Sesión se marca como `'approved'` automáticamente
✅ Se vincula al staff existente
✅ Aparece en estadísticas inmediatamente

### Escenario 2: Docente nuevo + diagnosticRequiresApproval=false
✅ Se crea staff automáticamente
✅ Sesión se marca como `'approved'`
✅ Aparece en estadísticas inmediatamente

### Escenario 3: Docente nuevo + diagnosticRequiresApproval=true
✅ Sesión queda en `'completed'`
✅ Aparece en pestaña "Pendientes"
✅ NO aparece en estadísticas
✅ Admin puede aprobar o rechazar

### Escenario 4: Admin rechaza docente
✅ Sesión cambia a `'rejected'`
✅ Desaparece de "Pendientes"
✅ NO aparece en estadísticas

---

## Próximos Pasos

1. ✅ Probar en producción con diferentes configuraciones de `diagnosticRequiresApproval`
2. ✅ Verificar que las estadísticas solo incluyan sesiones aprobadas
3. ✅ Confirmar que el botón "Rechazar" funciona correctamente
4. Considerar agregar filtros en la pestaña "Resultados" para ver sesiones rechazadas (opcional)
5. Considerar agregar notificación al docente cuando su sesión es aprobada/rechazada (FASE 5)
