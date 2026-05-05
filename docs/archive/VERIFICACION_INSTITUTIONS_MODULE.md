# ✅ Verificación: Módulo Institutions

**Fecha:** 21 de marzo de 2026  
**Estado:** ✅ COMPLETADO

---

## 📦 Archivos Creados

### Constantes (2 archivos)
- ✅ `apps/web/src/lib/constants/default-categories.ts` - 15 categorías default
- ✅ `apps/web/src/lib/constants/default-templates.ts` - ~70 templates por categoría

### Esquemas Zod (1 archivo)
- ✅ `apps/web/src/lib/validations/schemas/institutions.ts`
  - onboardSchema (con validación condicional para isManual)
  - searchQuerySchema
  - updateBrandSchema

### Route Handlers (8 archivos)
- ✅ `apps/web/src/app/api/institutions/onboard/route.ts` (POST)
- ✅ `apps/web/src/app/api/institutions/my-institution/route.ts` (GET)
- ✅ `apps/web/src/app/api/institutions/my-institution/brand/route.ts` (POST)
- ✅ `apps/web/src/app/api/institutions/search/route.ts` (GET)
- ✅ `apps/web/src/app/api/institutions/departamentos/route.ts` (GET)
- ✅ `apps/web/src/app/api/institutions/provincias/route.ts` (GET)
- ✅ `apps/web/src/app/api/institutions/distritos/route.ts` (GET)
- ✅ `apps/web/src/app/api/institutions/public/branding/route.ts` (GET)

**Total:** 11 archivos

---

## 🎯 Endpoints Implementados (8 total)

### Core (Autenticados)
1. ✅ POST `/api/institutions/onboard` - Onboarding de usuarios (CRÍTICO)
2. ✅ GET `/api/institutions/my-institution` - Institución del usuario
3. ✅ POST `/api/institutions/my-institution/brand` - Actualizar branding

### Búsqueda MINEDU (Públicos)
4. ✅ GET `/api/institutions/search` - Búsqueda con filtros y paginación
5. ✅ GET `/api/institutions/departamentos` - Lista departamentos únicos
6. ✅ GET `/api/institutions/provincias` - Lista provincias por departamento
7. ✅ GET `/api/institutions/distritos` - Lista distritos por provincia

### Branding (Público)
8. ✅ GET `/api/institutions/public/branding` - Branding público por ID

---

## ✅ Validaciones Implementadas

### Onboard (CRÍTICO)
- ✅ Usuario NO debe tener `institutionId` ya asignado
- ✅ Si `isManual=false`: validar que existe en MINEDU
- ✅ Si `isManual=true`: validar que `nombre` esté presente (Zod refine)
- ✅ Transacción: INSERT institution + UPDATE user (atómico)
- ✅ Seeding FUERA de transacción con try-catch
- ✅ `isFirstUserInSystem`: conteo === 1 (usuario ya existe)
- ✅ Preservar `isSuperAdmin` existente
- ✅ Slug único con sufijo random (5 caracteres)
- ✅ Trial de 15 días calculado correctamente

### Seeding Automático
- ✅ 15 categorías default creadas
- ✅ ~70 templates creados por categoría
- ✅ Try-catch: log error pero NO fallar onboard
- ✅ Console.log para debugging

### Búsqueda MINEDU
- ✅ Multi-palabra: cada palabra con OR en nombre/código
- ✅ Filtros acumulativos con AND
- ✅ Limit máximo 100, default 20
- ✅ Offset default 0
- ✅ Total count para paginación
- ✅ Ordenamiento alfabético por nombre

### Branding
- ✅ Spread operator para preservar settings existentes
- ✅ Permitir null para resetear branding
- ✅ Validar que usuario tenga institutionId

### Endpoints Públicos
- ✅ NO usan `requireAuth()`
- ✅ Search, departamentos, provincias, distritos, branding son públicos

---

## 🔍 Verificación de Patrones

### Auth & Roles
- ✅ Onboard: `requireAuth()` (cualquier autenticado sin institutionId)
- ✅ My-institution: `requireAuth()` + validar institutionId
- ✅ Brand: `requireAuth()` + validar institutionId
- ✅ Públicos: NO usan `requireAuth()`

### Validación
- ✅ `validateBody` con schemas Zod
- ✅ `validateQuery` para query params
- ✅ Mensajes de error en español
- ✅ Validación condicional en onboardSchema (refine)

### Responses
- ✅ `successResponse(data, status)` con status codes correctos
- ✅ `errorResponse(error)` en catch blocks
- ✅ Status 201 para POST onboard

### Errors
- ✅ `ValidationError` para validaciones de negocio
- ✅ `UnauthorizedError` para auth
- ✅ `NotFoundError` para recursos no encontrados
- ✅ Mensajes claros y específicos

### Transacciones
- ✅ Onboard: `db.transaction()` para INSERT + UPDATE
- ✅ Seeding fuera de transacción
- ✅ Atomicidad garantizada

---

## 🔥 Flujo Onboard Verificado

### Paso 1: Validaciones Iniciales
- ✅ Usuario autenticado
- ✅ Usuario NO tiene institutionId

### Paso 2: Buscar Institución Existente
- ✅ Query por codigoModular

### Paso 3: Si NO existe, crear
#### 3A. Determinar datos
- ✅ Si isManual=true: usar datos del body
- ✅ Si isManual=false: lookup en educationInstitutionsMinedu
- ✅ Error si no existe en MINEDU

#### 3B. Generar slug único
- ✅ Normalizar nombre
- ✅ Agregar sufijo random de 5 caracteres

#### 3C. Calcular trial
- ✅ 15 días desde hoy

#### 3D. TRANSACCIÓN
- ✅ INSERT institution
- ✅ Contar usuarios en institución (0 para nueva)
- ✅ Contar usuarios totales (>= 1, usuario ya existe)
- ✅ Obtener usuario actual
- ✅ Determinar rol: 'superadmin' si primero, 'admin' si no
- ✅ Determinar isSuperAdmin: true si primero del sistema O ya lo tenía
- ✅ UPDATE user con institutionId, role, isSuperAdmin

#### 3E. SEEDING (fuera de transacción)
- ✅ Try-catch separado
- ✅ Loop de 15 categorías
- ✅ Loop de templates por categoría
- ✅ Console.log de progreso
- ✅ Console.error si falla, pero continuar

### Paso 4: Si existe, solo actualizar usuario
- ✅ Contar usuarios en institución
- ✅ Contar usuarios totales
- ✅ Obtener usuario actual
- ✅ Determinar rol y isSuperAdmin
- ✅ UPDATE user

### Paso 5: Retornar institución
- ✅ Status 201

---

## 🧪 Casos de Prueba Críticos

### Onboard
1. ✅ Crear institución nueva (MINEDU lookup)
2. ✅ Crear institución nueva (manual)
3. ✅ Unirse a institución existente
4. ✅ Primer usuario → role='superadmin', isSuperAdmin=true
5. ✅ Segundo usuario → role='admin', isSuperAdmin=false
6. ✅ Error si usuario ya tiene institutionId
7. ✅ Error si isManual=false y no existe en MINEDU
8. ✅ Seeding de 15 categorías
9. ✅ Seeding de ~70 templates
10. ✅ Seeding falla pero onboard continúa

### Search
1. ✅ Búsqueda por nombre
2. ✅ Búsqueda por código
3. ✅ Búsqueda multi-palabra ("San Juan")
4. ✅ Filtros combinados (nivel + departamento)
5. ✅ Paginación (limit, offset)
6. ✅ Total count correcto

### Branding
1. ✅ Actualizar brandColor
2. ✅ Actualizar logoUrl
3. ✅ Actualizar ambos
4. ✅ Resetear con null
5. ✅ Preservar otros settings
6. ✅ Branding público sin auth

### Ubicaciones
1. ✅ Listar departamentos
2. ✅ Listar provincias por departamento
3. ✅ Listar distritos por provincia
4. ✅ Validar parámetros requeridos

---

## 📊 Comparación con NestJS

| Aspecto | NestJS | Next.js | Estado |
|---------|--------|---------|--------|
| Endpoints | 8 | 8 | ✅ Completo |
| Onboarding | Service | Route | ✅ Migrado |
| Seeding | Inline | Separado | ✅ Mejorado |
| Transacción | Sí | Sí | ✅ Migrado |
| Búsqueda | Tabla local | Tabla local | ✅ Migrado |
| Validación | class-validator | Zod | ✅ Migrado |
| Auth | Guards | requireAuth | ✅ Migrado |
| Públicos | No guard | No auth | ✅ Migrado |

---

## 🎉 Resumen

- ✅ 8 endpoints implementados
- ✅ 11 archivos creados
- ✅ 0 errores funcionales
- ✅ Transacción correcta (solo INSERT + UPDATE)
- ✅ Seeding fuera de transacción
- ✅ isFirstUserInSystem correcto (=== 1)
- ✅ Todos los patrones aplicados correctamente
- ✅ Endpoints públicos sin auth
- ✅ Multi-tenancy garantizado

**Módulo Institutions: COMPLETADO** 🚀

---

## 🚨 Notas Importantes

1. **Seeding NO falla onboard**: Try-catch separado, solo log error
2. **Transacción mínima**: Solo INSERT institution + UPDATE user
3. **isFirstUserInSystem**: Conteo === 1 (usuario ya existe)
4. **Slug único**: Sufijo random para evitar duplicados
5. **Endpoints públicos**: Search, departamentos, provincias, distritos, branding
6. **Preservar settings**: Spread operator en branding
7. **Multi-palabra**: Split y OR en búsqueda

---

## 📚 Referencias

- Análisis: `docs/ANALISIS_INSTITUTIONS_MODULE.md`
- Controller NestJS: `apps/api/src/institutions/institutions.controller.ts`
- Service NestJS: `apps/api/src/institutions/institutions.service.ts`
- Constantes: `apps/api/src/categories/constants/default-categories.const.ts`
- Templates: `apps/api/src/resource-templates/constants/default-templates.const.ts`
- Schema Drizzle: `apps/web/src/lib/db/schema.ts`
