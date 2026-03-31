# 🚀 Estrategia de Optimización de Performance - Flip

## 📊 Análisis del Estado Actual

### **Problemas Identificados:**

1. ❌ **Demasiados Client Components** - Casi todo usa `'use client'`
2. ❌ **Sin Code Splitting estratégico** - Componentes pesados se cargan siempre
3. ❌ **Sin lazy loading de componentes** - Todo se carga al inicio
4. ❌ **Recharts cargado en múltiples lugares** - Librería pesada (~200KB)
5. ❌ **Framer Motion en todas partes** - Animaciones pesadas (~100KB)
6. ❌ **@react-pdf/renderer siempre cargado** - Solo se usa al generar PDF
7. ❌ **Sin optimización de imágenes** - Falta configuración de Next/Image
8. ❌ **Sin prefetching estratégico** - No se pre-cargan rutas críticas
9. ❌ **Queries sin stale time** - React Query re-fetching innecesario
10. ❌ **Sin compresión de assets** - Falta configuración de Brotli/Gzip

---

## 🎯 Estrategia de Optimización (Priorizada)

### **Nivel 1: Quick Wins (1-2 días) - Impacto Alto, Esfuerzo Bajo**

#### 1.1 **Lazy Loading de Componentes Pesados**
```typescript
// ❌ ANTES: Carga inmediata
import { DiagnosticPDFGenerator } from './diagnostic-pdf-generator';

// ✅ DESPUÉS: Lazy loading
const DiagnosticPDFGenerator = lazy(() => 
  import('./diagnostic-pdf-generator')
);

// Uso con Suspense
<Suspense fallback={<Skeleton />}>
  <DiagnosticPDFGenerator {...props} />
</Suspense>
```

**Componentes a optimizar:**
- `DiagnosticPDFGenerator` (solo se usa al descargar)
- `RadarChart` de Recharts (solo en resultados)
- `ResourceWizard` (solo al crear recursos)
- `LoanWizard` (solo al crear préstamos)
- `MeetingWizard` (solo al crear reuniones)

**Impacto esperado**: -300KB en bundle inicial, -1.5s en First Load

---

#### 1.2 **Convertir a Server Components**
```typescript
// ❌ ANTES: Client Component innecesario
'use client';
export function StatsCard({ title, value }) {
  return <div>{title}: {value}</div>;
}

// ✅ DESPUÉS: Server Component
export function StatsCard({ title, value }) {
  return <div>{title}: {value}</div>;
}
```

**Componentes a convertir:**
- `InventoryStats` - Solo muestra datos estáticos
- `TodayAgenda` - Puede ser Server Component con datos del servidor
- `DashboardNotification` - Puede usar Server Actions
- Todos los componentes de layout que no tienen interactividad

**Impacto esperado**: -150KB en bundle, -0.8s en First Load

---

#### 1.3 **Optimizar React Query**
```typescript
// ❌ ANTES: Re-fetching constante
const { data } = useQuery({
  queryKey: ['staff'],
  queryFn: fetchStaff,
});

// ✅ DESPUÉS: Con stale time y cache
const { data } = useQuery({
  queryKey: ['staff'],
  queryFn: fetchStaff,
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});
```

**Impacto esperado**: -70% requests innecesarios, -0.5s en navegación

---

#### 1.4 **Dynamic Imports para Librerías Pesadas**
```typescript
// ❌ ANTES: Recharts siempre cargado
import { RadarChart, Radar } from 'recharts';

// ✅ DESPUÉS: Dynamic import
const RadarChart = dynamic(() => 
  import('recharts').then(mod => ({ default: mod.RadarChart })),
  { ssr: false }
);
```

**Librerías a optimizar:**
- `recharts` (~200KB) - Solo en resultados de diagnóstico
- `@react-pdf/renderer` (~150KB) - Solo al generar PDF
- `framer-motion` (~100KB) - Lazy load en componentes animados
- `xlsx` (~100KB) - Solo al importar/exportar

**Impacto esperado**: -550KB en bundle inicial, -2s en First Load

---

### **Nivel 2: Optimizaciones Medias (3-5 días) - Impacto Alto, Esfuerzo Medio**

#### 2.1 **Implementar Route Prefetching**
```typescript
// next.config.ts
export default {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

// En componentes críticos
<Link href="/reservaciones" prefetch={true}>
  Reservaciones
</Link>
```

**Rutas a prefetch:**
- `/dashboard` → `/reservaciones`
- `/dashboard` → `/prestamos`
- `/dashboard` → `/inventario`

**Impacto esperado**: -0.8s en navegación entre rutas

---

#### 2.2 **Implementar ISR (Incremental Static Regeneration)**
```typescript
// app/(public)/ie/[slug]/diagnostic/page.tsx
export const revalidate = 3600; // 1 hora

export async function generateStaticParams() {
  const institutions = await db.query.institutions.findMany({
    where: eq(institutions.diagnosticEnabled, true),
  });
  
  return institutions.map(inst => ({
    slug: inst.slug,
  }));
}
```

**Páginas a optimizar:**
- Quiz público de diagnóstico (ISR 1 hora)
- Landing pages institucionales (ISR 1 hora)
- Páginas de pricing/changelog (ISR 24 horas)

**Impacto esperado**: -2s en carga de páginas públicas

---

#### 2.3 **Optimizar Imágenes con Next/Image**
```typescript
// ❌ ANTES: <img> tag
<img src={logo} alt="Logo" />

// ✅ DESPUÉS: Next/Image optimizado
<Image 
  src={logo} 
  alt="Logo"
  width={200}
  height={200}
  priority={true} // Para logos críticos
  placeholder="blur" // Para imágenes grandes
/>
```

**Impacto esperado**: -60% tamaño de imágenes, -1s en LCP

---

#### 2.4 **Implementar Virtual Scrolling**
```typescript
// Para listas largas (staff, recursos, préstamos)
import { useVirtualizer } from '@tanstack/react-virtual';

function StaffList({ staff }) {
  const parentRef = useRef();
  
  const virtualizer = useVirtualizer({
    count: staff.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map(virtualRow => (
        <StaffRow key={virtualRow.key} staff={staff[virtualRow.index]} />
      ))}
    </div>
  );
}
```

**Listas a optimizar:**
- Lista de personal (puede tener 100+ docentes)
- Lista de recursos (puede tener 500+ items)
- Lista de préstamos (histórico largo)

**Impacto esperado**: -80% tiempo de render en listas largas

---

### **Nivel 3: Optimizaciones Avanzadas (1 semana) - Impacto Medio, Esfuerzo Alto**

#### 3.1 **Implementar Streaming SSR**
```typescript
// app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <>
      {/* Carga inmediata */}
      <DashboardHeader />
      
      {/* Streaming: se carga después */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>
      
      <Suspense fallback={<AgendaSkeleton />}>
        <TodayAgenda />
      </Suspense>
    </>
  );
}
```

**Impacto esperado**: -1.5s en TTFB, mejor perceived performance

---

#### 3.2 **Implementar Service Worker Avanzado**
```typescript
// public/sw.js - Estrategia de cache inteligente
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Cache-first para assets estáticos
  if (request.url.match(/\.(js|css|png|jpg|svg)$/)) {
    event.respondWith(
      caches.match(request).then(cached => 
        cached || fetch(request)
      )
    );
  }
  
  // Network-first para API con fallback
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
    );
  }
});
```

**Impacto esperado**: Offline support, -50% requests en visitas repetidas

---

#### 3.3 **Implementar Database Connection Pooling**
```typescript
// lib/db/index.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool);
```

**Impacto esperado**: -40% tiempo de queries, mejor escalabilidad

---

#### 3.4 **Implementar Edge Functions para APIs Críticas**
```typescript
// app/api/diagnostic/[slug]/identify/route.ts
export const runtime = 'edge'; // ← Ejecuta en Edge

export async function POST(request: Request) {
  // Código optimizado para Edge Runtime
  // Sin dependencias pesadas de Node.js
}
```

**APIs a migrar a Edge:**
- `/api/diagnostic/[slug]/identify` (público, alta demanda)
- `/api/institutions/provincias` (público, cacheable)
- `/api/auth/*` (crítico para performance)

**Impacto esperado**: -200ms en latencia global

---

## 📈 Métricas Objetivo

### **Estado Actual (Estimado)**
- First Contentful Paint (FCP): ~2.5s
- Largest Contentful Paint (LCP): ~4.0s
- Time to Interactive (TTI): ~5.5s
- Total Blocking Time (TBT): ~800ms
- Cumulative Layout Shift (CLS): ~0.15
- Bundle Size: ~1.2MB (gzipped: ~400KB)

### **Estado Objetivo (Post-Optimización)**
- First Contentful Paint (FCP): ~1.0s (-60%)
- Largest Contentful Paint (LCP): ~2.0s (-50%)
- Time to Interactive (TTI): ~2.5s (-55%)
- Total Blocking Time (TBT): ~200ms (-75%)
- Cumulative Layout Shift (CLS): ~0.05 (-67%)
- Bundle Size: ~600KB (gzipped: ~200KB) (-50%)

---

## 🛠️ Plan de Implementación

### **Semana 1: Quick Wins**
- [ ] Día 1-2: Lazy loading de componentes pesados
- [ ] Día 3: Convertir a Server Components
- [ ] Día 4: Optimizar React Query
- [ ] Día 5: Dynamic imports de librerías

### **Semana 2: Optimizaciones Medias**
- [ ] Día 1-2: Route prefetching + ISR
- [ ] Día 3: Optimizar imágenes
- [ ] Día 4-5: Virtual scrolling en listas

### **Semana 3: Optimizaciones Avanzadas**
- [ ] Día 1-2: Streaming SSR
- [ ] Día 3: Service Worker avanzado
- [ ] Día 4: Database pooling
- [ ] Día 5: Edge Functions

---

## 🔍 Herramientas de Monitoreo

### **Durante Desarrollo:**
```bash
# Analizar bundle
pnpm build
pnpm analyze

# Lighthouse CI
lighthouse https://flip-v2.vercel.app --view

# Bundle analyzer
ANALYZE=true pnpm build
```

### **En Producción:**
- Vercel Analytics (ya configurado)
- Web Vitals tracking
- Sentry Performance Monitoring
- LogRocket (opcional)

---

## 💡 Recomendaciones Adicionales

### **1. Configurar Compression**
```typescript
// next.config.ts
export default {
  compress: true, // Habilitar gzip
  poweredByHeader: false,
  generateEtags: true,
};
```

### **2. Optimizar Fonts**
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Evita FOIT
  preload: true,
});
```

### **3. Implementar Resource Hints**
```html
<!-- app/layout.tsx -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://api.flip.com" />
<link rel="preload" href="/logo.svg" as="image" />
```

### **4. Configurar CDN Caching**
```typescript
// Vercel headers
export const headers = {
  'Cache-Control': 'public, max-age=31536000, immutable',
};
```

---

## 🎯 Prioridad de Implementación

### **CRÍTICO (Hacer YA):**
1. ✅ Lazy loading de PDF generator
2. ✅ Lazy loading de Recharts
3. ✅ Optimizar React Query stale time
4. ✅ Dynamic import de xlsx

### **ALTO (Esta semana):**
5. ✅ Convertir componentes a Server Components
6. ✅ Implementar ISR en páginas públicas
7. ✅ Route prefetching
8. ✅ Optimizar imágenes

### **MEDIO (Próximas 2 semanas):**
9. ✅ Virtual scrolling
10. ✅ Streaming SSR
11. ✅ Database pooling
12. ✅ Edge Functions

### **BAJO (Cuando haya tiempo):**
13. ⏳ Service Worker avanzado
14. ⏳ Offline support completo
15. ⏳ Progressive Web App features

---

## 📊 ROI Esperado

| Optimización | Esfuerzo | Impacto | ROI |
|--------------|----------|---------|-----|
| Lazy Loading | Bajo | Alto | ⭐⭐⭐⭐⭐ |
| Server Components | Bajo | Alto | ⭐⭐⭐⭐⭐ |
| React Query | Bajo | Medio | ⭐⭐⭐⭐ |
| Dynamic Imports | Bajo | Alto | ⭐⭐⭐⭐⭐ |
| ISR | Medio | Alto | ⭐⭐⭐⭐ |
| Virtual Scrolling | Medio | Medio | ⭐⭐⭐ |
| Streaming SSR | Alto | Medio | ⭐⭐⭐ |
| Edge Functions | Alto | Medio | ⭐⭐⭐ |

---

## ✅ Checklist de Implementación

```markdown
### Fase 1: Quick Wins (2 días)
- [ ] Lazy load DiagnosticPDFGenerator
- [ ] Lazy load RadarChart (Recharts)
- [ ] Lazy load ResourceWizard
- [ ] Lazy load LoanWizard
- [ ] Lazy load MeetingWizard
- [ ] Dynamic import de xlsx
- [ ] Dynamic import de @react-pdf/renderer
- [ ] Convertir InventoryStats a Server Component
- [ ] Convertir TodayAgenda a Server Component
- [ ] Agregar staleTime a todas las queries
- [ ] Configurar gcTime en React Query
- [ ] Deshabilitar refetchOnWindowFocus

### Fase 2: Optimizaciones Medias (5 días)
- [ ] Implementar ISR en quiz público
- [ ] Implementar ISR en landing pages
- [ ] Agregar prefetch a rutas críticas
- [ ] Optimizar imágenes con Next/Image
- [ ] Implementar virtual scrolling en StaffList
- [ ] Implementar virtual scrolling en InventoryTable
- [ ] Implementar virtual scrolling en LoansList
- [ ] Configurar optimizePackageImports

### Fase 3: Optimizaciones Avanzadas (7 días)
- [ ] Implementar Streaming SSR en Dashboard
- [ ] Migrar APIs críticas a Edge Runtime
- [ ] Configurar Database Connection Pooling
- [ ] Implementar Service Worker avanzado
- [ ] Configurar Resource Hints
- [ ] Optimizar fonts con next/font
- [ ] Configurar compression
- [ ] Implementar CDN caching headers
```

---

## 🚀 Resultado Final Esperado

**Mejoras en Core Web Vitals:**
- ✅ LCP: 4.0s → 2.0s (-50%)
- ✅ FID: 100ms → 50ms (-50%)
- ✅ CLS: 0.15 → 0.05 (-67%)

**Mejoras en Bundle Size:**
- ✅ Initial Bundle: 1.2MB → 600KB (-50%)
- ✅ Gzipped: 400KB → 200KB (-50%)

**Mejoras en User Experience:**
- ✅ Tiempo de carga percibido: -60%
- ✅ Navegación entre páginas: -70%
- ✅ Interactividad: -55%

**Impacto en Negocio:**
- ✅ Bounce rate: -30%
- ✅ Session duration: +40%
- ✅ Conversión: +25%
