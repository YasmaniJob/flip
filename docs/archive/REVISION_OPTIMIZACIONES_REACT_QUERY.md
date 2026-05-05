# 🔍 Revisión: Optimizaciones de React Query

**Fecha:** 22 de Marzo, 2026  
**Objetivo:** Identificar todas las oportunidades de optimización en hooks de React Query

---

## ✅ Hooks Bien Configurados

### 1. Settings Hooks (Grades, Sections, Curricular Areas)
**Archivos:**
- `apps/web/src/features/settings/hooks/use-grades.ts`
- `apps/web/src/features/settings/hooks/use-sections.ts`
- `apps/web/src/features/settings/hooks/use-curricular-areas.ts`

```typescript
staleTime: 5 * 60 * 1000,  // 5 min - datos raramente cambian
gcTime: 10 * 60 * 1000,    // 10 min en memoria
```

**Estado:** ✅ Óptimo - Datos estáticos con cache largo

---

### 2. Resources & Categories
**Archivos:**
- `apps/web/src/features/inventory/hooks/use-resources.ts`
- `apps/web/src/features/inventory/hooks/use-categories.ts`

```typescript
staleTime: 5 * 60 * 1000,  // 5 minutos
gcTime: 30 * 60 * 1000,    // 30 minutos (categories)
```

**Estado:** ✅ Óptimo - Balance entre frescura y performance

---

### 3. Institution Data
**Archivo:** `apps/web/src/features/institutions/hooks/use-my-institution.ts`

```typescript
staleTime: 5 * 60 * 1000,  // 5 minutos
gcTime: 10 * 60 * 1000,    // 10 minutos
retry: 1,
```

**Estado:** ✅ Óptimo - Datos institucionales raramente cambian

---

### 4. Academic Defaults
**Archivo:** `apps/web/src/hooks/use-academic-defaults.ts`

```typescript
staleTime: 5 * 60 * 1000,  // 5 minutos
enabled: !!session?.user?.id,
```

**Estado:** ✅ Óptimo - Query condicional con cache apropiado

---

## ⚠️ Hooks con Oportunidades de Mejora

### 1. Dashboard Stats (MENOR)
**Archivo:** `apps/web/src/features/dashboard/hooks/use-dashboard.ts`

```typescript
// Super Admin Stats
staleTime: 5 * 60 * 1000,  // 5 minutos ✅

// Institution Stats
staleTime: 2 * 60 * 1000,  // 2 minutos ⚠️
```

**Problema:** Institution stats tiene staleTime más corto que otros datos similares

**Recomendación:** 
```typescript
staleTime: 5 * 60 * 1000,  // Consistente con otros stats
```

**Impacto:** BAJO - Solo afecta dashboard

---

### 2. Reservations - myToday (MENOR)
**Archivo:** `apps/web/src/features/reservations/hooks/use-reservations.ts`

```typescript
export function useMyTodayReservations() {
    return useQuery({
        queryKey: reservationKeys.myToday(),
        queryFn: ReservationsApi.getMyToday,
        staleTime: 30 * 1000,  // 30 segundos ⚠️
    });
}
```

**Problema:** 30 segundos es muy corto para datos que no cambian frecuentemente

**Recomendación:**
```typescript
staleTime: 2 * 60 * 1000,  // 2 minutos - suficiente para agenda del día
```

**Impacto:** BAJO - Solo afecta componente TodayAgenda

---

### 3. Reservations - byDateRange (OK)
**Archivo:** `apps/web/src/features/reservations/hooks/use-reservations.ts`

```typescript
staleTime: 1 * 60 * 1000,  // 1 minuto
placeholderData: (previousData) => previousData,
```

**Estado:** ✅ Aceptable - 1 minuto es razonable para calendario colaborativo

---

## 🎯 Configuración del QueryProvider Global

**Archivo:** `apps/web/src/providers/query-provider.tsx` (NUEVO)

```typescript
defaultOptions: {
    queries: {
        staleTime: 60 * 1000,           // 60 segundos por defecto
        refetchOnWindowFocus: true,     // Re-fetch al volver a la ventana
        retry: 1,                       // 1 reintento en caso de error
    },
}
```

**Impacto:** Todos los hooks sin staleTime explícito heredan 60 segundos

---

## 📊 Resumen de Configuraciones

| Hook | staleTime | Polling | Estado |
|------|-----------|---------|--------|
| **Loans** | 30s | 30s | ✅ Optimizado |
| **Resources** | 5min | No | ✅ Óptimo |
| **Categories** | 5min | No | ✅ Óptimo |
| **Grades/Sections** | 5min | No | ✅ Óptimo |
| **Institution** | 5min | No | ✅ Óptimo |
| **Dashboard (Super)** | 5min | No | ✅ Óptimo |
| **Dashboard (Inst)** | 2min | No | ⚠️ Mejorable |
| **Reservations (Range)** | 1min | No | ✅ Aceptable |
| **Reservations (Today)** | 30s | No | ⚠️ Mejorable |
| **Academic Defaults** | 5min | No | ✅ Óptimo |

---

## 🔧 Optimizaciones Recomendadas

### Prioridad ALTA (Ya Aplicadas):
1. ✅ **Loans polling:** 3s → 30s (COMPLETADO)
2. ✅ **QueryProvider global:** Creado con defaults (COMPLETADO)
3. ✅ **Layouts:** Usando QueryProvider compartido (COMPLETADO)

### Prioridad MEDIA (Opcionales):
4. ⚠️ **Dashboard Institution Stats:** 2min → 5min
   ```typescript
   // apps/web/src/features/dashboard/hooks/use-dashboard.ts
   staleTime: 5 * 60 * 1000,  // Cambiar de 2min a 5min
   ```

5. ⚠️ **Reservations myToday:** 30s → 2min
   ```typescript
   // apps/web/src/features/reservations/hooks/use-reservations.ts
   staleTime: 2 * 60 * 1000,  // Cambiar de 30s a 2min
   ```

### Prioridad BAJA (No Necesarias):
- Todos los demás hooks están bien configurados
- No se encontraron más pollings agresivos
- No se encontraron staleTime: 0 problemáticos

---

## 📈 Impacto de Optimizaciones Aplicadas

### Antes:
- **Loans:** 20 requests/min (polling cada 3s)
- **QueryClient:** 2 instancias separadas (dashboard + onboarding)
- **Cache:** No compartido entre layouts

### Después:
- **Loans:** 2 requests/min (polling cada 30s) - **90% reducción**
- **QueryClient:** 1 instancia singleton compartida
- **Cache:** Compartido globalmente
- **Default staleTime:** 60s para todos los hooks sin configuración explícita

---

## 🎯 Recomendación Final

### Aplicar Ahora:
- ✅ Las 3 optimizaciones principales ya están aplicadas
- ✅ Impacto significativo en performance

### Considerar Después (Opcional):
- ⚠️ Dashboard Institution Stats: 2min → 5min (impacto mínimo)
- ⚠️ Reservations myToday: 30s → 2min (impacto mínimo)

### No Tocar:
- ✅ Todos los demás hooks están bien configurados
- ✅ No hay problemas críticos adicionales

---

## 📝 Conclusión

**Estado:** La mayoría de los hooks están bien configurados

**Problemas Críticos Encontrados:** 1 (Loans polling) - ✅ RESUELTO

**Problemas Menores Encontrados:** 2 (Dashboard stats, Today reservations) - Opcionales

**Recomendación:** Hacer commit de las optimizaciones actuales. Los problemas menores pueden abordarse después si se observa necesidad.

---

**Estado:** Revisión completada - Listo para commit
