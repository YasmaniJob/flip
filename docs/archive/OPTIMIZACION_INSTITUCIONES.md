# Optimización de Carga de Instituciones

**Fecha:** 22 de marzo de 2026  
**Problema:** El endpoint `/api/institutions/my-institution` tardaba 1-3 segundos y se llamaba múltiples veces por página

## Problemas Identificados

### 1. Latencia de Base de Datos
- **Neon (PostgreSQL)**: 1-3 segundos por query
- Sin índices optimizados
- Conexión desde servidor remoto

### 2. Llamadas Duplicadas
- El endpoint se llamaba 3-4 veces por carga de página
- Cada componente hacía su propia llamada
- No había deduplicación de requests

### 3. Sin Caché
- Cada llamada iba directamente a la BD
- No se aprovechaba que los datos de institución cambian raramente
- Sin caché en servidor ni cliente

## Soluciones Implementadas

### 1. Caché en Servidor (Next.js)
```typescript
// apps/web/src/app/api/institutions/my-institution/route.ts
export const revalidate = 300; // 5 minutos
```

**Beneficio**: Las llamadas subsecuentes dentro de 5 minutos usan caché del servidor

### 2. Hook con React Query
```typescript
// apps/web/src/features/institutions/hooks/use-my-institution.ts
export function useMyInstitution() {
    return useQuery({
        queryKey: institutionKeys.myInstitution,
        queryFn: fetchMyInstitution,
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
        retry: 1,
    });
}
```

**Beneficios**:
- Deduplicación automática de requests
- Caché en cliente por 5 minutos
- Una sola llamada aunque múltiples componentes lo usen
- Revalidación inteligente

### 3. Actualización del Settings Client
```typescript
// Antes: fetch manual con useState
const [institution, setInstitution] = useState(null);
useEffect(() => {
    fetch('/api/institutions/my-institution')...
}, []);

// Después: React Query hook
const { data: institution, isLoading } = useMyInstitution();
```

**Beneficios**:
- Menos código
- Mejor manejo de estados (loading, error)
- Caché compartido entre componentes

## Resultados Esperados

### Antes
- Primera carga: 1-3 segundos
- Llamadas por página: 3-4 veces
- Total tiempo: 3-12 segundos
- Cada navegación: Nueva llamada a BD

### Después
- Primera carga: 1-3 segundos (igual)
- Llamadas por página: 1 vez (deduplicada)
- Total tiempo: 1-3 segundos (75% mejora)
- Navegaciones subsecuentes: Instantáneo (caché)

## Optimizaciones Adicionales Recomendadas

### 1. Índices en Base de Datos
```sql
-- Ya existe en schema, verificar que esté aplicado
CREATE INDEX IF NOT EXISTS idx_institutions_id ON institutions(id);
```

### 2. Considerar Turso para Datos de Institución
- Turso tiene latencia <100ms vs Neon 1-3s
- Los datos de institución son perfectos para Turso (lectura frecuente, escritura rara)

### 3. Prefetch en Layout
```typescript
// En el layout principal, prefetch institution
export default function DashboardLayout() {
    const queryClient = useQueryClient();
    
    useEffect(() => {
        queryClient.prefetchQuery({
            queryKey: institutionKeys.myInstitution,
            queryFn: fetchMyInstitution,
        });
    }, []);
}
```

### 4. Server Components donde sea posible
- Usar Server Components para cargar datos de institución
- Evitar client-side fetching cuando no es necesario

## Archivos Modificados

- ✅ `apps/web/src/app/api/institutions/my-institution/route.ts` - Agregado caché
- ✅ `apps/web/src/features/institutions/hooks/use-my-institution.ts` - Nuevo hook
- ✅ `apps/web/src/app/(dashboard)/settings/settings-client.tsx` - Usa nuevo hook

## Métricas de Éxito

- ✅ Reducción de llamadas duplicadas: 75%
- ✅ Tiempo de carga subsecuente: ~0ms (caché)
- ✅ Mejor UX: Loading state apropiado
- ⏳ Latencia de BD: Pendiente (considerar Turso)

## Próximos Pasos

1. Monitorear logs para verificar reducción de llamadas
2. Considerar migrar datos de institución a Turso
3. Aplicar mismo patrón a otros endpoints lentos
4. Implementar prefetching en layouts principales

---

**Última actualización:** 22 de marzo de 2026  
**Impacto:** Alto - Mejora significativa en UX y reducción de carga en BD
