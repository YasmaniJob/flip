# Diseño: Branding de IE en Sidebar

**Fecha:** 2026-03-20
**Estado:** Aprobado

---

## Objetivo

Permitir que cada Institución Educativa (IE) pueda personalizar la app con su branding, manteniendo la identidad de Flip como la marca principal de la plataforma. Es un white-labeling parcial.

---

## Estructura del Sidebar

```
┌─────────────────────────┐
│  🏫 Logo (o ícono)      │
│  Nombre de la IE        │
│  Nivel                  │
├─────────────────────────┤
│                         │
│  📊 Dashboard           │
│  📚 Aula                │
│  👥 Estudiantes        │
│  ...                    │
│                         │
├─────────────────────────┤
│  ⚙️ Configuración      │
├─────────────────────────┤
│  🔵 Flip (logo + nombre)│  ← Footer
└─────────────────────────┘
```

### Capas de Branding

1. **Header IE (arriba):** Logo + Nombre + Nivel
2. **Navegación:** Elementos core de Flip
3. **Footer Flip (abajo):** Logo + nombre de Flip

---

## Comportamiento del Logo de IE

- **Con logo:** `<img>` con URL proporcionada por la IE
- **Sin logo:** Muestra ícono de edificio + nombre de la IE en texto

---

## Modelo de Datos

### institutions.settings (JSONB)

```json
{
  "brandColor": "#ff0000",
  "logoUrl": "https://storage.ie.edu/logo.png",
  "name": "IE San Juan" // Ya existe en la tabla
}
```

---

## Endpoints

### Backend

- `PATCH /api/v1/institutions/my-institution/brand`
  - Body: `{ logoUrl?: string }`
  - Actualiza `institutions.settings.logoUrl`

### Frontend

- Nuevo componente: `InstitutionHeader`
- Ubicación: Sidebar, arriba del todo
- Usa datos de `/api/v1/institutions/my-institution`

---

## Componentes

### 1. InstitutionHeader (nuevo)

**Ubicación:** Sidebar superior

**Estados:**

- `loading`: Skeleton placeholder
- `with-logo`: Muestra imagen del logo
- `without-logo`: Muestra ícono + texto

**Props:**

- `name: string`
- `nivel: string`
- `logoUrl?: string`
- `brandColor: string`

---

## Tareas de Implementación

1. **Backend:** Extender endpoint `PATCH /api/v1/institutions/my-institution/brand` para aceptar `logoUrl`
2. **Frontend:** Crear componente `InstitutionHeader`
3. **Frontend:** Integrar `InstitutionHeader` en el sidebar
4. **Frontend:** Mover branding de Flip al footer del sidebar
5. **Settings:** Agregar campo de logo URL en la UI de preferencias
