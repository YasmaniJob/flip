# Optimizaciones de Rendimiento Implementadas ✅

## Fecha
21 de marzo de 2026

## Resumen

Se han implementado optimizaciones de caché en cliente y servidor para mejorar significativamente el rendimiento de las consultas a Turso.

## Optimizaciones Implementadas

### 1. ✅ Caché en Cliente (React Query)

**Archivo**: `apps/web/src/app/(onboarding)/onboarding/components/StepInstitucion.tsx`

#### Departamentos
```typescript
const { data: departamentos = [] } = useQuery({
  queryKey: ['departamentos'],
  queryFn: async () => { /* ... */ },
  staleTime: 10 * 60 * 1000, // 10 minutos
  gcTime: 30 * 60 * 1000, // 30 minutos en caché
});
```

**Beneficio**: Los departamentos se cargan una sola vez y se reutilizan durante 10 minutos

#### Provincias
```typescript
const { data: provincias = [] } = useQuery({
  queryKey: ['provincias', selectedDep],
  queryFn: async () => { /* ... */ },
  enabled: !!selectedDep,
  staleTime: 10 * 60 * 1000, // 10 minutos
  gcTime: 30 * 60 * 1000, // 30 minutos en caché
});
```

**Beneficio**: Las provincias se cachean por departamento durante 10 minutos

#### Distritos
```typescript
const { data: distritos = [] } = useQuery({
  queryKey: ['distritos', selectedDep, selectedProv],
  queryFn: async () => { /* ... */ },
  enabled: !!selectedDep && !!selectedProv,
  staleTime: 10 * 60 * 1000, // 10 minutos
  gcTime: 30 * 60 * 1000, // 30 minutos en caché
});
```

**Beneficio**: Los distritos se cachean por provincia durante 10 minutos

#### Búsqueda de Instituciones
```typescript
const { data: searchPages, /* ... */ } = useInfiniteQuery({
  queryKey: ['search-institutions', query, selectedDep, selectedProv, selectedDist, data.nivel],
  queryFn: async ({ pageParam = 0 }) => { /* ... */ },
  enabled: query.length >= 3 || !!selectedDep,
  initialPageParam: 0,
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 15 * 60 * 1000, // 15 minutos en caché
});
```

**Beneficio**: Los resultados de búsqueda se cachean durante 5 minutos

### 2. ✅ Caché en Servidor (Next.js unstable_cache)

#### Departamentos
**Archivo**: `apps/web/src/app/api/institutions/departamentos/route.ts`

```typescript
const getDepartamentos = unstable_cache(
  async () => {
    const results = await turso.selectDistinct({ /* ... */ });
    return results.map((r) => r.departamento).filter(Boolean);
  },
  ['departamentos'],
  { revalidate: 3600, tags: ['departamentos'] } // 1 hora
);
```

**Beneficio**: Los departamentos se cachean en el servidor durante 1 hora

#### Provincias
**Archivo**: `apps/web/src/app/api/institutions/provincias/route.ts`

```typescript
const getProvincias = unstable_cache(
  async (dept: string) => {
    const result = await turso.execute(sql`/* ... */`);
    return result.rows.map((row: any) => row.provincia);
  },
  ['provincias', departamento],
  { revalidate: 3600, tags: ['provincias', `provincias-${departamento}`] }
);
```

**Beneficio**: Las provincias se cachean por departamento durante 1 hora

#### Distritos
**Archivo**: `apps/web/src/app/api/institutions/distritos/route.ts`

```typescript
const getDistritos = unstable_cache(
  async (dept: string, prov: string) => {
    const results = await turso.selectDistinct({ /* ... */ });
    return results.map((r) => r.distrito).filter(Boolean);
  },
  ['distritos', departamento, provincia],
  { revalidate: 3600, tags: ['distritos', `distritos-${departamento}-${provincia}`] }
);
```

**Beneficio**: Los distritos se cachean por provincia durante 1 hora

## Mejoras de Rendimiento Esperadas

### Antes de Optimización
- **Primera carga de departamentos**: ~1000ms (consulta a Turso en USA)
- **Carga de provincias**: ~400ms por departamento
- **Carga de distritos**: ~400ms por provincia
- **Búsqueda de instituciones**: ~900ms por búsqueda
- **Total para completar onboarding**: 5-7 segundos

### Después de Optimización
- **Primera carga de departamentos**: ~1000ms (solo la primera vez)
- **Cargas subsecuentes de departamentos**: ~0ms (desde caché)
- **Primera carga de provincias**: ~400ms (solo la primera vez por departamento)
- **Cargas subsecuentes de provincias**: ~0ms (desde caché)
- **Primera carga de distritos**: ~400ms (solo la primera vez por provincia)
- **Cargas subsecuentes de distritos**: ~0ms (desde caché)
- **Búsqueda de instituciones**: ~900ms primera vez, ~0ms subsecuentes (5 min)
- **Total para completar onboarding**: 1-2 segundos (después de primera carga)

### Mejora Estimada
- **Primera experiencia**: Similar (~5-7 segundos)
- **Experiencias subsecuentes**: **80-90% más rápido** (~1-2 segundos)
- **Navegación entre departamentos**: **Instantánea** (0ms desde caché)

## Estrategia de Caché

### Cliente (React Query)
- **staleTime**: Tiempo que los datos se consideran "frescos"
  - Departamentos/Provincias/Distritos: 10 minutos (datos estáticos)
  - Búsqueda: 5 minutos (puede cambiar más frecuentemente)
- **gcTime** (antes cacheTime): Tiempo que los datos permanecen en memoria
  - Departamentos/Provincias/Distritos: 30 minutos
  - Búsqueda: 15 minutos

### Servidor (Next.js)
- **revalidate**: Tiempo de revalidación del caché
  - Todos los endpoints: 1 hora (3600 segundos)
- **tags**: Etiquetas para invalidación selectiva
  - Permite invalidar caché específico si los datos cambian

## Invalidación de Caché

Si los datos de MINEDU se actualizan, se puede invalidar el caché:

```typescript
import { revalidateTag } from 'next/cache';

// Invalidar todos los departamentos
revalidateTag('departamentos');

// Invalidar provincias de un departamento específico
revalidateTag('provincias-LIMA');

// Invalidar distritos de una provincia específica
revalidateTag('distritos-LIMA-YAUYOS');
```

## Monitoreo de Rendimiento

### Métricas a Observar
1. **Time to First Byte (TTFB)**: Debe reducirse de ~1000ms a ~50ms en cargas subsecuentes
2. **Cache Hit Rate**: Debe ser >80% después de la primera carga
3. **Latencia de Turso**: Solo se mide en cache miss

### Herramientas
- **React Query DevTools**: Ver estado de caché en tiempo real
- **Next.js DevTools**: Ver caché del servidor
- **Network Tab**: Verificar que las peticiones se sirven desde caché

## Próximas Optimizaciones (Futuro)

### Alta Prioridad
1. ✅ Caché en cliente (HECHO)
2. ✅ Caché en servidor (HECHO)
3. 🔄 Verificar índices en Turso (pendiente)

### Media Prioridad
4. Agregar debounce en búsqueda (300ms)
5. Prefetch de departamentos al cargar la página
6. Optimizar bundle size (code splitting)

### Baja Prioridad
7. Migrar Turso a región São Paulo (reduce latencia base)
8. Implementar Service Worker para caché offline
9. Agregar compresión Brotli

## Notas Técnicas

### React Query v5
- `cacheTime` fue renombrado a `gcTime` (garbage collection time)
- `staleTime` controla cuándo se considera que los datos están "stale"
- `gcTime` controla cuándo se eliminan los datos de la memoria

### Next.js unstable_cache
- Es experimental pero estable en producción
- Funciona con cualquier función async
- Soporta tags para invalidación selectiva
- Se integra con el sistema de caché de Next.js

### Turso Latency
- **USA East (Virginia)** a Perú: ~200-300ms
- **São Paulo** a Perú: ~50-100ms
- **Caché hit**: ~0-5ms

## Verificación

### Cómo Verificar que Funciona

1. **Primera carga**: Abrir DevTools Network
   - Debe ver peticiones a `/api/institutions/departamentos` (~1000ms)
   - Debe ver peticiones a `/api/institutions/provincias` (~400ms)

2. **Segunda carga**: Recargar la página
   - NO debe ver peticiones a departamentos (desde caché)
   - Cambiar de departamento debe ser instantáneo

3. **React Query DevTools**: Abrir en el navegador
   - Ver queries en estado "fresh" (verde)
   - Ver queries en estado "stale" (amarillo) después de staleTime

## Conclusión

✅ **Optimizaciones implementadas exitosamente**

Las optimizaciones de caché en cliente y servidor deberían mejorar significativamente la experiencia del usuario:
- **Primera carga**: Similar a antes (~5-7 segundos)
- **Cargas subsecuentes**: 80-90% más rápido (~1-2 segundos)
- **Navegación**: Instantánea (0ms desde caché)

El sistema ahora es mucho más eficiente y reduce la carga en Turso, mejorando tanto el rendimiento como los costos.

---

**Fecha de implementación**: 21 de marzo de 2026  
**Tiempo de implementación**: ~30 minutos  
**Estado**: ✅ COMPLETADO
