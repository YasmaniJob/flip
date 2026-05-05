# Optimización de Rendimiento - Turso y Endpoints

## Fecha
21 de marzo de 2026

## Problemas Identificados

### 1. Latencia de Red
- **Turso está en AWS US East 1** (Virginia, USA)
- **Usuario está en Sudamérica** (probablemente Perú)
- **Latencia estimada**: 150-300ms por consulta
- **Impacto**: Cada consulta a Turso tarda más de lo esperado

### 2. Volumen de Datos
- **55,141 registros** en `education_institutions_minedu`
- **Consultas DISTINCT** en departamentos, provincias, distritos
- **Sin caché** en el cliente o servidor

### 3. Fast Refresh Constante
- **Turbopack** está recompilando frecuentemente
- **HMR (Hot Module Replacement)** tarda 100-200ms por cambio
- **Múltiples recompilaciones** por cambio de archivo

## Soluciones Implementadas

### ✅ 1. Archivo de Provincias Recreado
- Eliminado archivo corrupto
- Recreado con export correcto
- Servidor reiniciado para limpiar caché

## Soluciones Recomendadas

### 1. Caché en el Cliente (React Query)

Actualmente React Query hace refetch en cada mount. Configurar staleTime:

```typescript
// En el hook de useQuery
const { data: provincias } = useQuery({
  queryKey: ['provincias', departamento],
  queryFn: () => fetchProvincias(departamento),
  enabled: !!departamento,
  staleTime: 5 * 60 * 1000, // 5 minutos
  cacheTime: 10 * 60 * 1000, // 10 minutos
});
```

**Beneficio**: Evita consultas repetidas a Turso

### 2. Índices en Turso

Verificar que los índices existan:

```sql
-- Verificar índices existentes
SELECT name, sql FROM sqlite_master 
WHERE type='index' AND tbl_name='education_institutions_minedu';

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_departamento 
ON education_institutions_minedu(departamento);

CREATE INDEX IF NOT EXISTS idx_provincia 
ON education_institutions_minedu(provincia);

CREATE INDEX IF NOT EXISTS idx_distrito 
ON education_institutions_minedu(distrito);

CREATE INDEX IF NOT EXISTS idx_nivel 
ON education_institutions_minedu(nivel);
```

**Beneficio**: Consultas DISTINCT más rápidas

### 3. Prefetch de Datos

Cargar departamentos al inicio y cachear:

```typescript
// En el componente de onboarding
useEffect(() => {
  // Prefetch departamentos
  queryClient.prefetchQuery({
    queryKey: ['departamentos'],
    queryFn: fetchDepartamentos,
  });
}, []);
```

**Beneficio**: Datos disponibles inmediatamente

### 4. Debounce en Búsqueda

Para el campo de búsqueda de instituciones:

```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

const { data } = useQuery({
  queryKey: ['institutions', debouncedSearch, filters],
  queryFn: () => searchInstitutions(debouncedSearch, filters),
  enabled: debouncedSearch.length >= 3,
});
```

**Beneficio**: Reduce consultas mientras el usuario escribe

### 5. Paginación Optimizada

Usar cursor-based pagination en lugar de offset:

```typescript
// En lugar de offset
const { data } = useInfiniteQuery({
  queryKey: ['institutions', filters],
  queryFn: ({ pageParam = 0 }) => 
    searchInstitutions(filters, { limit: 20, offset: pageParam }),
  getNextPageParam: (lastPage, pages) => 
    lastPage.length === 20 ? pages.length * 20 : undefined,
});
```

**Beneficio**: Mejor UX con scroll infinito

### 6. Región de Turso Más Cercana

Considerar migrar la base de datos de Turso a una región más cercana:

```bash
# Crear nueva base de datos en São Paulo
turso db create flip-v2-sa --location sao

# Migrar datos
turso db shell flip-v2-sa < backup.sql
```

**Beneficio**: Reduce latencia de 300ms a ~50ms

### 7. Caché en el Servidor (Next.js)

Usar Next.js cache para endpoints públicos:

```typescript
import { unstable_cache } from 'next/cache';

export async function GET(request: NextRequest) {
  const departamento = request.nextUrl.searchParams.get('departamento');
  
  const getProvincias = unstable_cache(
    async (dept: string) => {
      const result = await turso.execute(sql`
        SELECT DISTINCT provincia
        FROM education_institutions_minedu
        WHERE departamento = ${dept}
        ORDER BY provincia
      `);
      return result.rows.map((row: any) => row.provincia);
    },
    ['provincias', departamento],
    { revalidate: 3600 } // 1 hora
  );

  const provincias = await getProvincias(departamento);
  return successResponse(provincias);
}
```

**Beneficio**: Caché en el servidor, sin consultar Turso repetidamente

### 8. Compresión de Respuestas

Habilitar compresión en Next.js:

```typescript
// next.config.ts
export default {
  compress: true, // Ya está habilitado por defecto
  // ...
};
```

**Beneficio**: Reduce tamaño de respuestas HTTP

## Métricas Actuales vs Esperadas

### Antes de Optimización
- Carga de departamentos: ~1000ms
- Carga de provincias: ~400ms
- Búsqueda de instituciones: ~900ms
- Total para completar onboarding: ~5-7 segundos

### Después de Optimización (Estimado)
- Carga de departamentos: ~100ms (caché)
- Carga de provincias: ~50ms (caché + índices)
- Búsqueda de instituciones: ~200ms (índices + debounce)
- Total para completar onboarding: ~1-2 segundos

## Implementación Prioritaria

### Alta Prioridad (Implementar Ya)
1. ✅ Recrear archivo de provincias (HECHO)
2. 🔄 Agregar staleTime a React Query (5 minutos)
3. 🔄 Verificar/crear índices en Turso

### Media Prioridad (Esta Semana)
4. Agregar debounce en búsqueda
5. Implementar caché en servidor con unstable_cache
6. Prefetch de departamentos

### Baja Prioridad (Futuro)
7. Migrar Turso a región São Paulo
8. Implementar infinite scroll
9. Optimizar bundle size

## Comandos Útiles

### Verificar Índices en Turso
```bash
turso db shell flip-v2-yasmanijob
```

```sql
-- Ver índices
SELECT name, sql FROM sqlite_master 
WHERE type='index' AND tbl_name='education_institutions_minedu';

-- Ver tamaño de tabla
SELECT COUNT(*) FROM education_institutions_minedu;

-- Analizar query plan
EXPLAIN QUERY PLAN
SELECT DISTINCT provincia
FROM education_institutions_minedu
WHERE departamento = 'AMAZONAS';
```

### Medir Latencia
```bash
# Desde terminal
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api/institutions/departamentos"
```

Crear `curl-format.txt`:
```
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

## Notas Importantes

### Turso Limitations
- **Max DB size**: 500 MB (suficiente para MINEDU)
- **Max rows**: Ilimitado
- **Latency**: Depende de región
- **Concurrent connections**: 1000 (más que suficiente)

### React Query Best Practices
- Usar `staleTime` para datos que no cambian frecuentemente
- Usar `cacheTime` para mantener datos en memoria
- Usar `refetchOnWindowFocus: false` para datos estáticos
- Usar `refetchOnMount: false` para evitar refetch innecesario

### Next.js Caching
- `unstable_cache` es experimental pero funciona bien
- Usar `revalidate` para datos que cambian ocasionalmente
- Considerar ISR (Incremental Static Regeneration) para páginas

## Conclusión

La lentitud actual se debe principalmente a:
1. **Latencia de red** (Turso en USA, usuario en Sudamérica)
2. **Falta de caché** en cliente y servidor
3. **Consultas sin optimizar** (sin índices adecuados)

Implementando las optimizaciones de alta prioridad, el rendimiento debería mejorar significativamente (5-10x más rápido).

---

**Fecha**: 21 de marzo de 2026  
**Estado**: Documento de referencia  
**Prioridad**: Alta
