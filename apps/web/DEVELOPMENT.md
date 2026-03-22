# Flip v2 - Development Rules

## Design System

### Shadows
- **Avoid excessive shadows** - Use shadows sparingly
- Prefer subtle borders (`border-border`) over shadows
- Only use shadows for elevated elements like modals or dropdowns

### Border Radius
- `rounded-lg` for inputs and cards
- `rounded-full` for buttons and badges
- `rounded-xl` for logo and containers

### Colors
- Use semantic color tokens: `bg-background`, `text-foreground`, `bg-primary`, etc.
- Never use hardcoded colors directly (e.g., `#ffffff`)
- Primary color: Blue

### Dark Mode
- All components must work in both light and dark modes
- Use `bg-background` and `text-foreground` for theme-aware colors
- Dark mode is controlled via `.dark` class on `<html>`
- Default theme: **light**

### Typography
- Font family: Inter
- Use Tailwind utilities: `text-sm`, `text-lg`, `font-medium`, etc.

---

## Code Conventions

### Components
- Use TypeScript for all components
- Prefer functional components with hooks
- Keep components small and focused

### File Structure
```
src/
├── app/           # Next.js routes
├── components/    # Reusable UI components
├── lib/           # Utilities and helpers
└── hooks/         # Custom React hooks
```

### Naming
- Components: PascalCase (`ThemeToggle.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: SCREAMING_SNAKE_CASE
