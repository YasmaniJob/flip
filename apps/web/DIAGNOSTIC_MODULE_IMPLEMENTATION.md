# Implementación del Módulo de Diagnóstico

## Estado Actual: FASE 1 - Base de Datos y Seed

### ✅ Completado

1. **Schema actualizado** (`apps/web/src/lib/db/schema.ts`)
   - ✅ 4 nuevas tablas creadas:
     - `diagnostic_categories` - Dimensiones del diagnóstico
     - `diagnostic_questions` - Preguntas por dimensión
     - `diagnostic_sessions` - Sesiones de docentes
     - `diagnostic_responses` - Respuestas individuales
   - ✅ 3 columnas agregadas a `institutions`:
     - `diagnosticEnabled` - Activa/desactiva el módulo
     - `diagnosticRequiresApproval` - Requiere aprobación de docentes nuevos
     - `diagnosticCustomMessage` - Mensaje personalizado opcional
   - ✅ Todas las relaciones de Drizzle ORM configuradas
   - ✅ Índices optimizados para búsquedas

2. **Migración generada** (`apps/web/drizzle/0003_fresh_mandroid.sql`)
   - ✅ SQL revisado y validado como seguro
   - ✅ No contiene DROP TABLE ni DROP COLUMN
   - ✅ Usa valores por defecto seguros

3. **Scripts de gestión creados**
   - ✅ `scripts/migrate-diagnostic-safe.ts` - Migración con verificación
   - ✅ `scripts/seed-diagnostic-questions.ts` - Seed de 5 dimensiones y 23 preguntas
   - ✅ `scripts/rollback-diagnostic.ts` - Rollback de emergencia

4. **Feature flags configurados** (`.env.example`)
   - ✅ `FEATURE_DIAGNOSTIC_ENABLED` - Master switch
   - ✅ `FEATURE_DIAGNOSTIC_PUBLIC_QUIZ` - Quiz público
   - ✅ `FEATURE_DIAGNOSTIC_ADMIN_PANEL` - Panel admin
   - ✅ `FEATURE_DIAGNOSTIC_STAFF_INTEGRATION` - Integración con staff

5. **Scripts NPM agregados** (`package.json`)
   - ✅ `pnpm diagnostic:migrate` - Ejecutar migración
   - ✅ `pnpm diagnostic:seed` - Cargar datos base
   - ✅ `pnpm diagnostic:rollback` - Rollback de emergencia

---

## 🚀 Próximos Pasos

### Antes de ejecutar la migración:

1. **Crear backup de la base de datos**
   ```bash
   # Desde el dashboard de Neon, crear un backup manual
   # O usar el CLI de Neon si está configurado
   ```

2. **Configurar variables de entorno en local**
   ```bash
   # En .env.local, agregar:
   FEATURE_DIAGNOSTIC_ENABLED=false
   FEATURE_DIAGNOSTIC_PUBLIC_QUIZ=false
   FEATURE_DIAGNOSTIC_ADMIN_PANEL=false
   FEATURE_DIAGNOSTIC_STAFF_INTEGRATION=false
   ```

3. **Ejecutar migración en local primero**
   ```bash
   cd apps/web
   pnpm diagnostic:migrate
   ```

4. **Verificar que la migración fue exitosa**
   - El script mostrará las tablas creadas
   - Verificar que hay 4 tablas `diagnostic_*`
   - Verificar que `institutions` tiene 3 columnas nuevas

5. **Cargar datos base (seed)**
   ```bash
   pnpm diagnostic:seed
   ```

6. **Verificar el seed**
   - 5 categorías (dimensiones)
   - 23 preguntas en total
   - Todas con `institutionId = NULL` (estándar de Flip)

---

## 📊 Contenido del Seed

### 5 Dimensiones (Categorías)

1. **Manejo de Información** (5 preguntas)
   - Búsqueda efectiva en internet
   - Evaluación de fuentes confiables
   - Organización de archivos digitales
   - Uso de almacenamiento en la nube
   - Compartir archivos de forma segura

2. **IA Generativa** (4 preguntas)
   - Conocimiento de IA
   - Uso de ChatGPT para materiales educativos
   - Escritura de prompts efectivos
   - Evaluación crítica de respuestas de IA

3. **Herramientas Digitales** (5 preguntas)
   - Creación de presentaciones
   - Uso de hojas de cálculo
   - Creación de formularios digitales
   - Uso de videoconferencias
   - Edición básica de videos

4. **Ciudadanía Digital** (4 preguntas)
   - Normas de comportamiento digital
   - Protección de información personal
   - Prevención de ciberbullying
   - Derechos de autor y uso ético

5. **Innovación Pedagógica** (5 preguntas)
   - Diseño de actividades con tecnología
   - Uso de plataformas educativas
   - Creación de recursos interactivos
   - Evaluación digital del aprendizaje
   - Adaptación según necesidades digitales

---

## 🛡️ Plan de Rollback

Si algo sale mal durante la migración:

### Opción 1: Rollback automático
- La migración usa transacciones
- Si falla, Neon hace rollback automático
- No se hacen cambios en la BD

### Opción 2: Rollback manual
```bash
pnpm diagnostic:rollback
```

Este script:
- Elimina las 4 tablas de diagnóstico
- Elimina las 3 columnas de `institutions`
- Usa `CASCADE` para limpiar foreign keys

### Opción 3: Restaurar desde backup
```bash
# Desde el dashboard de Neon
# Seleccionar el backup creado antes de la migración
# Restaurar a ese punto
```

---

## 📝 Checklist Pre-Migración

- [ ] Backup de base de datos creado
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Feature flags en `false` (desactivados)
- [ ] Rama `feature/diagnostic-module` actualizada
- [ ] Scripts de migración y rollback probados en local
- [ ] Equipo notificado del proceso
- [ ] Horario de bajo tráfico seleccionado (si es producción)

---

## 🔍 Verificación Post-Migración

Después de ejecutar la migración, verificar:

1. **Tablas creadas correctamente**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name LIKE 'diagnostic_%';
   ```
   Debe retornar 4 tablas.

2. **Columnas agregadas a institutions**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'institutions' 
     AND column_name LIKE 'diagnostic_%';
   ```
   Debe retornar 3 columnas.

3. **Seed ejecutado correctamente**
   ```sql
   SELECT COUNT(*) FROM diagnostic_categories; -- Debe ser 5
   SELECT COUNT(*) FROM diagnostic_questions;  -- Debe ser 23
   ```

4. **Índices creados**
   ```sql
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename LIKE 'diagnostic_%';
   ```

---

## 🎯 Siguiente Fase: FASE 2 - API Layer

Una vez completada la Fase 1, continuar con:

1. Crear endpoints públicos para el quiz
2. Crear endpoints privados para administración
3. Implementar rate limiting
4. Implementar validaciones de datos
5. Crear tests unitarios

Ver `PLAN_DIAGNOSTICO.md` para detalles completos.

---

## 📚 Referencias

- Plan completo: `PLAN_DIAGNOSTICO.md`
- Plan de mitigación: `PLAN_DIAGNOSTICO_MITIGATION.md`
- Revisión de riesgos: `PLAN_DIAGNOSTICO_REVIEW.md`
- Schema: `apps/web/src/lib/db/schema.ts`
- Migración SQL: `apps/web/drizzle/0003_fresh_mandroid.sql`
