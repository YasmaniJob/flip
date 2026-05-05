# 📋 Plan de Migración: NestJS → Next.js API Route Handlers

**Fecha:** 21 de marzo de 2026  
**Proyecto:** Flip v2  
**Stack:** Next.js 15 + Drizzle ORM + Better Auth + Zod

---

## 🎯 Resumen Ejecutivo

Migración completa del backend NestJS a Next.js API Route Handlers manteniendo:
- ✅ Drizzle ORM (sin cambios)
- ✅ Better Auth (sin cambios)
- ✅ Arquitectura limpia
- ✅ Validaciones Zod (migrar class-validator)

---

## 📦 1. MÓDULOS IDENTIFICADOS (15 módulos)

### 1.1 Módulos Core de Negocio

| Módulo | Controladores | Servicios | Repositorios | Complejidad |
|--------|--------------|-----------|--------------|-------------|
| **Auth** | - | auth.ts | - | 🟡 Media |
| **Users** | users.controller | UsersService | - | 🟢 Baja |
| **Institutions** | institutions.controller | InstitutionsService | - | 🔴 Alta |
| **Dashboard** | dashboard.controller | DashboardService | - | 🟢 Baja |
| **Resources** | resource.controller | - | DrizzleResourceRepository | 🔴 Alta |
| **Categories** | category.controller | - | DrizzleCategoryRepository | 🟡 Media |
| **Templates** | resource-templates.controller | ResourceTemplatesService | - | 🟢 Baja |
| **Staff** | staff.controller | StaffService | - | 🟡 Media |
| **Loans** | loans.controller | - | DrizzleLoanRepository | 🔴 Alta |
| **Reservations** | classroom-reservations.controller | - | DrizzleReservationRepository | 🔴 Alta |
| **Meetings** | meetings.controller | - | DrizzleMeetingRepository | 🟡 Media |
| **Classrooms** | classrooms.controller | - | - | 🟢 Baja |

### 1.2 Módulos de Configuración (Simples - CRUD)

- **Grades** (grados)
- **Sections** (secciones)
- **CurricularAreas** (áreas curriculares)
- **PedagogicalHours** (horas pedagógicas)

---

## 🔐 2. GUARDS Y AUTORIZACIÓN

### Implementación Actual (NestJS)

**AuthGuard:**
- Valida sesión con Better Auth API
- Inyecta `user` y `session` en `request`
- Lanza `UnauthorizedException` si no autenticado

**RolesGuard:**
- Lee metadata `@Roles()` con Reflector
- Compara con `user.role`
- Permite acceso si rol coincide

**Decoradores:**
- `@Roles('admin', 'pip')` - Define roles permitidos
- `@CurrentTenant()` - Extrae institutionId, error si falta
- `@CurrentInstitution()` - Alias de CurrentTenant

### Migración a Next.js

**Estrategia:**
1. Middleware de autenticación global
2. Helper `requireAuth()` para route handlers
3. Helper `requireRole()` para validación de roles
4. Helper `getInstitutionId()` para multi-tenancy

---

## ✅ 3. VALIDACIONES

### Actual: class-validator + Zod

**class-validator (DTOs):**
- `PaginationDto`: @IsNumber, @Min, @Max
- `CreateCategoryDto`: @IsString, @IsOptional
- Pipe: `ValidationPipe` de NestJS

**Zod (Algunos endpoints):**
- `ZodValidationPipe` personalizado
- Esquemas en `@flip/shared`
- Usado en categories controller

### Migración: 100% Zod

**Ventajas:**
- Type-safe en runtime
- Mejor integración con TypeScript
- Validación y parsing en un paso
- Reutilizable en frontend

**Plan:**
1. Crear esquemas Zod para todos los DTOs
2. Helper `validateBody(schema)` para route handlers
3. Mover esquemas a `packages/shared/src/schemas/`

---

## 🧩 4. LÓGICA DE NEGOCIO COMPLEJA

### 4.1 InstitutionsService.onboardUser()

**Complejidad:** 🔴 Alta

**Flujo:**
1. Busca institución por codigoModular
2. Si no existe:
   - Crea institución (manual o desde MINEDU)
   - Auto-seed categorías por defecto
   - Auto-seed plantillas por defecto
3. Asigna rol al usuario:
   - Primer usuario en institución → `superadmin`
   - Resto → `admin`
4. Preserva `isSuperAdmin` si ya existe

**Dependencias:**
- `CreateCategoryCommand`
- `ResourceTemplatesService`
- Constantes: `DEFAULT_CATEGORIES`, `DEFAULT_TEMPLATES`

**Migración:**
- Mantener como función pura
- Usar transacciones Drizzle
- Extraer a `lib/services/onboarding.ts`

### 4.2 StaffService.findAll() con includeAdmins

**Complejidad:** 🟡 Media

**Flujo:**
1. Query paginado de staff
2. Si `includeAdmins=true`:
   - Query usuarios con rol admin/superadmin
   - Mapea a formato Staff
   - Deduplica por ID
   - Mezcla en primera página
3. Retorna con metadata de paginación

**Migración:**
- Función helper `mergeStaffWithAdmins()`
- Considerar usar UNION en SQL para mejor performance

### 4.3 ResourceRepository.update() con Partial Patch

**Complejidad:** 🟡 Media

**Patrón:**
- `toDbPatch()` solo incluye campos definidos (≠ undefined)
- Evita sobrescribir con undefined
- Manejo especial de `maintenanceState` (null es válido)

**Migración:**
- Mantener patrón en helpers
- Función `buildPartialUpdate(data)`

### 4.4 DashboardService - Estadísticas

**Complejidad:** 🟢 Baja

**Métodos:**
- `getSuperAdminStats()`: Métricas globales
- `getInstitutionStats()`: Métricas por institución

**Migración:**
- Queries directas con Drizzle
- Usar `Promise.all()` para paralelizar

### 4.5 ResourceController.getLastDamageReport()

**Complejidad:** 🟡 Media

**Flujo:**
1. Busca préstamos del recurso
2. Filtra por status='returned' y con damageReports
3. Ordena por returnDate DESC
4. Mapea damageReports y suggestionReports
5. Resuelve nombre del reportero (staff o user)

**Migración:**
- Query con joins optimizados
- Helper `resolveDamageReport()`

---

## 🔗 5. DEPENDENCIAS ENTRE MÓDULOS

```
InstitutionsModule
├── CategoriesModule (auto-seed)
└── ResourceTemplatesModule (auto-seed)

ResourceModule
└── CategoriesModule (validación)

LoansModule
└── ResourceModule (actualizar status)

ReservationsModule
├── ClassroomsModule
├── GradesModule
├── SectionsModule
└── PedagogicalHoursModule

MeetingsModule
└── StaffModule (asistencia)
```

**Implicaciones:**
- Migrar módulos base primero (Categories, Grades, etc.)
- Luego módulos que dependen (Resources, Loans)
- Finalmente módulos complejos (Institutions, Reservations)

---

## 📋 6. RESUMEN DE VALIDACIONES

### Validaciones con class-validator (Migrar a Zod)

| DTO | Validaciones | Ubicación |
|-----|-------------|-----------|
| PaginationDto | @IsNumber, @Min(1), @Max(1000) | common/dto/ |
| CreateCategoryDto | @IsString, @IsOptional | categories/dto/ |
| CreateResourceDto | @IsString, @IsOptional, @IsEnum | infrastructure/http/dto/ |
| CreateLoanDto | @IsString, @IsArray, @IsDateString | infrastructure/http/dto/ |
| CreateStaffDto | @IsString, @IsEmail, @IsOptional | staff/dto/ |

### Validaciones con Zod (Ya implementadas)

- `createCategorySchema` - En @flip/shared
- `updateCategorySchema` - En @flip/shared
- Usado con `ZodValidationPipe` en CategoriesController

**Plan de migración:**
1. Crear todos los esquemas Zod en `packages/shared/src/schemas/`
2. Usar helper `validateBody()` en route handlers
3. Eliminar class-validator del proyecto

---

## 🎯 7. ORDEN DE MIGRACIÓN RECOMENDADO

Ver documento detallado: [ORDEN_MIGRACION.md](./ORDEN_MIGRACION.md)

### Resumen por Fases:

**Fase 1 (Semana 1):** Infraestructura Base
- Setup de carpetas
- Helpers de autenticación
- Helpers de validación

**Fase 2 (Semana 1-2):** Módulos Simples (5 módulos)
- Grades, Sections, CurricularAreas, PedagogicalHours, Classrooms
- CRUD básico sin dependencias

**Fase 3 (Semana 2-3):** Módulos Intermedios (5 módulos)
- Users, Dashboard, ResourceTemplates, Categories, Staff
- Lógica de negocio moderada

**Fase 4 (Semana 3-4):** Módulos Complejos (4 módulos)
- Resources, Loans, Reservations, Meetings
- CQRS, workflows, validaciones complejas

**Fase 5 (Semana 4-5):** Módulo Crítico
- Institutions (onboarding, auto-seed, MINEDU)

**Fase 6 (Semana 5):** Testing y Cleanup
- Pruebas integrales
- Eliminación de NestJS

**Timeline total:** 4-5 semanas

---

## 🚀 8. PRÓXIMOS PASOS

### Antes de empezar:
1. ✅ Revisar este análisis con el equipo
2. ✅ Confirmar stack tecnológico (Next.js 15, Drizzle, Better Auth, Zod)
3. ✅ Preparar ambiente de desarrollo
4. ✅ Crear branch de migración

### Inicio de migración:
1. Crear estructura de carpetas (ver [RECOMENDACIONES_MIGRACION.md](./RECOMENDACIONES_MIGRACION.md))
2. Migrar Better Auth config
3. Crear helpers base
4. Empezar con módulo Grades (el más simple)

---

## 📚 Documentos Relacionados

- [ORDEN_MIGRACION.md](./ORDEN_MIGRACION.md) - Plan detallado fase por fase
- [RECOMENDACIONES_MIGRACION.md](./RECOMENDACIONES_MIGRACION.md) - Mejores prácticas y ejemplos
- [ANALISIS_DETALLADO_MODULOS.md](./ANALISIS_DETALLADO_MODULOS.md) - Análisis técnico profundo
- [ROLES_Y_PERMISOS.md](./ROLES_Y_PERMISOS.md) - Sistema de roles actual
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura actual

---

## ❓ Preguntas Frecuentes

### ¿Por qué migrar de NestJS a Next.js?
- Consolidar frontend y backend en un solo proyecto
- Reducir complejidad de deployment
- Aprovechar Server Components y Server Actions
- Mejor integración con el ecosistema React

### ¿Se perderá funcionalidad?
No. Toda la lógica se migrará manteniendo la misma funcionalidad.

### ¿Cambiará la estructura de la base de datos?
No. Drizzle ORM se mantiene igual, solo cambia dónde se ejecutan las queries.

### ¿Qué pasa con Better Auth?
Se mantiene igual, solo se mueve la configuración a Next.js.

### ¿Cuánto tiempo tomará?
Estimado: 4-5 semanas de trabajo dedicado.

---

## 📞 Contacto

Para dudas o aclaraciones sobre este plan de migración, contactar al equipo de desarrollo.
