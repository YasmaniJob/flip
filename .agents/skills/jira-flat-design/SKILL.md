---
name: jira-flat-design
description: Enforces the core "Jira Flat" design system for Flip. This skill dictates how UI components must be styled (no shadows, crisp borders, specific colors) to maintain consistency and avoid rework.
tags: [ui, design, frontend, jira, css, styling, components]
---

# Flip "Jira Flat" Design System

The Flip application STRICTLY follows a "Jira Flat" design aesthetic. This skill must be invoked and its rules applied whenever creating or modifying UI components, layouts, or pages. **DO NOT deviate from these principles.**

## Core Principles

1. **NO SHADOWS**: Absolutely zero drop shadows (`shadow-none`) on any element. This includes cards, modals, buttons, and dropdowns. Do not use `shadow-sm`, `shadow-md`, etc.
2. **CRISP BORDERS**: Depth and separation are achieved EXCLUSIVELY through borders. Use `border border-border`.
3. **SUBTLE BACKGROUNDS**: Use `bg-muted/20`, `bg-muted/30`, or `bg-accent/50` for hover states or grouping elements instead of elevation.
4. **SQUARED OR SLIGHTLY ROUNDED CORNERS**: Prefer `rounded-md` or `rounded-lg`. Avoid excessive rounding (`rounded-2xl` or `rounded-3xl`).

## Layouts and Containers

*   **Full Width Structure**: Context and taxonomies (like Wizards) should use full width for selections, avoiding distracting sidebars until necessary.
*   **Consistency**: Keep sizes between tabs or dialog steps consistent to avoid layout jumps / flickering ("pestañazos").

## Button Variants (Jira Style)

When using the `<Button>` component, always prefer the custom Jira variants defined in the system. Never use default shadcn primary buttons if a Jira variant is appropriate.

*   `variant="jira"`: The primary action button. Deep blue (`#0052cc`), white text, bold font, NO shadow. Hover state slightly darkens the background.
*   `variant="jiraOutline"`: Secondary actions. Transparent background, border matching the primary blue, primary blue text.
*   `variant="ghost"`: Tertiary actions or cancel buttons. No background, no border, text changes color on hover.
*   **Behavior**: Buttons should have an `active:scale-95` micro-interaction for tactile feedback, but NO shadow on hover or active.

## Modals and Dialogs

*   **Borders**: Must have `border border-border`.
*   **Shadows**: Must explicitly define `shadow-none` to override any default backend shadow behaviors (Radix UI adds them by default).
*   **Backdrop**: Use a simple dark overlay (`bg-black/80` or `bg-background/80`).
*   **Sizing**: Modals should adapt to the context (Fullscreen toggles when necessary) or use fixed dimensions (e.g., `sm:max-w-[1024px] h-[85vh]`) to prevent layout shifts between steps in wizard flows.

## Component Specifics

*   **Cards (CategoryCard, ResourceCard)**: Use `border border-border`, `bg-card`, and `shadow-none`. Hover states should change the border color (e.g., `hover:border-primary/50`) or background color, not the shadow.
*   **Inputs and Form Fields**: Standard `border-border`. Focus state should use a crisp ring (`focus-visible:ring-primary`), without adding shadow.
*   **Empty States**: Use dashed borders (`border-dashed border-border`) and muted backgrounds (`bg-muted/20`) to indicate drop zones or empty data containers. Never use blocking popups. Offer alternative actions.

## Anti-Patterns (What to Avoid)

*   ❌ `<div className="shadow-lg rounded-xl">` (Violates no-shadow rule)
*   ❌ `<Button className="bg-blue-600 shadow-md">` (Violates Jira button variant rule)
*   ❌ Elevation-based hierarchy (Relying on z-index and shadows to show importance).
*   ❌ "Soft" UI designs. Everything must be crisp, utilitarian, and data-dense.

## Enforcement Check

Whenever modifying frontend code in `apps/web`:
1. Check existing components for `shadow-*` classes and remove them.
2. Ensure new components implement `border border-border` instead of shadows.
3. Verify button variants (`jira`, `jiraOutline`) are used correctly.
