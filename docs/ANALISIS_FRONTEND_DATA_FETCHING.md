# 🔍 Análisis: Cómo el Frontend Hace Llamadas a la API

**Fecha:** 22 de Marzo, 2026  
**Objetivo:** Entender el patrón de data fetching usado en el frontend

---

## 📊 Patrón Principal: React Query (@tanstack/react-query)

El frontend usa **React Query v5** como solución principal para data fetching y state management.

---

## 🏗️ Configuración de React Query

### QueryClientProvider

Configurado en **2 layouts**:

1. **Dashboard Layout** (`apps/web/src/app/(dashboard)/layout.tsx`)
   ```typescript
   const [queryClient] = useState(() => new QueryClient());
   
   return (
     <QueryClientProvider client={queryClient}>
       {/* Dashboard content */}
     </QueryClientProvider>
   );
   ```

2. **Onboarding Layout** (`apps/web/src/app/(onboarding)/layout.tsx`)
   ```typescript
   const [queryClient] = useState(() => new QueryClient());
   
   return (
     <QueryClientProvider client={queryClient}>
       {/* Onboarding content */}
     </QueryClientProvider>
   );
   ```

**Nota:** Cada layout crea su propia instancia de QueryClient (no compartida globalmente).

---

## 📄 Estructura de Páginas

### Patrón: Server Component → Client Component

Todas las páginas principales siguen este patrón:

```typescript
// page.tsx (Server Component)
export default function Page() {
    return <ClientComponent />;
}
```

**Páginas analizadas:**
- `dashboard/page.tsx` → Renderiza componentes directamente
- `inventario/page.tsx` → `<InventarioClient />`
- `loans/page.tsx` → `<LoansClient />`
- `reservaciones/page.tsx` → `<ReservacionesClient />`

---

## 🎣 Hooks Personalizados con React Query

### 1. Dashboard (`dashboard/page.tsx`)

**Patrón:** `fetch` directo + `useState`

```typescript
const [institution, setInstitution] = useState<any>(null);

useEffect(() => {
    if (session && user && user.institutionId && !user.isSuperAdmin && !institution) {
        fetch('/api/institutions/my-institution')
            .then(async res => {
                if (res.ok) {
                    const data = await res.json();
                    setInstitution(data);
                }
            })
            .catch(console.error);
    }
}, [session, user, institution]);
```

**Problema:** No usa React Query, hace fetch manual.

---

### 2. Inventario (`inventario-client.tsx`)

**Hook:** `useResources` (React Query)

```typescript
const { data: resources = [], isLoading: loadingResources } = useResources({ limit: 100 });
```

**Implementación** (`use-resources.ts`):
```typescript
export function useResources(params?: { search?: string, categoryId?: string, page?: number, limit?: number }) {
    const api = useApiClient();

    return useQuery({
        queryKey: resourceKeys.list(params),
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (params?.search) queryParams.append('search', params.search);
            if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
            if (params?.page) queryParams.append('page', params.page.toString());
            if (params?.limit) queryParams.append('limit', params.limit.toString());

            const queryString = queryParams.toString();
            const response = await api.get<any>(`/resources${queryString ? `?${queryString}` : ''}`);
            return Array.isArray(response) ? response : response.data || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
    });
}
```

**Características:**
- ✅ Usa React Query
- ✅ Query keys estructuradas
- ✅ staleTime de 5 minutos
- ✅ Usa `useApiClient` (wrapper de fetch)

---

### 3. Préstamos (`loans-client.tsx`)

**Hook:** `useLoans` (React Query)

```typescript
const { data: loansData, isLoading, error } = useLoans();
```

**Implementación** (`use-loans.ts`):
```typescript
export function useLoans() {
    return useQuery<Loan[]>({
        queryKey: loanKeys.list(),
        queryFn: () => LoansApi.getAll(),
        staleTime: 0,                         // always stale
        refetchInterval: 3 * 1000,            // poll every 3s
        refetchIntervalInBackground: true,    // keep polling when inactive
        refetchOnWindowFocus: true,
    });
}
```

**Características:**
- ✅ Usa React Query
- ✅ Query keys estructuradas
- ⚠️ **staleTime: 0** - Siempre considera los datos obsoletos
- ⚠️ **refetchInterval: 3s** - Polling agresivo cada 3 segundos
- ⚠️ **refetchIntervalInBackground: true** - Polling incluso en background

**Problema:** Polling muy agresivo puede causar carga innecesaria.

---

### 4. Reservaciones (`reservaciones-client.tsx`)

**Hook:** `useReservationsByDateRange` (React Query)

```typescript
const { data: slots, isFetching: isFetchingSlots, error: errorSlots } = useReservationsByDateRange(
    currentWeekStart.toISOString().split('T')[0],
    weekEnd.toISOString().split('T')[0],
    selectedClassroomId,
    selectedShift
);
```

**Implementación** (`use-reservations.ts`):
```typescript
export function useReservationsByDateRange(startDate: string, endDate: string, classroomId?: string, shift?: string) {
    return useQuery({
        queryKey: reservationKeys.byDateRange(startDate, endDate, classroomId, shift),
        queryFn: () => ReservationsApi.getByDateRange(startDate, endDate, classroomId, shift),
        staleTime: 1 * 60 * 1000, // 1 minuto
        enabled: !!startDate && !!endDate,
        placeholderData: (previousData) => previousData, // Mantiene datos anteriores mientras carga
    });
}
```

**Características:**
- ✅ Usa React Query
- ✅ Query keys con parámetros
- ✅ staleTime de 1 minuto
- ✅ `enabled` para queries condicionales
- ✅ `placeholderData` para UX suave

---

## 🔧 API Client Wrapper

### `useApiClient` Hook

Todos los hooks usan un wrapper personalizado:

```typescript
const api = useApiClient();

// Uso:
await api.get('/resources');
await api.post('/resources', data);
await api.put('/resources/123', data);
await api.delete('/resources/123');
```

**Ubicación:** `apps/web/src/lib/api-client.ts` (probablemente)

---

## 📊 Resumen de Patrones por Página

| Página | Patrón | Hook Principal | staleTime | Polling | Notas |
|--------|--------|----------------|-----------|---------|-------|
| **Dashboard** | `fetch` manual | N/A | N/A | No | ❌ No usa React Query |
| **Inventario** | React Query | `useResources` | 5 min | No | ✅ Bien configurado |
| **Préstamos** | React Query | `useLoans` | 0 | 3s | ⚠️ Polling agresivo |
| **Reservaciones** | React Query | `useReservationsByDateRange` | 1 min | No | ✅ Bien configurado |

---

## 🎯 Query Keys Structure

Todos los hooks usan query keys estructuradas:

```typescript
// Resources
export const resourceKeys = {
    all: ['resources'] as const,
    list: (params?: any) => [...resourceKeys.all, 'list', params] as const,
    stats: () => [...resourceKeys.all, 'stats'] as const,
    detail: (id: string) => [...resourceKeys.all, 'detail', id] as const,
};

// Loans
export const loanKeys = {
    all: ['loans'] as const,
    list: () => [...loanKeys.all] as const,
    detail: (id: string) => [...loanKeys.all, id] as const,
};

// Reservations
export const reservationKeys = {
    all: ['reservations'] as const,
    byDateRange: (start: string, end: string, classroomId?: string, shift?: string) =>
        [...reservationKeys.all, 'range', start, end, classroomId, shift] as const,
    myToday: () => [...reservationKeys.all, 'my-today'] as const,
    attendance: (reservationId: string) => [...reservationKeys.all, 'attendance', reservationId] as const,
    tasks: (reservationId: string) => [...reservationKeys.all, 'tasks', reservationId] as const,
};
```

**Ventajas:**
- ✅ Type-safe
- ✅ Fácil invalidación
- ✅ Consistente

---

## 🔄 Mutations Pattern

Todos los hooks de mutación siguen el mismo patrón:

```typescript
export function useCreateResource() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: any) => api.post<Resource>('/resources', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: resourceKeys.all });
        },
    });
}
```

**Características:**
- ✅ Invalidación automática de queries relacionadas
- ✅ Optimistic updates en algunos casos (loans)
- ✅ Toast notifications en algunos casos

---

## 🚨 Problemas Identificados

### 1. Dashboard no usa React Query
**Archivo:** `apps/web/src/app/(dashboard)/dashboard/page.tsx`

```typescript
// ❌ Fetch manual
fetch('/api/institutions/my-institution')
    .then(async res => {
        if (res.ok) {
            const data = await res.json();
            setInstitution(data);
        }
    })
```

**Debería ser:**
```typescript
// ✅ React Query
const { data: institution } = useQuery({
    queryKey: ['my-institution'],
    queryFn: () => api.get('/institutions/my-institution'),
    staleTime: 5 * 60 * 1000,
});
```

---

### 2. Polling Agresivo en Loans
**Archivo:** `apps/web/src/features/loans/hooks/use-loans.ts`

```typescript
// ⚠️ Polling cada 3 segundos
refetchInterval: 3 * 1000,
refetchIntervalInBackground: true,
```

**Problema:** 
- 20 requests por minuto
- Carga innecesaria en el servidor
- Consume batería en móviles

**Solución:**
- Aumentar a 30-60 segundos
- O usar WebSockets para updates en tiempo real

---

### 3. QueryClient no compartido globalmente
**Archivos:** Layouts

Cada layout crea su propia instancia:
```typescript
const [queryClient] = useState(() => new QueryClient());
```

**Problema:** 
- Cache no compartido entre layouts
- Puede causar re-fetches innecesarios

**Solución:**
- Crear un QueryClient global en un provider compartido

---

## ✅ Buenas Prácticas Encontradas

1. **Query Keys Estructuradas** - Todas las features usan query keys tipadas
2. **Custom Hooks** - Encapsulación de lógica de fetching
3. **API Client Wrapper** - Abstracción consistente
4. **Invalidación Automática** - Mutations invalidan queries relacionadas
5. **Placeholder Data** - UX suave en reservaciones
6. **Conditional Queries** - Uso de `enabled` para queries condicionales

---

## 📝 Recomendaciones

### Prioridad ALTA:
1. ✅ Migrar Dashboard a React Query
2. ✅ Reducir polling en Loans (de 3s a 30-60s)
3. ✅ Crear QueryClient global compartido

### Prioridad MEDIA:
4. ✅ Agregar error boundaries para queries
5. ✅ Implementar retry logic consistente
6. ✅ Agregar loading skeletons consistentes

### Prioridad BAJA:
7. ✅ Considerar React Query DevTools en desarrollo
8. ✅ Implementar prefetching para navegación anticipada
9. ✅ Agregar optimistic updates en más mutations

---

## 🎯 Conclusión

**Patrón Principal:** React Query con custom hooks

**Estado:** Mayormente bien implementado, con algunas áreas de mejora

**Próximos Pasos:**
1. Migrar Dashboard a React Query
2. Optimizar polling en Loans
3. Compartir QueryClient globalmente

---

**Estado:** Análisis completado - No se realizaron cambios
