# 🎨 Unificación de Headers de Página

**Fecha:** 22 de Marzo, 2026  
**Problema:** Diseño atomizado de botones de acción en diferentes páginas

---

## 🔍 Problema Identificado

Cada página tenía su propio diseño de header con botones inconsistentes:

### Antes:

| Página | Botón Principal | Variante | Size | Icono |
|--------|----------------|----------|------|-------|
| **Inventario** | "Nuevo Recurso" | `default` | `sm` | Plus |
| **Préstamos** | "Nuevo Préstamo" | `jira` | `lg` | Plus |
| **Personal** | "Nuevo Personal" | `default` | (sin size) | Plus |
| **Personal** | "Importar" | `outline` | (sin size) | Upload |
| **Reservaciones** | (sin botón) | - | - | - |

**Problemas:**
- ❌ Variantes diferentes (`default`, `jira`)
- ❌ Tamaños diferentes (`sm`, `lg`, sin size)
- ❌ Estructura HTML diferente en cada página
- ❌ Código duplicado en 4 archivos
- ❌ Difícil mantener consistencia visual

---

## ✅ Solución Implementada

### 1. Componente Unificado: `PageHeader`

**Ubicación:** `apps/web/src/components/layout/page-header.tsx`

**Características:**
- ✅ Diseño consistente en todas las páginas
- ✅ Soporte para acción primaria y secundarias
- ✅ Iconos personalizables
- ✅ Subtitle opcional
- ✅ Responsive por defecto
- ✅ Variantes controladas (`default` para primaria, `outline` para secundarias)

**API:**

```typescript
interface PageHeaderAction {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: "default" | "outline";
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    primaryAction?: PageHeaderAction;
    secondaryActions?: PageHeaderAction[];
    className?: string;
}
```

---

## 📝 Archivos Actualizados

### 1. Inventario
**Archivo:** `apps/web/src/features/inventory/components/inventory-header.tsx`

```tsx
<PageHeader
  title="Inventario"
  primaryAction={onAddResource ? {
    label: "Nuevo Recurso",
    onClick: onAddResource
  } : undefined}
/>
```

---

### 2. Préstamos
**Archivo:** `apps/web/src/app/(dashboard)/loans/loans-client.tsx`

```tsx
<PageHeader
  title="Gestión de Préstamos"
  primaryAction={{
    label: "Nuevo Préstamo",
    onClick: () => setIsWizardOpen(true)
  }}
  className="mb-8"
/>
```

**Cambios:**
- ❌ Removido `variant="jira" size="lg"`
- ✅ Ahora usa `variant="default"` (estándar)

---

### 3. Personal
**Archivo:** `apps/web/src/features/staff/components/staff-list.tsx`

```tsx
<PageHeader
  title="Personal"
  primaryAction={{
    label: "Nuevo Personal",
    onClick: openAdd
  }}
  secondaryActions={[
    {
      label: "Importar",
      onClick: () => setIsImportOpen(true),
      variant: "outline"
    }
  ]}
/>
```

**Cambios:**
- ✅ Botón "Importar" ahora es acción secundaria
- ✅ Orden consistente: secundarias primero, primaria al final

---

### 4. Reservaciones
**Archivo:** `apps/web/src/app/(dashboard)/reservaciones/reservaciones-client.tsx`

```tsx
<PageHeader
  title="Reservaciones del AIP"
/>
```

**Cambios:**
- ✅ Header simplificado (sin botones por ahora)
- ✅ Estructura consistente con otras páginas

---

## 🎯 Beneficios

### Consistencia Visual
- ✅ Todos los botones primarios: `variant="default"` (sin size)
- ✅ Todos los botones secundarios: `variant="outline"`
- ✅ Iconos siempre `h-3.5 w-3.5 mr-2`
- ✅ Espaciado consistente: `gap-2`

### Mantenibilidad
- ✅ Un solo lugar para cambiar diseño de headers
- ✅ Menos código duplicado (4 archivos → 1 componente)
- ✅ Fácil agregar nuevas páginas con diseño consistente

### Escalabilidad
- ✅ Fácil agregar subtítulos
- ✅ Fácil agregar múltiples acciones secundarias
- ✅ Fácil personalizar iconos

---

## 📊 Comparación Antes/Después

### Antes (Código Duplicado):
```tsx
// Inventario
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-3xl font-black tracking-tighter text-foreground">
      Inventario
    </h1>
  </div>
  {onAddResource && (
    <div className="shrink-0">
      <Button variant="default" size="sm" onClick={onAddResource}>
        <Plus className="h-3.5 w-3.5 mr-2" />
        Nuevo Recurso
      </Button>
    </div>
  )}
</div>

// Préstamos
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
  <div>
    <h1 className="text-3xl font-black tracking-tighter text-foreground">
      Gestión de Préstamos
    </h1>
  </div>
  <div className="flex items-center gap-2">
    <Button onClick={() => setIsWizardOpen(true)} variant="jira" size="lg">
      <Plus className="h-5 w-5 mr-2" />
      Nuevo Préstamo
    </Button>
  </div>
</div>

// Personal
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-3xl font-black tracking-tighter text-foreground">
      Personal
    </h1>
  </div>
  <div className="flex gap-2 shrink-0">
    <Button variant="outline" onClick={() => setIsImportOpen(true)}>
      <Upload className="h-3.5 w-3.5 mr-2" />
      Importar
    </Button>
    <Button variant="default" onClick={openAdd}>
      <Plus className="h-3.5 w-3.5 mr-2" />
      Nuevo Personal
    </Button>
  </div>
</div>
```

### Después (Componente Unificado):
```tsx
// Todas las páginas
<PageHeader
  title="Título de la Página"
  primaryAction={{
    label: "Acción Principal",
    onClick: handleAction
  }}
  secondaryActions={[
    {
      label: "Acción Secundaria",
      onClick: handleSecondary,
      variant: "outline"
    }
  ]}
/>
```

---

## 🚀 Uso Futuro

Para agregar una nueva página con header consistente:

```tsx
import { PageHeader } from "@/components/layout/page-header";

export function NuevaPaginaClient() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
      <PageHeader
        title="Nueva Página"
        subtitle="Descripción opcional"
        primaryAction={{
          label: "Nueva Acción",
          onClick: handleCreate
        }}
        secondaryActions={[
          {
            label: "Importar",
            onClick: handleImport,
            variant: "outline"
          },
          {
            label: "Exportar",
            onClick: handleExport,
            variant: "outline"
          }
        ]}
      />
      
      {/* Resto del contenido */}
    </div>
  );
}
```

---

## 📋 Checklist de Implementación

- ✅ Crear componente `PageHeader`
- ✅ Actualizar Inventario
- ✅ Actualizar Préstamos
- ✅ Actualizar Personal
- ✅ Actualizar Reservaciones
- ✅ Verificar TypeScript (sin errores)
- ✅ Documentar cambios

---

## 🎨 Diseño Final

Todas las páginas ahora tienen:

```
┌─────────────────────────────────────────────────────────┐
│  Título de la Página                    [Sec] [Primario]│
└─────────────────────────────────────────────────────────┘
```

- **Título:** `text-3xl font-black tracking-tighter`
- **Botones Secundarios:** `variant="outline"` con icono
- **Botón Primario:** `variant="default"` con icono Plus
- **Espaciado:** `gap-2` entre botones
- **Responsive:** Stack vertical en mobile

---

**Estado:** ✅ Completado - Listo para commit
