# Flip — Interface Design System

> **Google Labs-inspired:** flat, generous whitespace, soft tinted surfaces.
> Zero shadows. Zero gradients. Borders-only depth.

---

## Direction & Feel

**Who:** Teachers and school coordinators managing classroom resources, loans, and meetings. Often working quickly between classes — they need clarity over decoration.

**What they must do:** See status at a glance (available, borrowed, overdue), take an action (return, schedule, mark attendance), and move on. Every second counts.

**How it should feel:** Calm like a notebook. Clean like Google Workspace. Nothing shouts. Structure whispers.

**Signature:** Typography-driven hierarchy — no heavy UI chrome. Big numbers speak louder than colored banners. The interface recedes so the data leads.

---

## Token Architecture

All colors must trace back to these tokens. **No hardcoded Tailwind scale values** (`slate-*`, `red-*`, `bg-white`, etc.).

### Surface Tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg-background` | white | near-black | Canvas / page root |
| `bg-card` | white | dark-raised | Cards, list items, panels |
| `bg-muted` | light gray | dark muted | Backgrounds of empty states, subtle fills |
| `bg-sidebar` | near-white | very dark | Sidebar surface |

### Text Tokens

| Token | Role |
|---|---|
| `text-foreground` | Primary — names, titles, data |
| `text-muted-foreground` | Secondary — metadata, dates, labels, icons |
| `text-muted-foreground/60` | Tertiary — icon fills, decorative elements |
| `text-foreground/70` | Return date, secondary data on same item |

### Border Tokens

| Token | Usage |
|---|---|
| `border-border` | Default card borders, dividers, inputs |
| `border-border/60` | Softer separation, less critical boundaries |
| `border-primary` | Hover state on interactive cards |

### Semantic Tokens

| Token | Usage |
|---|---|
| `text-destructive` / `bg-destructive/10` | Overdue loans, errors, damage reports |
| `border-destructive/20` | Card border on overdue state |
| `text-success` / `bg-success/5` | Attended slots, returned items |
| `border-success/20` | Card border on success state |
| `text-warning` / `bg-warning/10` | Warnings, pending actions |

### ❌ Never Use

```
bg-white        → bg-card
text-slate-900  → text-foreground
text-slate-500  → text-muted-foreground
text-slate-400  → text-muted-foreground/60
border-slate-*  → border-border
text-red-*      → text-destructive
bg-red-*        → bg-destructive/10
bg-slate-50     → bg-muted/50
border-slate-100 → border-border
```

---

## Depth Strategy: **Borders-only**

No shadows. No elevation through color shifts. Structure through borders alone.

```css
/* Correct */
border border-border rounded-xl

/* Hover on interactive cards */
hover:border-primary

/* State-specific borders */
border-destructive/20   /* overdue */
border-success/20       /* completed */
```

> Exception: `category-card.tsx` uses dynamic tinted backgrounds derived from user-defined category colors. This is intentional — not a shadow/gradient pattern.

---

## Typography

**Font:** `Inter` (defined in `globals.css` as `--font-sans`)

| Element | Classes |
|---|---|
| Page title | `text-3xl font-bold tracking-tight text-foreground` |
| Section heading | `text-2xl font-bold text-foreground` |
| Card title / name | `font-bold text-foreground leading-none` |
| Metadata row | `text-sm text-muted-foreground font-medium` |
| Labels (uppercase) | `text-sm font-medium text-muted-foreground uppercase tracking-wide` |
| "Big number" stat | `text-5xl font-black tracking-tighter text-foreground` (category cards) |
| Description / note | `text-sm text-muted-foreground` |

---

## Spacing

**Base unit:** `4` (Tailwind default)

| Context | Value |
|---|---|
| Page padding | `p-6` |
| Card padding | `p-5` |
| Section gap | `space-y-6` |
| Metadata icon-text gap | `gap-2` |
| Metadata items row gap | `gap-x-6 gap-y-2` |
| Grid gap between cards | `gap-4` |

---

## Border Radius Scale

```
--radius: 0.625rem (10px base)
```

| Element | Class |
|---|---|
| Buttons | `rounded-full` (pill) |
| Cards / list items | `rounded-xl` |
| Badges / pills | `rounded-full` |
| Modals / dialogs | `rounded-2xl` |
| Category cards | `rounded-[2rem]` (special — emoji-heavy, playful) |

---

## Component Patterns

### Buttons

**Fuente única de verdad:** `@/components/atoms/button`  
**NO** importar desde `@/components/ui/button` (es un re-export — pero la fuente canónica es `atoms`).

```tsx
import { Button } from '@/components/atoms/button';

// Primary action
<Button>Nuevo Préstamo</Button>

// Secondary / cancel
<Button variant="ghost">Cancelar</Button>

// Destructive
<Button variant="destructive">Eliminar</Button>

// With icon
<Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo X</Button>
```

**Base ya definida en el átomo — no sobreescribir:**
- `rounded-full` (pill) — NO añadir `rounded-*` en className
- `shadow-none` — NO añadir `shadow-*` en className
- Hover via `bg-primary/90` — NO añadir hovers de color inline

**Variantes disponibles:** `default` · `destructive` · `outline` · `secondary` · `ghost` · `link`  
**Sizes:** `default` (h-10) · `sm` (h-9) · `lg` (h-11) · `icon` (h-10 w-10)

---

### Page Layout
```tsx
<div className="p-6 space-y-6 max-w-7xl mx-auto">
  <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold tracking-tight text-foreground">…</h1>
    <Button className="gap-2"><Plus /> Nuevo X</Button>
  </div>
  {/* content */}
</div>
```

### Tabs (underline style — not pill/box)
```tsx
<TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 mb-6">
  <TabsTrigger
    value="active"
    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 py-2 font-medium"
  >
    Label ({count})
  </TabsTrigger>
</TabsList>
```

### Data Card con estado (patrón estándar)

Usado en `meeting-card.tsx` y `loan-card.tsx`. La estructura es siempre `flex` horizontal:
- Barra de `w-1` izquierda que comunica el estado con color
- Date badge `w-11 h-11 rounded-lg border` con mes + día
- Cuerpo con nombre principal `text-sm font-semibold` y metadata como pills `text-[11px]`

```tsx
<div className={cn(
  'bg-card rounded-xl border overflow-hidden transition-colors duration-200 flex',
  styles.border  // solo el color del borde cambia, NO el fondo de la card
)}>
  {/* Left status bar — comunica el estado */}
  <div className={cn('w-1 shrink-0 transition-colors duration-300', styles.leftBar)} />

  {/* Card body */}
  <div className="flex-1 min-w-0 px-5 py-4 flex items-start gap-4">
    {/* Date badge */}
    <div className={cn(
      'shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-lg border',
      styles.dateBlock
    )}>
      <span className={cn('text-[9px] font-bold uppercase tracking-wider leading-none', styles.dateMonth)}>MMM</span>
      <span className={cn('text-lg font-bold leading-tight tabular-nums', styles.dateDay)}>DD</span>
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      {/* Meta row: time · status badge */}
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-xs text-muted-foreground">{time}</span>
        {hasStatus && <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md {styles.badge.bg}">{label}</span>}
      </div>
      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground leading-snug">{title}</h3>
      {/* Actor/metadata pills */}
      <div className="flex flex-wrap gap-1 mt-1.5">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-muted-foreground">
          <Icon className="h-3 w-3" />{value}
        </span>
      </div>
    </div>
  </div>
</div>
```

**Regla:** El estado NUNCA se comunica con fondo de card (`bg-destructive/5`). Solo con la barra izquierda y el borde.

### Metadata Row (icon + label pairs)
```tsx
<div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-3 font-medium">
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-muted-foreground/60" />
    <span>value</span>
  </div>
</div>
```

### Status Badge / Pill
```tsx
{/* Destructive */}
<div className="flex items-center gap-1.5 text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded-full">
  <AlertTriangle className="w-3.5 h-3.5" />
  Vencido (N días)
</div>

{/* Success */}
<div className="flex items-center gap-1 text-success text-sm font-medium">
  <Check className="w-4 w-4" />
  Asistió
</div>
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-border rounded-xl bg-muted/50">
  <div className="h-12 w-12 bg-background rounded-full flex items-center justify-center mb-4 border border-border">
    <Icon className="h-6 w-6 text-muted-foreground" />
  </div>
  <h3 className="font-medium text-foreground">No hay elementos</h3>
  <p className="text-sm text-muted-foreground mt-1">Descripción de por qué está vacío.</p>
</div>
```

### Loading State
```tsx
<div className="p-8 text-center text-muted-foreground animate-pulse">Cargando…</div>
```

### Error State
```tsx
<div className="p-8 text-center text-destructive">Error al cargar.</div>
```

---

## Interaction States

| State | Pattern |
|---|---|
| Card hover | `hover:border-primary transition-all duration-200` |
| Button loading | Replace icon with `<Loader2 className="animate-spin" />` |
| Disabled | `disabled:opacity-50` (via shadcn default) |
| Focus | `focus-visible:ring-2 focus-visible:ring-ring` (via shadcn default) |

---

## Animation

- **Micro:** `transition-all duration-200` on cards (border color, scale)
- **Loading spinners:** `animate-spin` on `Loader2`
- **Loading skeletons:** `animate-pulse` on placeholder text
- **Avoid:** spring/bounce, dramatic transitions, color flashes
- Category cards use `hover:scale-[1.02]` — acceptable for grid/gallery views, not for list items

---

## Icon Usage

- **Set:** `lucide-react` exclusively
- **Size in metadata:** `w-4 h-4`
- **Size in badges:** `w-3.5 h-3.5`
- **Color in metadata rows:** `text-muted-foreground/60`
- **Standalone icons (empty states):** wrapped in a `rounded-full bg-background border border-border` container

---

## Sidebar

- Same hue as background, slightly lighter: `bg-sidebar`
- Separated by border only: `border-r border-sidebar-border`
- Active item: `bg-sidebar-primary text-sidebar-primary-foreground rounded-lg`
- Inactive item hover: `bg-sidebar-accent text-sidebar-accent-foreground`

---

## Dark Mode

Handled automatically via CSS variables — no `dark:` overrides needed in components if tokens are used correctly. The system shifts surfaces from white/near-white to dark grays while keeping the same structural relationships.
