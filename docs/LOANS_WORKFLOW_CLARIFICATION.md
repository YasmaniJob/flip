# 🔍 Aclaración: Workflow de Loans

**Fecha:** 21 de marzo de 2026  
**Fuente:** `apps/api/src/core/domain/entities/loan.entity.ts` líneas 27-54

---

## ✅ Valores Exactos en CREATE (Loan.create)

### Código Original (líneas 39-41):
```typescript
return new Loan(
    generateId(),
    institutionId,
    staffId,
    requestedByUserId,
    'active',                              // ← status SIEMPRE es 'active'
    isDocente ? 'pending' : 'approved',    // ← approvalStatus depende del rol
    new Date(),
    null,
    // ...
);
```

---

## 📊 Tabla de Estados Iniciales

| Rol del Usuario | status | approvalStatus | Recursos |
|-----------------|--------|----------------|----------|
| **Docente** | `'active'` | `'pending'` | `'prestado'` |
| **Admin/PIP** | `'active'` | `'approved'` | `'prestado'` |

---

## 🔑 Conclusión Crítica

**Los campos `status` y `approvalStatus` son INDEPENDIENTES:**

1. **status**: Representa el estado físico del préstamo
   - `'active'` = Préstamo en curso (recursos prestados)
   - `'returned'` = Préstamo devuelto
   - `'overdue'` = Préstamo vencido (calculado)

2. **approvalStatus**: Representa la aprobación administrativa
   - `'pending'` = Esperando aprobación (solo docentes)
   - `'approved'` = Aprobado (admin o después de aprobar)
   - `'rejected'` = Rechazado (admin rechazó)

---

## 🔄 Workflow Completo

### Escenario 1: Docente crea préstamo
```
CREATE:
  status = 'active'
  approvalStatus = 'pending'
  recursos = 'prestado'

APPROVE (admin):
  status = 'active'          (sin cambio)
  approvalStatus = 'approved'
  recursos = 'prestado'      (sin cambio)

RETURN:
  status = 'returned'
  approvalStatus = 'approved' (sin cambio)
  recursos = según decisión
```

### Escenario 2: Docente crea préstamo → Admin rechaza
```
CREATE:
  status = 'active'
  approvalStatus = 'pending'
  recursos = 'prestado'

REJECT (admin):
  status = 'active'          (sin cambio)
  approvalStatus = 'rejected'
  recursos = 'disponible'    (liberados)
```

### Escenario 3: Admin crea préstamo
```
CREATE:
  status = 'active'
  approvalStatus = 'approved'
  recursos = 'prestado'

RETURN:
  status = 'returned'
  approvalStatus = 'approved' (sin cambio)
  recursos = según decisión
```

---

## ⚠️ Implicaciones para la Migración

1. **En POST /api/loans:**
   ```typescript
   const loan = {
     status: 'active',  // SIEMPRE 'active' al crear
     approvalStatus: isDocente ? 'pending' : 'approved',
     // ...
   };
   ```

2. **En PATCH /api/loans/:id/approve:**
   ```typescript
   // Solo cambia approvalStatus, status ya es 'active'
   await db.update(loans).set({
     approvalStatus: 'approved',
     // status NO cambia, ya es 'active'
   });
   ```

3. **En PATCH /api/loans/:id/reject:**
   ```typescript
   // Solo cambia approvalStatus, status sigue 'active'
   await db.update(loans).set({
     approvalStatus: 'rejected',
     // status NO cambia, sigue 'active'
   });
   ```

4. **En PATCH /api/loans/:id/return:**
   ```typescript
   // Cambia status, approvalStatus NO cambia
   await db.update(loans).set({
     status: 'returned',
     returnDate: new Date(),
     // approvalStatus NO cambia
   });
   ```

---

## 🎯 Respuesta a la Pregunta Original

**Pregunta:** ¿El status del préstamo es 'active' desde el inicio cuando un docente crea un préstamo?

**Respuesta:** ✅ **SÍ**, el `status` es **SIEMPRE 'active'** al crear un préstamo, independientemente del rol.

**Los campos son independientes:**
- `status` = Estado físico del préstamo ('active', 'returned', 'overdue')
- `approvalStatus` = Aprobación administrativa ('pending', 'approved', 'rejected')

**Un préstamo puede estar:**
- `status='active'` + `approvalStatus='pending'` (docente esperando aprobación)
- `status='active'` + `approvalStatus='approved'` (préstamo aprobado en curso)
- `status='active'` + `approvalStatus='rejected'` (préstamo rechazado pero técnicamente activo)
- `status='returned'` + `approvalStatus='approved'` (préstamo devuelto)

---

## 📝 Código de Referencia

**Método approve() (líneas 60-63):**
```typescript
approve() {
    this.approvalStatus = 'approved';
    this.status = 'active';  // ← Redundante, ya es 'active'
}
```

**Método reject() (líneas 65-67):**
```typescript
reject() {
    this.approvalStatus = 'rejected';
    // status NO cambia, sigue 'active'
}
```

**Método markAsReturned() (líneas 56-59):**
```typescript
markAsReturned() {
    this.status = 'returned';
    this.returnDate = new Date();
    // approvalStatus NO cambia
}
```
