# Migración de Schema a Neon - Estado Actual

## Fecha
21 de marzo de 2026

## Objetivo
Migrar el schema de la base de datos local (PostgreSQL) a Neon (producción), excluyendo la tabla `education_institutions_minedu` que irá a Turso posteriormente.

## Estado: ✅ COMPLETADA - 21 de marzo de 2026

**Ver documento completo**: [MIGRACION_NEON_COMPLETADA.md](./MIGRACION_NEON_COMPLETADA.md)

## Acciones Completadas

### 1. Configuración de Neon ✅
- **Archivo**: `apps/web/.env.local`
- **Variable agregada**: 
  ```env
  DATABASE_URL=postgresql://neondb_owner:npg_kgcCKJuwpF63@ep-jolly-wave-acz30twt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ```

### 2. Configuración de Drizzle Kit ✅
- **Archivo**: `apps/web/drizzle.config.ts`
- **Configuración**:
  - Schema: `./src/lib/db/schema.ts`
  - Dialect: `postgresql`
  - Carga de variables desde `.env.local` con `dotenv`
  - Validación de `DATABASE_URL`

### 3. Exclusión de Tabla MINEDU ✅
- **Archivo**: `apps/web/src/lib/db/schema.ts`
- **Acción**: Comentada la tabla `education_institutions_minedu` (líneas 8-26)
- **Razón**: Esta tabla NO debe ir a Neon, irá a Turso después
- **Nota agregada**: 
  ```typescript
  // NOTA: Esta tabla NO se migra a Neon - irá a Turso después
  ```

### 4. Intento de Push ⏸️
- **Comando ejecutado**: `pnpm drizzle-kit push`
- **Resultado**: Usuario canceló la operación (abortado)
- **Estado**: Drizzle-kit mostró preview de cambios pero no se confirmó

## Tablas que se Migrarán a Neon (23 tablas)

### Autenticación y Usuarios (4 tablas)
1. `institutions` - Instituciones educativas (multi-tenant)
2. `users` - Usuarios del sistema
3. `sessions` - Sesiones de Better Auth
4. `accounts` - Cuentas OAuth de Better Auth
5. `verification` - Verificación de email y reset de contraseña

### Gestión de Recursos (5 tablas)
6. `categories` - Categorías de recursos
7. `category_sequences` - Secuencias para IDs de recursos
8. `resource_templates` - Plantillas de recursos
9. `resources` - Recursos físicos (laptops, tablets, etc.)
10. `staff` - Personal docente y administrativo

### Préstamos (2 tablas)
11. `loans` - Préstamos de recursos
12. `loan_resources` - Relación many-to-many entre préstamos y recursos

### Configuración Académica (4 tablas)
13. `curricular_areas` - Áreas curriculares
14. `grades` - Grados académicos
15. `sections` - Secciones por grado
16. `pedagogical_hours` - Horas pedagógicas

### Reservas de Aulas (5 tablas)
17. `classrooms` - Aulas físicas (AIP, Labs)
18. `classroom_reservations` - Reservas de aulas
19. `reservation_slots` - Slots de tiempo para reservas
20. `reservation_attendance` - Asistencia a talleres
21. `reservation_tasks` - Tareas/acuerdos de talleres

### Reuniones (3 tablas)
22. `meeting_attendance` - Asistencia a reuniones
23. `meeting_tasks` - Tareas/acuerdos de reuniones
24. `meetings` - Reuniones de asistencia técnica

## Tabla Excluida

### NO se migra a Neon:
- `education_institutions_minedu` - Registro de instituciones MINEDU (55,141 registros, 11 MB)
  - **Razón**: Irá a Turso (base de datos edge) posteriormente
  - **Estado en schema**: Comentada
  - **Ubicación actual**: Base de datos local PostgreSQL

## Próximos Pasos

### Opción 1: Confirmar Push a Neon
Si el usuario desea proceder con la migración:

```bash
cd apps/web
pnpm drizzle-kit push
# Cuando pregunte, responder: Yes
```

**Resultado esperado**:
- 23 tablas creadas en Neon
- Schema completo migrado (sin datos)
- `education_institutions_minedu` NO se crea

### Opción 2: Revisar Schema Antes de Push
Si el usuario desea revisar el schema:

```bash
cd apps/web
pnpm drizzle-kit push --dry-run
```

### Opción 3: Verificar Conexión a Neon
Si hay dudas sobre la conexión:

```bash
cd apps/web
pnpm drizzle-kit studio
```

## Verificación Post-Push

Una vez confirmado el push, verificar:

1. **Cantidad de tablas creadas**: Debe ser 23 tablas
2. **Tabla MINEDU NO creada**: Confirmar que `education_institutions_minedu` NO existe en Neon
3. **Estructura correcta**: Verificar índices y constraints

### Query de Verificación (ejecutar en Neon):
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Resultado esperado**: 23 tablas listadas, sin `education_institutions_minedu`

## Notas Importantes

### ⚠️ Advertencias
- Esta migración solo crea la estructura (schema), NO migra datos
- Los datos permanecen en la base de datos local
- La tabla `education_institutions_minedu` permanece comentada en el schema
- Para migrar datos, se necesitará un proceso separado

### 📋 Datos Actuales en Local
- Base de datos: `flip_v2`
- Tamaño total: 12.45 MB
- Tabla más grande: `education_institutions_minedu` (11 MB, 55,141 registros)
- Otras 24 tablas con datos de desarrollo/prueba

### 🔄 Siguiente Fase: Migración a Turso
Después de completar la migración a Neon:
1. Configurar Turso para `education_institutions_minedu`
2. Migrar los 55,141 registros de instituciones MINEDU
3. Actualizar endpoints de búsqueda para usar Turso
4. Mantener Neon para datos transaccionales

## Decisión Pendiente

**El usuario debe decidir**:
- ✅ Proceder con el push a Neon (23 tablas)
- ❌ Cancelar y revisar schema primero
- 🔍 Verificar conexión antes de proceder

**Estado actual**: Esperando confirmación del usuario
