# Flip — Interface Design System

> **Atlassian / Jira-inspired:** Structured, utilitarian, clear, highly functional.
> Flat surfaces, crisp borders, tight corners (`rounded-md`). Zero unnecessary shadows or playful gradients.

---

## Direction & Feel

**Who:** Teachers and school coordinators managing classroom resources, loans, and meetings. They need a tool that feels like a professional, robust workspace.

**What they must do:** Manage data, see status at a glance, perform quick actions, and filter information. The interface must support dense information architecture seamlessly.

**How it should feel:** Like Jira or Confluence. Utilitarian, crisp, structured, and reliable. The interface is a container for work, not the main attraction.

**Signature:** Boxy structures, subtle borders serving as boundaries, clear typography, and action-oriented layouts.

---

## Token Architecture

All colors must trace back to these tokens. **No hardcoded Tailwind scale values** (`slate-*`, `red-*`, `bg-white`, etc.).

### Surface Tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg-background` | white | near-black | Canvas / page root, primary cards |
| `bg-card` | white | dark-raised | Interactive cards, panels, modals |
| `bg-muted` | very light gray | dark muted | Secondary backgrounds (like `bg-muted/20`), table headers, empty states |
| `bg-sidebar` | light gray (zinc-50) | very dark | Sidebar surface, structured menus |

### Text Tokens

| Token | Role |
|---|---|
| `text-foreground` | Primary — names, titles, data, primary buttons |
| `text-muted-foreground` | Secondary — metadata, dates, labels, icons, breadcrumbs |
| `text-muted-foreground/80` | Tertiary — icon fills in less critical spots |

### Border Tokens

| Token | Usage |
|---|---|
| `border-border` | Default structural borders (cards, tables, inputs, dividers) |
| `border-border/50` | Softer separation inside dense components |
| `border-primary` | Hover state on inputs, active states, focus rings |

### Semantic Tokens (Status)

| Token | Usage |
|---|---|
| `text-destructive` / `bg-destructive/10` | Overdue loans, errors, critical alerts |
| `text-success` / `bg-success/10` | Completed, attended, resolved states |
| `text-warning` / `bg-warning/10` | Pending actions, warnings, drafts |
| `text-info` / `bg-blue-500/10` | Informational badges, neutral status |

---

## Depth Strategy: **Flat & Bordered**

No drop shadows on standard elements. Use borders to separate content. Modals and floating elements use a combination of subtle border and strong backdrop blur (`backdrop-blur`) instead of heavy box-shadows.

```css
/* Correct Card */
border border-border rounded-md bg-card

/* Interactive Element Hover */
hover:bg-muted/50 transition-colors

/* Inputs */
border border-input rounded-md focus:border-primary focus:ring-1 focus:ring-primary
```

---

## Typography

**Font:** `Inter` (defined in `globals.css` as `--font-sans`)

| Element | Classes |
|---|---|
| Page title | `text-2xl font-semibold text-foreground tracking-tight` |
| Section heading | `text-lg font-semibold text-foreground` |
| Card title | `text-sm font-semibold text-foreground` |
| Standard text/data | `text-sm text-foreground` |
| Metadata | `text-sm text-muted-foreground` |
| Small / Label | `text-xs font-semibold text-muted-foreground uppercase tracking-wider` |

---

## Spacing

Jira-style interfaces rely on slightly tighter padding inside components to allow for more data, but clear separation between distinct sections.

**Base unit:** `4` (Tailwind default)

| Context | Value |
|---|---|
| Page padding | `p-6` or `p-8` |
| Card padding | `p-4` or `p-5` |
| Section gap | `space-y-4` |
| Gap between tight elements | `gap-2` |
| Table cell padding | `px-4 py-2` |

---

## Border Radius Scale

Jira uses smaller, tighter radiuses to feel more like a structured software tool and less like a consumer app.

```
--radius: 0.375rem (6px base)
```

| Element | Class |
|---|---|
| Buttons, Inputs, Dropdowns | `rounded-md` |
| Cards / list items | `rounded-lg` |
| Badges / pills | `rounded-md` (not pill!) |
| Modals / dialogs | `rounded-xl` |

---

## Component Patterns

### Buttons

**Fuente única de verdad:** `@/components/atoms/button`  

```tsx
import { Button } from '@/components/atoms/button';

// Primary action (Jira Blue style)
<Button>Create Issue</Button>

// Secondary / default (Subtle gray background or outline)
<Button variant="secondary">Cancel</Button>

// Ghost (For toolbars)
<Button variant="ghost" size="icon"><MoreHorizontal /></Button>
```

**Reglas Jira para botones:**
- `rounded-md` — Estructura cuadrada, no pastillas.
- `font-medium` — Texto claro y legible, sin exceso de negrita.
- Sin sombras interactivas.

### Cards & Panels

```tsx
<div className="bg-card border border-border rounded-lg p-5">
  <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
    <h3 className="text-sm font-semibold text-foreground">Detalles del Préstamo</h3>
    <Button variant="ghost" size="sm">Editar</Button>
  </div>
  {/* Content */}
</div>
```

### Tablas / Data Lists (Prioridad Jira)

Las listas deben ser el elemento central de navegación de datos, favoreciendo filas densas con estados claros sobre tarjetas dispersas.

```tsx
<div className="w-full border border-border rounded-lg overflow-hidden">
  <table className="w-full text-sm text-left">
    <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase">
      <tr>
        <th className="px-4 py-3 font-semibold">Elemento</th>
        <th className="px-4 py-3 font-semibold">Estado</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border bg-card">
      <tr className="hover:bg-muted/20 transition-colors cursor-pointer">
        <td className="px-4 py-3 font-medium text-foreground">Proyector Epson</td>
        <td className="px-4 py-3">
          <span className="bg-warning/10 text-warning px-2 py-1 rounded-md text-xs font-semibold">En uso</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Status Badges (Jira Style)

Jira prefiere badges rectangulares (`rounded-md` o `rounded-sm`) con colores sólidos suaves y texto vibrante, o simplemente texto con un ícono, en lugar de píldoras redondas gigantes.

```tsx
<span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-success/10 text-success uppercase tracking-wider">
  DONE
</span>
```

---

## Interaction States

| State | Pattern |
|---|---|
| Hover actions | `hover:bg-muted/50 transition-colors duration-150` |
| Focus | `focus:outline-none focus:ring-2 focus:ring-primary/50` |
| Modals | Utilizan un `backdrop-blur-sm bg-background/50` de fondo para separar del contenido, sin `shadow-2xl`. |

---
