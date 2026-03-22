# Migración de Datos MINEDU a Turso - COMPLETADA ✅

## Fecha de Completación
21 de marzo de 2026

## Resumen Ejecutivo

Migración exitosa de **55,141 registros** de instituciones educativas MINEDU desde PostgreSQL local a Turso (base de datos edge SQLite).

## Resultados

### ✅ Datos Migrados

**Total de registros**: 55,141 instituciones educativas

**Distribución por nivel**:
- Primaria: 39,264 instituciones (71.2%)
- Secundaria: 15,877 instituciones (28.8%)

**Top 10 departamentos**:
1. LIMA: 9,335 instituciones
2. CAJAMARCA: 4,878 instituciones
3. PIURA: 3,500 instituciones
4. LORETO: 3,316 instituciones
5. JUNIN: 3,101 instituciones
6. LA LIBERTAD: 3,084 instituciones
7. PUNO: 2,684 instituciones
8. CUSCO: 2,659 instituciones
9. ANCASH: 2,587 instituciones
10. HUANUCO: 2,352 instituciones

### ✅ Estructura Creada

**Tabla**: `education_institutions_minedu`

**Columnas**:
- `codigo_modular` (TEXT PRIMARY KEY)
- `nombre` (TEXT NOT NULL)
- `nivel` (TEXT NOT NULL)
- `tipo_gestion` (TEXT)
- `departamento` (TEXT)
- `provincia` (TEXT)
- `distrito` (TEXT)
- `direccion` (TEXT)
- `estado` (TEXT DEFAULT 'Activo')

**Índices creados**:
- `idx_ie_minedu_nivel` - Índice por nivel educativo
- `idx_ie_minedu_departamento` - Índice por departamento
- `idx_ie_minedu_nombre` - Índice por nombre de institución

## Configuración

### Archivo: `apps/web/.env.local`

```env
# Database - Neon (Producción - Datos transaccionales)
DATABASE_URL=postgresql://neondb_owner:...@ep-jolly-wave-acz30twt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Database - Turso (Edge - Datos de referencia MINEDU)
TURSO_DATABASE_URL=libsql://flip-v2-yasmanijob.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

### Archivos Creados

1. **Schema de Turso**: `apps/web/src/lib/db/schema-turso.ts`
   - Definición de tabla para SQLite
   - Tipos TypeScript exportados

2. **Cliente de Turso**: `apps/web/src/lib/db/turso.ts`
   - Cliente configurado con Drizzle ORM
   - Conexión a Turso con autenticación

3. **Script de Migración**: `apps/web/scripts/migrate-minedu-to-turso.ts`
   - Migración de datos desde PostgreSQL a Turso
   - Inserción en lotes de 100 registros
   - Barra de progreso

4. **Script de Verificación**: `apps/web/scripts/verify-turso.ts`
   - Verificación de datos migrados
   - Estadísticas por nivel y departamento
   - Muestra de datos

## Método de Migración

### Proceso Ejecutado

1. **Conexión a PostgreSQL local**
   - Base de datos: `flip_v2`
   - Tabla: `education_institutions_minedu`

2. **Conexión a Turso**
   - URL: `libsql://flip-v2-yasmanijob.aws-us-east-1.turso.io`
   - Región: US East 1 (AWS)

3. **Creación de estructura**
   - Tabla con 9 columnas
   - 3 índices para optimizar búsquedas

4. **Migración de datos**
   - Extracción de 55,141 registros desde PostgreSQL
   - Inserción en lotes de 100 registros
   - Uso de `INSERT OR REPLACE` para idempotencia

5. **Verificación**
   - Conteo de registros: 55,141 ✅
   - Estadísticas por nivel ✅
   - Estadísticas por departamento ✅

## Arquitectura de Bases de Datos

### Neon (PostgreSQL)
**Propósito**: Datos transaccionales
**Ubicación**: São Paulo, Brasil
**Tablas**: 24 tablas
- institutions
- users, sessions, accounts, verification
- categories, resources, resource_templates
- staff, loans, loan_resources
- classrooms, classroom_reservations, reservation_slots
- meetings, meeting_attendance, meeting_tasks
- grades, sections, curricular_areas, pedagogical_hours

### Turso (SQLite Edge)
**Propósito**: Datos de referencia (solo lectura)
**Ubicación**: US East 1 (AWS)
**Tablas**: 1 tabla
- education_institutions_minedu (55,141 registros)

**Ventajas de Turso**:
- Latencia ultra-baja (edge computing)
- Ideal para datos de referencia
- Escalabilidad global
- Costo-efectivo para lecturas

## Comandos Útiles

### Verificar Datos en Turso
```bash
cd apps/web
pnpm tsx scripts/verify-turso.ts
```

### Re-migrar Datos (si es necesario)
```bash
cd apps/web
pnpm tsx scripts/migrate-minedu-to-turso.ts
```

### Usar Turso en la Aplicación
```typescript
import { turso } from '@/lib/db/turso';
import { educationInstitutionsMinedu } from '@/lib/db/schema-turso';
import { eq, like } from 'drizzle-orm';

// Buscar por código modular
const institution = await turso
  .select()
  .from(educationInstitutionsMinedu)
  .where(eq(educationInstitutionsMinedu.codigoModular, '0002212'))
  .limit(1);

// Buscar por nombre
const results = await turso
  .select()
  .from(educationInstitutionsMinedu)
  .where(like(educationInstitutionsMinedu.nombre, '%MANUEL%'))
  .limit(10);
```

## Próximos Pasos

### 1. Actualizar Endpoints de Búsqueda ✅ (Siguiente)

Actualizar los siguientes endpoints para usar Turso:

- `GET /api/institutions/search` - Búsqueda de instituciones
- `GET /api/institutions/departamentos` - Lista de departamentos
- `GET /api/institutions/provincias` - Lista de provincias por departamento
- `GET /api/institutions/distritos` - Lista de distritos por provincia

### 2. Actualizar Componente de Onboarding

Modificar el componente de búsqueda de instituciones para usar el nuevo endpoint:

- `apps/web/src/features/onboarding/components/institution-search.tsx`

### 3. Probar Búsqueda

- Probar búsqueda por nombre
- Probar búsqueda por código modular
- Probar filtros por departamento/provincia/distrito
- Verificar rendimiento de queries

### 4. Monitoreo

- Configurar monitoreo de Turso
- Verificar latencia de queries
- Monitorear uso de recursos

## Dependencias Instaladas

```json
{
  "@libsql/client": "^0.17.2"
}
```

## Verificación Post-Migración

### ✅ Verificaciones Exitosas

1. **Cantidad de registros**: 55,141 (100%)
2. **Distribución por nivel**: Primaria 71.2%, Secundaria 28.8%
3. **Índices creados**: 3 índices funcionando
4. **Integridad de datos**: Sin errores de migración
5. **Conexión**: Conexión exitosa a Turso

### Muestra de Datos

```
0002212 - MANUEL ANTONIO MESONES MURO (Secundaria, PIURA)
0200014 - 54387 (Primaria, APURIMAC)
0200022 - 54388 (Primaria, APURIMAC)
0200030 - 54389 (Primaria, APURIMAC)
0200048 - 54390 (Primaria, APURIMAC)
```

## Notas Importantes

### ⚠️ Advertencias

- Turso es una base de datos de solo lectura para este caso de uso
- Los datos de MINEDU deben actualizarse periódicamente
- La tabla en PostgreSQL local puede ser eliminada después de verificar

### 📋 Datos Originales

- **Fuente**: PostgreSQL local (`flip_v2`)
- **Tabla**: `education_institutions_minedu`
- **Tamaño**: ~11 MB
- **Registros**: 55,141 instituciones educativas

### 🔄 Sincronización

Para actualizar los datos de MINEDU en el futuro:
1. Actualizar datos en PostgreSQL local
2. Ejecutar script de migración nuevamente
3. Verificar datos en Turso

## Conclusión

✅ **Migración completada exitosamente**

Los datos de instituciones educativas MINEDU han sido migrados exitosamente a Turso:
- 55,141 registros migrados
- 3 índices creados
- Estructura optimizada para búsquedas
- Listo para uso en producción

La aplicación ahora tiene una arquitectura de bases de datos híbrida:
- **Neon**: Datos transaccionales (usuarios, recursos, préstamos, etc.)
- **Turso**: Datos de referencia (instituciones MINEDU)

---

**Fecha de completación**: 21 de marzo de 2026  
**Ejecutado por**: Script automatizado `migrate-minedu-to-turso.ts`  
**Tiempo total**: ~2 minutos  
**Estado**: ✅ COMPLETADO
