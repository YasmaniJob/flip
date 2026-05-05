# Análisis de Limpieza del Monorepo

## PASO 1 - Verificación de apps/web es autosuficiente ✅

### Resultado: apps/web NO importa nada de apps/api

**Búsquedas realizadas:**
- ✅ No hay imports directos de `apps/api`
- ✅ No hay imports con alias `@/api/` o `@api/`
- ✅ No hay referencias relativas a `apps/api`

**Conclusión:** apps/web es completamente independiente de apps/api.

---

## PASO 2 - Verificación de packages/shared ⚠️

### Resultado: apps/web SÍ usa packages/shared

**Archivos que importan de @flip/shared:**

1. **Staff (3 archivos):**
   - `apps/web/src/features/staff/hooks/use-staff.ts` → `CreateStaffInput`
   - `apps/web/src/features/staff/components/import-staff-dialog.tsx` → `CreateStaffInput`
   - `apps/web/src/features/staff/components/add-staff-dialog.tsx` → `createStaffSchema, CreateStaffInput`

2. **Inventory (5 archivos):**
   - `apps/web/src/features/inventory/components/inventory-stats.tsx` → `RESOURCE_STATUS`
   - `apps/web/src/features/inventory/components/resource-card.tsx` → `RESOURCE_STATUS`
   - `apps/web/src/features/inventory/components/resource-dialog.tsx` → `RESOURCE_STATUS_OPTIONS, RESOURCE_CONDITION_OPTIONS`
   - `apps/web/src/features/inventory/components/wizard-step-2.tsx` → `RESOURCE_CONDITION_OPTIONS`
   - `apps/web/src/features/inventory/components/resource-table.tsx` → `RESOURCE_STATUS`

3. **Auth/Roles (2 archivos):**
   - `apps/web/src/hooks/use-user-role.ts` → `UserRole, ROLES`
   - `apps/web/src/components/role-guard.tsx` → `UserRole`

### ¿Qué exporta packages/shared que se usa?

**Constantes (más usado):**
- `RESOURCE_STATUS` - Estados de recursos (disponible, prestado, mantenimiento, baja)
- `RESOURCE_STATUS_OPTIONS` - Opciones con labels y colores
- `RESOURCE_CONDITION_OPTIONS` - Opciones de condición con estrellas
- `USER_ROLES / ROLES` - Roles del sistema
- `UserRole` - Tipo de rol

**Validators:**
- `createStaffSchema` - Schema de validación para crear staff
- `CreateStaffInput` - Tipo inferido del schema

**NO se usa:**
- Types (interfaces de User, Institution, Category, etc.)
- Domain entities
- Utils
- Otros validators

---

## PASO 3 - Qué se puede eliminar de forma segura

### ✅ ELIMINAR COMPLETAMENTE (100% seguro):

#### 1. apps/api/ (TODO el directorio)
**Razón:** No se usa en ningún lado, toda la lógica fue migrada a apps/web

**Contenido:**
- Toda la arquitectura hexagonal de NestJS
- Controllers, services, repositories
- Drizzle migrations antiguas
- Tests e2e
- Scripts de database

**Tamaño estimado:** ~500+ archivos

---

### ⚠️ MANTENER (necesario para apps/web):

#### 1. packages/shared/
**Razón:** apps/web lo usa activamente

**Pero se puede SIMPLIFICAR:**

**Mantener:**
- `src/constants/index.ts` - RESOURCE_STATUS, RESOURCE_CONDITION, USER_ROLES
- `src/validators/index.ts` - Solo createStaffSchema y tipos relacionados

**Eliminar (no se usan):**
- `src/types/index.ts` - Interfaces no usadas
- `src/domain/` - Entities, value objects, errors
- `src/utils/` - Utilidades no usadas
- Validators no usados (login, register, resource, loan, category, etc.)

---

### 📋 ARCHIVOS DE CONFIGURACIÓN A REVISAR:

#### 1. turbo.json
**Acción:** Eliminar referencias a `apps/api`

#### 2. pnpm-workspace.yaml
**Acción:** Mantener como está (apps/* y packages/*)

#### 3. package.json (raíz)
**Acción:** Mantener como está

#### 4. vercel.json
**Acción:** Ya está configurado correctamente para apps/web

---

## RESUMEN DE ELIMINACIÓN SEGURA

### Directorios completos a eliminar:
```
apps/api/                          # ~500 archivos
```

### Archivos dentro de packages/shared a eliminar:
```
packages/shared/src/types/         # Interfaces no usadas
packages/shared/src/domain/        # Entities, value objects
packages/shared/src/utils/         # Utilidades no usadas
```

### Simplificar en packages/shared/src/validators/index.ts:
- Mantener solo: createStaffSchema, CreateStaffInput
- Eliminar: todos los demás schemas y tipos

### Simplificar en packages/shared/src/constants/index.ts:
- Mantener: RESOURCE_STATUS, RESOURCE_CONDITION, USER_ROLES, opciones relacionadas
- Eliminar: LOAN_STATUS, SUBSCRIPTION_STATUS, PLANS, etc. (si no se usan)

---

## IMPACTO EN VERCEL DEPLOYMENT

### Beneficios de la limpieza:
1. ✅ Reduce tamaño del repositorio
2. ✅ Build más rápido (menos archivos a procesar)
3. ✅ Menos confusión sobre qué código es activo
4. ✅ Menor uso de espacio en Vercel

### Sin riesgos:
- apps/web no tiene dependencias de apps/api
- packages/shared se mantiene (con limpieza opcional)
- Configuración de Vercel ya apunta a apps/web

---

## RECOMENDACIÓN FINAL

### Acción inmediata (antes de deploy):
1. **Eliminar apps/api/** - 100% seguro, no se usa
2. **Actualizar turbo.json** - Quitar referencias a apps/api

### Acción opcional (después de deploy exitoso):
1. Simplificar packages/shared (mantener solo lo usado)
2. Esto puede hacerse después sin afectar el deployment

### Orden de ejecución:
```bash
# 1. Eliminar apps/api
rm -rf apps/api

# 2. Actualizar turbo.json (quitar apps/api)

# 3. Commit y push
git add .
git commit -m "Clean monorepo: remove unused apps/api"
git push

# 4. Deploy en Vercel
```

---

## VERIFICACIÓN POST-LIMPIEZA

Después de eliminar apps/api, verificar:
- [ ] `pnpm install` funciona
- [ ] `cd apps/web && pnpm build` funciona
- [ ] No hay errores de imports faltantes
- [ ] Git push exitoso
- [ ] Vercel deploy exitoso
