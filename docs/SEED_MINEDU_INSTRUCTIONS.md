# Instrucciones para Poblar Base de Datos MINEDU

**Problema**: La tabla `education_institutions_minedu` está vacía, por lo que el onboarding no muestra instituciones.

**Solución**: Ejecutar el script de seed para poblar la tabla con datos de ejemplo.

---

## Opción 1: Usando tsx (Recomendado)

### Paso 1: Instalar tsx (si no está instalado)

```bash
cd apps/web
pnpm add -D tsx
```

### Paso 2: Ejecutar el script de seed

```bash
cd apps/web
pnpm run seed:minedu
```

---

## Opción 2: Compilar y ejecutar con Node

### Paso 1: Compilar el script

```bash
cd apps/web
npx tsc scripts/seed-minedu-institutions.ts --outDir scripts/dist --module commonjs --esModuleInterop --resolveJsonModule --skipLibCheck
```

### Paso 2: Ejecutar el script compilado

```bash
node scripts/dist/seed-minedu-institutions.js
```

---

## Opción 3: Ejecutar directamente con ts-node

```bash
cd apps/web
npx ts-node scripts/seed-minedu-institutions.ts
```

---

## Verificación

Después de ejecutar el script, verifica que los datos se insertaron correctamente:

### Opción A: Desde la aplicación

1. Abre el navegador en `http://localhost:3000/onboarding`
2. Selecciona "Primaria" o "Secundaria"
3. Deberías ver las regiones (Lima, Arequipa, Cusco, etc.)
4. Al seleccionar una región, deberías ver instituciones

### Opción B: Desde la base de datos

```sql
-- Contar instituciones
SELECT COUNT(*) FROM education_institutions_minedu;

-- Ver instituciones por departamento
SELECT departamento, COUNT(*) as total
FROM education_institutions_minedu
GROUP BY departamento
ORDER BY total DESC;

-- Ver algunas instituciones
SELECT codigo_modular, nombre, nivel, departamento, provincia
FROM education_institutions_minedu
LIMIT 10;
```

---

## Datos Incluidos en el Seed

El script incluye **50 instituciones educativas** de ejemplo distribuidas en:

- **Lima**: 10 instituciones (Primaria y Secundaria)
- **Arequipa**: 5 instituciones
- **Cusco**: 5 instituciones
- **Piura**: 5 instituciones
- **La Libertad**: 5 instituciones
- **Cajamarca**: 4 instituciones
- **Puno**: 4 instituciones
- **Junín**: 4 instituciones
- **Ica**: 4 instituciones
- **Lambayeque**: 4 instituciones

Cada institución incluye:
- Código Modular (7 dígitos)
- Nombre
- Nivel (Primaria/Secundaria)
- Tipo de Gestión (Pública/Privada)
- Departamento
- Provincia
- Distrito
- Dirección
- Estado (Activo)

---

## Agregar Más Instituciones

Si necesitas agregar más instituciones, edita el archivo:

```
apps/web/scripts/seed-minedu-institutions.ts
```

Y agrega más objetos al array `sampleInstitutions`:

```typescript
{
  codigoModular: '1234567',
  nombre: 'I.E. Nombre de la Institución',
  nivel: 'Primaria', // o 'Secundaria'
  tipoGestion: 'Pública', // o 'Privada'
  departamento: 'Departamento',
  provincia: 'Provincia',
  distrito: 'Distrito',
  direccion: 'Dirección completa',
  estado: 'Activo'
}
```

Luego ejecuta el script nuevamente.

---

## Troubleshooting

### Error: "Cannot find module"

Asegúrate de estar en el directorio correcto:

```bash
cd apps/web
```

### Error: "Database connection failed"

Verifica que la base de datos esté corriendo y que las variables de entorno estén configuradas:

```bash
# Verifica .env o .env.local
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### Error: "Table does not exist"

Ejecuta las migraciones de Drizzle primero:

```bash
cd apps/web
pnpm drizzle-kit push
```

---

## Notas Importantes

1. **El script es idempotente**: Si ejecutas el script múltiples veces, puede fallar por duplicados de código modular (primary key). Esto es normal y esperado.

2. **Datos de ejemplo**: Los datos incluidos son ficticios pero basados en instituciones reales del Perú. Para producción, deberías obtener datos reales del MINEDU.

3. **Backup**: Si ya tienes datos en la tabla, considera hacer un backup antes de ejecutar el script.

---

**Fecha**: 21 de Marzo de 2026  
**Estado**: Listo para ejecutar
