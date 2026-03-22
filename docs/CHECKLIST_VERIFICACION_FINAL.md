# ✅ Checklist de Verificación Final - Migración Next.js 15

**Fecha**: 21 de Marzo de 2026  
**Propósito**: Verificar que todos los componentes de la migración están funcionando correctamente

---

## 🔍 VERIFICACIÓN DE COMPILACIÓN

### TypeScript
- [ ] Ejecutar `cd apps/web && npx tsc --noEmit`
- [ ] Verificar: 0 errores de TypeScript
- [ ] Verificar: 0 warnings críticos

### Next.js Build
- [ ] Ejecutar `cd apps/web && pnpm build`
- [ ] Verificar: Build exitoso sin errores
- [ ] Verificar: Todos los route handlers compilados
- [ ] Verificar: No hay errores de importación

### Linting
- [ ] Ejecutar `cd apps/web && pnpm lint`
- [ ] Verificar: 0 errores de ESLint
- [ ] Corregir warnings si es necesario

---

## 📡 VERIFICACIÓN DE ENDPOINTS

### Categories (2 endpoints)
- [ ] GET `/api/categories` - Listar categorías
- [ ] POST `/api/categories` - Crear categoría
- [ ] PUT `/api/categories/[id]` - Actualizar categoría
- [ ] DELETE `/api/categories/[id]` - Eliminar categoría

### Classrooms (2 endpoints)
- [ ] GET `/api/classrooms` - Listar aulas
- [ ] POST `/api/classrooms` - Crear aula
- [ ] PUT `/api/classrooms/[id]` - Actualizar aula
- [ ] DELETE `/api/classrooms/[id]` - Eliminar aula

### Classroom Reservations (12 endpoints)
- [ ] GET `/api/classroom-reservations` - Listar reservas
- [ ] POST `/api/classroom-reservations` - Crear reserva
- [ ] GET `/api/classroom-reservations/my-today` - Mis reservas de hoy
- [ ] GET `/api/classroom-reservations/[id]/attendance` - Listar asistencia
- [ ] POST `/api/classroom-reservations/[id]/attendance` - Registrar asistencia
- [ ] PATCH `/api/classroom-reservations/[id]/cancel` - Cancelar reserva
- [ ] POST `/api/classroom-reservations/[id]/reschedule-block` - Reprogramar bloque
- [ ] GET `/api/classroom-reservations/[id]/tasks` - Listar tareas
- [ ] POST `/api/classroom-reservations/[id]/tasks` - Crear tarea
- [ ] PATCH `/api/classroom-reservations/slots/[slotId]` - Marcar asistencia slot
- [ ] POST `/api/classroom-reservations/slots/[slotId]/reschedule` - Reprogramar slot
- [ ] DELETE `/api/classroom-reservations/slots/[slotId]` - Eliminar slot

### Curricular Areas (3 endpoints)
- [ ] GET `/api/curricular-areas` - Listar áreas
- [ ] POST `/api/curricular-areas` - Crear área
- [ ] POST `/api/curricular-areas/seed-standard` - Crear áreas estándar
- [ ] PUT `/api/curricular-areas/[id]` - Actualizar área
- [ ] DELETE `/api/curricular-areas/[id]` - Eliminar área

### Dashboard (2 endpoints)
- [ ] GET `/api/dashboard/institution-stats` - Estadísticas de institución
- [ ] GET `/api/dashboard/super-stats` - Estadísticas de SuperAdmin

### Grades (2 endpoints)
- [ ] GET `/api/grades` - Listar grados
- [ ] POST `/api/grades` - Crear grado
- [ ] PUT `/api/grades/[id]` - Actualizar grado
- [ ] DELETE `/api/grades/[id]` - Eliminar grado

### Institutions (8 endpoints)
- [ ] GET `/api/institutions/departamentos` - Listar departamentos
- [ ] GET `/api/institutions/provincias` - Listar provincias
- [ ] GET `/api/institutions/distritos` - Listar distritos
- [ ] GET `/api/institutions/search` - Buscar instituciones MINEDU
- [ ] GET `/api/institutions/my-institution` - Mi institución
- [ ] PATCH `/api/institutions/my-institution` - Actualizar mi institución
- [ ] POST `/api/institutions/my-institution/brand` - Actualizar branding
- [ ] POST `/api/institutions/onboard` - Completar onboarding
- [ ] GET `/api/institutions/public/branding` - Branding público

### Loans (4 endpoints)
- [ ] GET `/api/loans` - Listar préstamos
- [ ] POST `/api/loans` - Crear préstamo
- [ ] PATCH `/api/loans/[id]/approve` - Aprobar préstamo
- [ ] PATCH `/api/loans/[id]/reject` - Rechazar préstamo
- [ ] PATCH `/api/loans/[id]/return` - Devolver préstamo

### Meetings (7 endpoints)
- [ ] GET `/api/meetings` - Listar reuniones
- [ ] POST `/api/meetings` - Crear reunión
- [ ] GET `/api/meetings/[id]` - Obtener reunión
- [ ] DELETE `/api/meetings/[id]` - Eliminar reunión
- [ ] GET `/api/meetings/[id]/attendance` - Listar asistencia
- [ ] POST `/api/meetings/[id]/attendance` - Registrar asistencia
- [ ] GET `/api/meetings/[id]/tasks` - Listar tareas
- [ ] POST `/api/meetings/[id]/tasks` - Crear tarea

### Pedagogical Hours (2 endpoints)
- [ ] GET `/api/pedagogical-hours` - Listar horas pedagógicas
- [ ] POST `/api/pedagogical-hours` - Crear hora pedagógica
- [ ] PUT `/api/pedagogical-hours/[id]` - Actualizar hora
- [ ] DELETE `/api/pedagogical-hours/[id]` - Eliminar hora

### Resource Templates (2 endpoints)
- [ ] GET `/api/resource-templates` - Listar plantillas
- [ ] POST `/api/resource-templates` - Crear plantilla
- [ ] PUT `/api/resource-templates/[id]` - Actualizar plantilla
- [ ] DELETE `/api/resource-templates/[id]` - Eliminar plantilla

### Resources (5 endpoints)
- [ ] GET `/api/resources` - Listar recursos
- [ ] POST `/api/resources` - Crear recurso
- [ ] POST `/api/resources/batch` - Crear recursos en lote
- [ ] GET `/api/resources/stats` - Estadísticas de recursos
- [ ] PUT `/api/resources/[id]` - Actualizar recurso
- [ ] DELETE `/api/resources/[id]` - Eliminar recurso
- [ ] GET `/api/resources/[id]/last-damage-report` - Último reporte de daño

### Sections (2 endpoints)
- [ ] GET `/api/sections` - Listar secciones
- [ ] POST `/api/sections` - Crear sección
- [ ] PUT `/api/sections/[id]` - Actualizar sección
- [ ] DELETE `/api/sections/[id]` - Eliminar sección

### Staff (4 endpoints)
- [ ] GET `/api/staff` - Listar personal
- [ ] POST `/api/staff` - Crear personal
- [ ] POST `/api/staff/bulk` - Crear personal en lote
- [ ] GET `/api/staff/recurrent` - Personal más recurrente
- [ ] PATCH `/api/staff/[id]` - Actualizar personal
- [ ] DELETE `/api/staff/[id]` - Eliminar personal

### Users (5 endpoints)
- [ ] GET `/api/users` - Listar usuarios
- [ ] GET `/api/users/me` - Mi perfil
- [ ] PATCH `/api/users/me` - Actualizar mi perfil
- [ ] GET `/api/users/me/settings` - Mis configuraciones
- [ ] POST `/api/users/me/settings` - Actualizar configuraciones
- [ ] POST `/api/users/me/password` - Cambiar contraseña
- [ ] POST `/api/users/[id]/toggle-super-admin` - Toggle SuperAdmin

---

## 🔐 VERIFICACIÓN DE AUTENTICACIÓN

### Auth Helpers
- [ ] `requireAuth()` funciona correctamente
- [ ] `requireRole()` valida roles correctamente
- [ ] `getInstitutionId()` retorna institutionId correcto
- [ ] `requireSuperAdmin()` valida SuperAdmin correctamente

### Multi-tenancy
- [ ] Todas las queries filtran por `institutionId`
- [ ] No hay acceso cross-institution
- [ ] SuperAdmin puede acceder a todas las instituciones

### Permisos
- [ ] Roles `admin` y `pip` tienen permisos correctos
- [ ] Rol `docente` tiene permisos limitados
- [ ] SuperAdmin tiene acceso completo

---

## 📊 VERIFICACIÓN DE DATOS

### Validación
- [ ] Schemas de Zod validan correctamente
- [ ] Errores de validación retornan mensajes claros
- [ ] `validateBody()` funciona en todos los endpoints
- [ ] `validateQuery()` funciona en todos los endpoints

### Transacciones
- [ ] Operaciones multi-tabla usan transacciones
- [ ] Rollback funciona en caso de error
- [ ] No hay datos inconsistentes

### Paginación
- [ ] Todos los endpoints GET con lista tienen paginación
- [ ] `page`, `limit`, `total`, `lastPage` están presentes
- [ ] Valores por defecto funcionan correctamente

---

## 🎨 VERIFICACIÓN DE FRONTEND

### API Clients Actualizados
- [ ] `apps/web/src/features/inventory/` usa `/api/`
- [ ] `apps/web/src/features/loans/` usa `/api/`
- [ ] `apps/web/src/features/reservations/` usa `/api/`
- [ ] `apps/web/src/features/settings/` usa `/api/`
- [ ] No hay referencias a `/api/v1/` en módulos migrados

### Componentes
- [ ] Todos los componentes compilan sin errores
- [ ] No hay errores de importación
- [ ] Tipos TypeScript correctos

---

## 🧪 VERIFICACIÓN DE TESTING

### Unit Tests
- [ ] Tests de helpers pasan
- [ ] Tests de utils pasan
- [ ] Tests de validations pasan

### Integration Tests
- [ ] Tests de endpoints pasan
- [ ] Tests de auth pasan
- [ ] Tests de multi-tenancy pasan

### E2E Tests
- [ ] Flujos principales funcionan
- [ ] No hay errores en consola
- [ ] Performance aceptable

---

## 📝 VERIFICACIÓN DE DOCUMENTACIÓN

### Documentos de Fases
- [ ] `FASE2_MODULOS_SIMPLES_COMPLETADA.md` existe
- [ ] `FASE3_MODULOS_INTERMEDIOS_COMPLETADA.md` existe
- [ ] `FASE4_MODULOS_COMPLEJOS_COMPLETADA.md` existe
- [ ] `FASE5_INSTITUTIONS_COMPLETADA.md` existe
- [ ] `FASE6_TESTING_CLEANUP_COMPLETADA.md` existe
- [ ] `FASE7_ACTUALIZACION_COMPLETADA.md` existe

### Documentos de Análisis
- [ ] Análisis de cada módulo complejo existe
- [ ] Diagramas de flujo actualizados
- [ ] Ejemplos de código actualizados

### Documentos de Corrección
- [ ] `ERRORES_TYPESCRIPT_NEXTJS15.md` existe
- [ ] `CORRECCION_ERRORES_COMPLETADA.md` existe
- [ ] `ESTADO_CORRECCION_ERRORES.md` actualizado

### Documentos Finales
- [ ] `MIGRACION_NEXTJS_COMPLETADA.md` existe
- [ ] `CHECKLIST_VERIFICACION_FINAL.md` existe (este archivo)
- [ ] README actualizado con nueva arquitectura

---

## 🚀 VERIFICACIÓN DE DEPLOYMENT

### Preparación
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] Secrets configurados

### Build
- [ ] Build de producción exitoso
- [ ] Tamaño de bundle aceptable
- [ ] No hay warnings críticos

### Performance
- [ ] Tiempo de respuesta < 200ms
- [ ] Queries optimizadas
- [ ] Caching configurado

---

## 🔧 VERIFICACIÓN DE HERRAMIENTAS

### Drizzle ORM
- [ ] Schema actualizado
- [ ] Migraciones aplicadas
- [ ] Relaciones funcionando correctamente

### Better Auth
- [ ] Sesiones funcionando
- [ ] OAuth configurado (si aplica)
- [ ] Password reset funcionando

### Zod
- [ ] Schemas validando correctamente
- [ ] Mensajes de error claros
- [ ] Tipos TypeScript correctos

---

## 📈 MÉTRICAS DE CALIDAD

### Code Quality
- [ ] No hay código duplicado
- [ ] Funciones pequeñas y enfocadas
- [ ] Nombres descriptivos

### Type Safety
- [ ] No hay `any` types
- [ ] Todos los tipos explícitos
- [ ] No hay type assertions innecesarios

### Error Handling
- [ ] Todos los errores manejados
- [ ] Mensajes de error claros
- [ ] Logging apropiado

---

## ✅ APROBACIÓN FINAL

### Checklist Completado
- [ ] Todos los items verificados
- [ ] Todos los tests pasando
- [ ] Documentación completa

### Firma de Aprobación
- [ ] **Desarrollador**: _______________
- [ ] **Tech Lead**: _______________
- [ ] **QA**: _______________

### Fecha de Aprobación
- [ ] **Fecha**: _______________

---

## 📞 CONTACTO Y SOPORTE

### En caso de problemas:
1. Revisar documentación en `docs/`
2. Verificar logs de errores
3. Consultar con el equipo de desarrollo

### Recursos:
- **Documentación**: `docs/MIGRACION_NEXTJS_COMPLETADA.md`
- **Errores comunes**: `docs/ERRORES_TYPESCRIPT_NEXTJS15.md`
- **Patrones**: `docs/EJEMPLOS_MIGRACION.md`

---

**Última actualización**: 21 de Marzo de 2026  
**Versión**: 1.0  
**Estado**: ✅ LISTA PARA VERIFICACIÓN
