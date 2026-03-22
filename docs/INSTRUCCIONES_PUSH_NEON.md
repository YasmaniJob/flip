# Instrucciones para Push Manual a Neon

## Estado Actual
Todo está configurado y listo para el push. Solo necesitas confirmar manualmente.

## Pasos para Ejecutar

### 1. Abrir Terminal en apps/web
```bash
cd apps/web
```

### 2. Ejecutar Drizzle Kit Push
```bash
pnpm drizzle-kit push
```

### 3. Revisar el Preview
Drizzle-kit mostrará un preview de todas las tablas que se crearán (23 tablas).

### 4. Confirmar
Cuando veas el mensaje:
```
❯ No, abort
  Yes, I want to execute all statements
```

Usa las flechas del teclado para seleccionar "Yes, I want to execute all statements" y presiona Enter.

## Tablas que se Crearán (23 tablas)

### Autenticación (5 tablas)
1. `institutions` - Instituciones educativas
2. `users` - Usuarios del sistema
3. `sessions` - Sesiones de Better Auth
4. `accounts` - Cuentas OAuth
5. `verification` - Verificación de email

### Gestión de Recursos (5 tablas)
6. `categories` - Categorías de recursos
7. `category_sequences` - Secuencias para IDs
8. `resource_templates` - Plantillas de recursos
9. `resources` - Recursos físicos
10. `staff` - Personal docente

### Préstamos (2 tablas)
11. `loans` - Préstamos de recursos
12. `loan_resources` - Relación many-to-many

### Configuración Académica (4 tablas)
13. `curricular_areas` - Áreas curriculares
14. `grades` - Grados académicos
15. `sections` - Secciones por grado
16. `pedagogical_hours` - Horas pedagógicas

### Reservas de Aulas (5 tablas)
17. `classrooms` - Aulas físicas
18. `classroom_reservations` - Reservas de aulas
19. `reservation_slots` - Slots de tiempo
20. `reservation_attendance` - Asistencia a talleres
21. `reservation_tasks` - Tareas de talleres

### Reuniones (3 tablas)
22. `meetings` - Reuniones
23. `meeting_attendance` - Asistencia a reuniones
24. `meeting_tasks` - Tareas de reuniones

## Verificación Post-Push

### 1. Verificar que el push fue exitoso
Deberías ver un mensaje como:
```
✓ Applying changes...
✓ Changes applied successfully!
```

### 2. Contar tablas creadas
Ejecuta en la consola de Neon:
```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Resultado esperado**: 23 tablas

### 3. Listar todas las tablas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 4. Confirmar que education_institutions_minedu NO existe
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'education_institutions_minedu';
```

**Resultado esperado**: 0 filas (la tabla NO debe existir)

## Qué Hacer si Hay Errores

### Error: "DATABASE_URL is not defined"
- Verifica que `.env.local` existe en `apps/web/`
- Verifica que contiene la variable `DATABASE_URL`

### Error: "Connection refused"
- Verifica que la URL de Neon es correcta
- Verifica que tienes conexión a internet
- Verifica que Neon no está en mantenimiento

### Error: "Table already exists"
- Significa que ya ejecutaste el push antes
- Puedes ignorar este error o eliminar las tablas en Neon primero

## Configuración Actual

### Archivo: apps/web/.env.local
```env
DATABASE_URL=postgresql://neondb_owner:npg_kgcCKJuwpF63@ep-jolly-wave-acz30twt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Archivo: apps/web/drizzle.config.ts
```typescript
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
```

### Tabla Excluida: apps/web/src/lib/db/schema.ts
La tabla `education_institutions_minedu` está comentada (líneas 8-26):
```typescript
// NOTA: Esta tabla NO se migra a Neon - irá a Turso después
// export const educationInstitutionsMinedu = pgTable(...
```

## Próximos Pasos Después del Push

1. ✅ Verificar que las 23 tablas se crearon correctamente
2. ✅ Confirmar que `education_institutions_minedu` NO existe en Neon
3. 🔄 Configurar Turso para la tabla de instituciones MINEDU
4. 🔄 Migrar datos de instituciones a Turso
5. 🔄 Actualizar endpoints para usar Turso en búsquedas

## Notas Importantes

- ⚠️ Este push solo crea la estructura (schema), NO migra datos
- ⚠️ Los datos permanecen en la base de datos local
- ⚠️ La tabla `education_institutions_minedu` NO se crea en Neon
- ✅ Todas las foreign keys y constraints se crean automáticamente
- ✅ Todos los índices se crean automáticamente
