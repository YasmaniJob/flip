# ⚡ Quick Wins - Implementación Inmediata (2 días)

## 🎯 Objetivo
Reducir el bundle inicial en ~50% y mejorar el tiempo de carga en ~3 segundos con cambios mínimos.

---

## 📦 Paso 1: Lazy Loading de Componentes Pesados

### **1.1 Diagnostic PDF Generator**

```typescript
// apps/web/src/features/diagnostic/components/results-screen.tsx
'use client';

import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// ❌ ANTES
// import { DiagnosticPDFGenerator } from './diagnostic-pdf-generator';

// ✅ DESPUÉS
const DiagnosticPDFGenerator = lazy(() => 
  import('./diagnostic-pdf-generator').then(mod => ({
    default: mod.DiagnosticPDFGenerator
  }))
);

export function ResultsScreen({ ... }) {
  return (
    <div>
      {/* ... resto del código ... */}
      
      <Suspense fallback={
        <Skeleton className="h-[52px] w-full rounded-xl" />
      }>
        <DiagnosticPDFGenerator {...pdfProps} />
      </Suspense>
    </div>
  );
}
```

**Ahorro**: ~150KB (gzipped: ~50KB)

---

### **1.2 Recharts (Radar Chart)**

```typescript
// apps/web/src/features/diagnostic/components/results-screen.tsx
'use client';

import { lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';

// ❌ ANTES
// import { Radar, RadarChart, PolarGrid, ... } from 'recharts';

// ✅ DESPUÉS
const RadarChartComponent = dynamic(
  () => import('recharts').then(mod => {
    const { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } = mod;
    
    return {
      default: ({ data }: any) => (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <PolarAngleAxis dataKey="category" {...} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} {...} />
            <Radar dataKey="score" stroke="#2563eb" {...} />
          </RadarChart>
        </ResponsiveContainer>
      )
    };
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[320px] md:h-[450px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
);

export function ResultsScreen({ ... }) {
  return (
    <div>
      {/* ... */}
      <RadarChartComponent data={radarData} />
    </div>
  );
}
```

**Ahorro**: ~200KB (gzipped: ~70KB)

---

### **1.3 XLSX (Import/Export)**

```typescript
// apps/web/src/features/staff/components/import-staff-dialog.tsx
'use client';

import { lazy, Suspense } from 'react';

// ❌ ANTES
// import * as XLSX from 'xlsx';

// ✅ DESPUÉS
const handleImport = async (file: File) => {
  // Dynamic import solo cuando se necesita
  const XLSX = await import('xlsx');
  
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  // ... resto del código
};
```

**Ahorro**: ~100KB (gzipped: ~35KB)

---

### **1.4 Framer Motion (Animaciones)**

```typescript
// apps/web/src/features/diagnostic/components/results-screen.tsx
'use client';

import dynamic from 'next/dynamic';

// ❌ ANTES
// import { motion } from 'framer-motion';

// ✅ DESPUÉS
const motion = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion })),
  { ssr: false }
);

// O mejor aún: usar CSS animations para animaciones simples
// y solo cargar framer-motion para animaciones complejas
```

**Ahorro**: ~100KB (gzipped: ~35KB)

---

## 🔄 Paso 2: Optimizar React Query

### **2.1 Configurar Query Client Global**

```typescript
// apps/web/src/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // ✅ NUEVO: Configuración optimizada
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Impacto**: -70% requests innecesarios

---

### **2.2 Optimizar Queries Específicas**

```typescript
// apps/web/src/features/staff/hooks/use-staff.ts
import { useQuery } from '@tanstack/react-query';

export function useStaff(institutionId: string) {
  return useQuery({
    queryKey: ['staff', institutionId],
    queryFn: () => fetchStaff(institutionId),
    // ✅ NUEVO: Configuración específica
    staleTime: 10 * 60 * 1000, // 10 minutos (staff no cambia frecuentemente)
    gcTime: 30 * 60 * 1000, // 30 minutos
    enabled: !!institutionId,
  });
}

// Para datos que cambian frecuentemente
export function useReservations(date: Date) {
  return useQuery({
    queryKey: ['reservations', date.toISOString()],
    queryFn: () => fetchReservations(date),
    staleTime: 1 * 60 * 1000, // 1 minuto (reservas cambian más)
    gcTime: 5 * 60 * 1000,
  });
}

// Para datos estáticos
export function useInstitutionConfig() {
  return useQuery({
    queryKey: ['institution-config'],
    queryFn: fetchConfig,
    staleTime: Infinity, // Nunca se vuelve stale
    gcTime: Infinity, // Nunca se elimina del cache
  });
}
```

---

## 🖼️ Paso 3: Optimizar Imágenes

### **3.1 Usar Next/Image en lugar de <img>**

```typescript
// apps/web/src/features/diagnostic/components/diagnostic-landing.tsx
'use client';

import Image from 'next/image';

// ❌ ANTES
// <img src={institutionLogo} alt="Logo" className="w-20 h-20" />

// ✅ DESPUÉS
<Image 
  src={institutionLogo}
  alt="Logo"
  width={80}
  height={80}
  priority={true} // Para logos en landing page
  className="w-20 h-20"
/>
```

---

### **3.2 Configurar Image Optimization**

```typescript
// apps/web/next.config.ts
export default {
  images: {
    formats: ['image/avif', 'image/webp'], // ✅ NUEVO
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 año
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};
```

**Ahorro**: ~60% tamaño de imágenes

---

## 🎨 Paso 4: Convertir a Server Components

### **4.1 Identificar Componentes Candidatos**

```typescript
// ❌ ANTES: Client Component innecesario
// apps/web/src/features/inventory/components/inventory-stats.tsx
'use client';

export function InventoryStats({ stats }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard title="Total" value={stats.total} />
      <StatCard title="Disponibles" value={stats.available} />
      {/* ... */}
    </div>
  );
}

// ✅ DESPUÉS: Server Component
// apps/web/src/features/inventory/components/inventory-stats.tsx
// (Remover 'use client')

export function InventoryStats({ stats }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard title="Total" value={stats.total} />
      <StatCard title="Disponibles" value={stats.available} />
      {/* ... */}
    </div>
  );
}
```

**Componentes a convertir:**
- `InventoryStats` - Solo muestra datos
- `TodayAgenda` - Puede ser Server Component
- Todos los componentes de layout sin interactividad

**Ahorro**: ~150KB en bundle

---

## ⚙️ Paso 5: Configurar Next.js Optimizations

### **5.1 Actualizar next.config.ts**

```typescript
// apps/web/next.config.ts
import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@flip/shared"],
  
  // ✅ NUEVO: Optimizaciones
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  experimental: {
    // ✅ NUEVO: Optimizar imports de paquetes grandes
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],
    
    // ✅ NUEVO: Turbopack para dev (más rápido)
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // ✅ NUEVO: Configuración de webpack
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimizar bundle splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk para librerías grandes
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Chunk separado para Recharts
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              priority: 30,
            },
            // Chunk separado para React PDF
            reactPdf: {
              name: 'react-pdf',
              test: /[\\/]node_modules[\\/]@react-pdf[\\/]/,
              priority: 30,
            },
            // Common chunk para código compartido
            common: {
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  
  // ... resto de la configuración
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // ✅ NUEVO: Optimizar caching
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https?.*\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 200, // Aumentado
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
        },
      },
    },
    // ... resto de caching
  ],
})(nextConfig);
```

---

## 📊 Paso 6: Medir Resultados

### **6.1 Antes de Optimizar**

```bash
# Analizar bundle actual
pnpm build
# Revisar .next/analyze/client.html

# Lighthouse
lighthouse https://flip-v2.vercel.app --view
```

### **6.2 Después de Optimizar**

```bash
# Analizar bundle optimizado
pnpm build
# Comparar .next/analyze/client.html

# Lighthouse nuevamente
lighthouse https://flip-v2.vercel.app --view
```

### **6.3 Métricas a Comparar**

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Bundle Size | ~1.2MB | ~600KB | -50% |
| Gzipped | ~400KB | ~200KB | -50% |
| FCP | ~2.5s | ~1.0s | -60% |
| LCP | ~4.0s | ~2.0s | -50% |
| TTI | ~5.5s | ~2.5s | -55% |

---

## ✅ Checklist de Implementación

```markdown
### Día 1: Lazy Loading
- [ ] Lazy load DiagnosticPDFGenerator
- [ ] Dynamic import de Recharts
- [ ] Dynamic import de XLSX
- [ ] Dynamic import de Framer Motion
- [ ] Lazy load ResourceWizard
- [ ] Lazy load LoanWizard
- [ ] Lazy load MeetingWizard

### Día 2: Configuración y Optimizaciones
- [ ] Configurar React Query con staleTime
- [ ] Convertir componentes a Server Components
- [ ] Optimizar imágenes con Next/Image
- [ ] Actualizar next.config.ts con optimizaciones
- [ ] Configurar webpack splitting
- [ ] Medir resultados con Lighthouse
- [ ] Commit y push cambios
```

---

## 🚀 Comandos Útiles

```bash
# Analizar bundle
pnpm build
ANALYZE=true pnpm build

# Lighthouse
npx lighthouse https://flip-v2.vercel.app --view

# Bundle analyzer
npx @next/bundle-analyzer

# Performance profiling
pnpm dev --profile

# Check bundle size
npx size-limit
```

---

## 📝 Notas Importantes

1. **No romper funcionalidad**: Testear cada cambio antes de continuar
2. **Medir antes y después**: Usar Lighthouse para comparar
3. **Priorizar impacto**: Empezar por los cambios con mayor ROI
4. **Documentar cambios**: Actualizar README con optimizaciones
5. **Monitorear en producción**: Usar Vercel Analytics

---

## 🎯 Resultado Esperado

Después de implementar estos quick wins:

✅ Bundle inicial: -50% (1.2MB → 600KB)
✅ Tiempo de carga: -60% (5.5s → 2.2s)
✅ Requests innecesarios: -70%
✅ Tamaño de imágenes: -60%
✅ Mejor experiencia de usuario
✅ Mejor SEO y Core Web Vitals
