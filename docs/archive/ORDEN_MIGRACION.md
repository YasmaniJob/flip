# 🗺️ Orden de Migración Módulo por Módulo

## 📊 Criterios de Ordenamiento

1. **Dependencias:** Módulos sin dependencias primero
2. **Complejidad:** Simples antes que complejos
3. **Riesgo:** Bajo riesgo primero
4. **Uso:** Menos críticos primero

---

## 🎯 FASE 1: Infraestructura Base (Semana 1)

### 1.1 Setup Inicial
- [ ] Crear estructura de carpetas en `apps/web/src/`
  ```
  src/
  ├── lib/
  │   ├── auth/          # Helpers de autenticación
  │   ├── db/            # Cliente Drizzle (ya existe)
  │   ├── validations/   # Esquemas Zod
  │   └── services/      # Lógica de negocio reutilizable
  └── app/
      └── api/           # Route handlers
  ```

- [ ] Migrar Better Auth config
  - Mover `apps/api/src/auth/auth.ts` → `apps/web/src/lib/auth/index.ts`
  - Actualizar imports de schema

- [ ] Crear helpers de autenticación
  ```typescript
  // lib/auth/helpers.ts
  export async function requireAuth(request: Request)
  export async function requireRole(request: Request, roles: string[])
  export async function getInstitutionId(request: Request)
  ```

- [ ] Crear helpers de validación
  ```typescript
  // lib/validations/helpers.ts
  export function validateBody<T>(schema: ZodSchema<T>, body: unknown)
  export function validateQuery<T>(schema: ZodSchema<T>, params: URLSearchParams)
  ```

**Tiempo estimado:** 2-3 días

---

## 🟢 FASE 2: Módulos Simples (Semana 1-2)

### 2.1 Grades (Grados)
**Complejidad:** 🟢 Baja  
**Endpoints:** 4 (GET, POST, PUT, DELETE)  
**Dependencias:** Ninguna

**Pasos:**
1. Crear esquemas Zod en `packages/shared/src/schemas/grades.ts`
2. Crear route handlers en `app/api/grades/`
3. Migrar queries Drizzle directamente
4. Probar con frontend existente

**Archivos a crear:**
- `app/api/grades/route.ts` (GET, POST)
- `app/api/grades/[id]/route.ts` (PUT, DELETE)

### 2.2 Sections (Secciones)
**Complejidad:** 🟢 Baja  
**Similar a Grades**

### 2.3 CurricularAreas (Áreas Curriculares)
**Complejidad:** 🟢 Baja  
**Similar a Grades**

### 2.4 PedagogicalHours (Horas Pedagógicas)
**Complejidad:** 🟢 Baja  
**Similar a Grades**

### 2.5 Classrooms (Aulas)
**Complejidad:** 🟢 Baja  
**Similar a Grades**

**Tiempo estimado:** 3-4 días (todos los módulos simples)

---

## 🟡 FASE 3: Módulos Intermedios (Semana 2-3)

### 3.1 Users
**Complejidad:** 🟡 Media  
**Endpoints:** 5  
**Lógica especial:** 
- `isFirstUser()` - Verificar si es primer usuario
- `toggleSuperAdmin()` - Solo para SuperAdmin
- `updateSettings()` - Merge de settings JSON

**Pasos:**
1. Crear esquemas Zod
2. Migrar `UsersService` → `lib/services/users.ts`
3. Crear route handlers
4. Validar permisos con `requireRole()`

### 3.2 Dashboard
**Complejidad:** 🟡 Media  
**Endpoints:** 2  
**Lógica:** Queries agregadas con `count()` y `Promise.all()`

**Pasos:**
1. Migrar `DashboardService` → `lib/services/dashboard.ts`
2. Crear route handlers
3. Optimizar queries con Drizzle

### 3.3 ResourceTemplates
**Complejidad:** 🟡 Media  
**Endpoints:** 4 (CRUD)  
**Lógica:** Paginación con `PaginationDto`

**Pasos:**
1. Crear esquema Zod para paginación
2. Migrar servicio
3. Crear route handlers

### 3.4 Categories
**Complejidad:** 🟡 Media  
**Endpoints:** 4 (CRUD)  
**Lógica especial:**
- Auto-seed de templates al crear categoría
- Validación de recursos asociados antes de eliminar

**Pasos:**
1. Migrar `CreateCategoryCommand` → función pura
2. Migrar `DrizzleCategoryRepository` → helpers
3. Crear route handlers con auto-seed

### 3.5 Staff
**Complejidad:** 🟡 Media  
**Endpoints:** 6  
**Lógica especial:**
- `findAll()` con `includeAdmins` (mezcla staff + users admin)
- `findRecurrent()` con GROUP BY
- Validación de duplicados (email, DNI)

**Pasos:**
1. Crear helper `mergeStaffWithAdmins()`
2. Migrar validaciones a Zod
3. Crear route handlers

**Tiempo estimado:** 5-6 días

---

## 🔴 FASE 4: Módulos Complejos (Semana 3-4)

### 4.1 Resources (Inventario)
**Complejidad:** 🔴 Alta  
**Endpoints:** 7  
**Arquitectura:** CQRS (Commands + Queries)  
**Lógica especial:**
- Batch creation con secuencias atómicas
- Partial updates con `toDbPatch()`
- Mantenimiento con progress tracking
- `getLastDamageReport()` con joins complejos

**Pasos:**
1. Migrar entidad `Resource` → `lib/domain/resource.ts`
2. Migrar repositorio → `lib/repositories/resources.ts`
3. Migrar Commands → funciones puras en `lib/services/resources/`
4. Migrar Queries → funciones puras
5. Crear route handlers que orquestan

**Archivos a crear:**
- `app/api/resources/route.ts`
- `app/api/resources/[id]/route.ts`
- `app/api/resources/batch/route.ts`
- `app/api/resources/stats/route.ts`
- `app/api/resources/[id]/last-damage-report/route.ts`

### 4.2 Loans (Préstamos)
**Complejidad:** 🔴 Alta  
**Endpoints:** 8  
**Lógica especial:**
- Workflow: pending → approved/rejected → active → returned/overdue
- Actualización de status de recursos
- Damage reports y suggestion reports (JSON)
- Missing resources tracking

**Pasos:**
1. Migrar entidad `Loan`
2. Migrar repositorio
3. Migrar Commands (create, approve, reject, return)
4. Crear route handlers con validación de workflow

### 4.3 Reservations (Reservas de Aulas)
**Complejidad:** 🔴 Alta  
**Endpoints:** 10  
**Lógica especial:**
- Slots individuales (fecha + hora pedagógica)
- Validación de conflictos (unique constraint)
- Rescheduling de slots y bloques
- Asistencia por slot
- Attendance y tasks para workshops

**Pasos:**
1. Migrar entidad `Reservation`
2. Migrar Commands (create, cancel, reschedule, markAttendance)
3. Validar conflictos antes de crear
4. Crear route handlers

### 4.4 Meetings (Reuniones)
**Complejidad:** 🟡 Media  
**Endpoints:** 8  
**Lógica especial:**
- Attendance tracking
- Tasks (acuerdos) con asignación
- Involved actors y areas (JSON arrays)

**Pasos:**
1. Migrar entidad `Meeting`
2. Migrar Commands
3. Crear route handlers

**Tiempo estimado:** 7-8 días

---

## 🏢 FASE 5: Módulo Crítico (Semana 4-5)

### 5.1 Institutions (Onboarding)
**Complejidad:** 🔴 Muy Alta  
**Endpoints:** 6  
**Lógica especial:**
- Búsqueda MINEDU con filtros complejos
- Onboarding con auto-seed de categorías y templates
- Asignación de roles (primer usuario = superadmin)
- Actualización de branding

**Pasos:**
1. Migrar `InstitutionsService` → `lib/services/institutions.ts`
2. Extraer `onboardUser()` como función transaccional
3. Migrar búsqueda MINEDU con paginación
4. Crear route handlers

**Archivos a crear:**
- `app/api/institutions/search/route.ts`
- `app/api/institutions/onboard/route.ts`
- `app/api/institutions/[id]/route.ts`
- `app/api/institutions/[id]/brand/route.ts`
- `app/api/institutions/departamentos/route.ts`
- `app/api/institutions/provincias/route.ts`
- `app/api/institutions/distritos/route.ts`

**Tiempo estimado:** 3-4 días

---

## ✅ FASE 6: Testing y Cleanup (Semana 5)

### 6.1 Testing
- [ ] Probar todos los endpoints con Postman/Thunder Client
- [ ] Validar autenticación y autorización
- [ ] Verificar multi-tenancy (institutionId)
- [ ] Probar validaciones Zod
- [ ] Testing de integración con frontend

### 6.2 Cleanup
- [ ] Eliminar carpeta `apps/api/`
- [ ] Actualizar `package.json` (remover deps de NestJS)
- [ ] Actualizar documentación
- [ ] Actualizar README

**Tiempo estimado:** 2-3 días

---

## 📅 Timeline Total

| Fase | Duración | Acumulado |
|------|----------|-----------|
| Fase 1: Infraestructura | 2-3 días | 3 días |
| Fase 2: Módulos Simples | 3-4 días | 7 días |
| Fase 3: Módulos Intermedios | 5-6 días | 13 días |
| Fase 4: Módulos Complejos | 7-8 días | 21 días |
| Fase 5: Institutions | 3-4 días | 25 días |
| Fase 6: Testing y Cleanup | 2-3 días | 28 días |

**Total estimado:** 4-5 semanas (20-25 días hábiles)

---

## 🚨 Riesgos y Mitigaciones

### Riesgo 1: Pérdida de funcionalidad
**Mitigación:** Migrar endpoint por endpoint, probar antes de eliminar NestJS

### Riesgo 2: Problemas de autenticación
**Mitigación:** Probar Better Auth en Next.js primero (Fase 1)

### Riesgo 3: Performance de queries
**Mitigación:** Usar mismas queries Drizzle, optimizar después

### Riesgo 4: Validaciones inconsistentes
**Mitigación:** Crear esquemas Zod completos antes de migrar

---

## 📝 Checklist por Módulo

Para cada módulo:
- [ ] Crear esquemas Zod
- [ ] Migrar lógica de negocio a funciones puras
- [ ] Crear route handlers
- [ ] Agregar validación de autenticación
- [ ] Agregar validación de roles
- [ ] Agregar validación de institutionId
- [ ] Probar con frontend
- [ ] Documentar cambios