# CONTEXT TRANSFER SUMMARY - Diagnóstico de Habilidades Digitales

---

## TASK 1: Actualización de Preguntas Base a Versión 2025
- **STATUS**: ✅ done
- **USER QUERIES**: 4 ("actualiza las preguntas base de la evaluacion")
- **DETAILS**: 
  - Script `update-diagnostic-questions-2025.ts` creado y ejecutado exitosamente
  - Eliminadas 5 categorías antiguas y 23 preguntas antiguas
  - Insertadas 5 nuevas dimensiones y 17 nuevas preguntas en primera persona
  - Distribución: Manejo Info (4), Comunicación (4), Creación (3), IA (4), Resolución (2)
  - Commit: `d1cc3d7`
- **FILEPATHS**: 
  - `apps/web/scripts/update-diagnostic-questions-2025.ts`
  - `apps/web/scripts/seed-diagnostic-questions.ts`

---

## TASK 2: Mejoras de UX - Navegación y Agrupación por Categoría
- **STATUS**: ✅ done
- **USER QUERIES**: 1 ("hay un problema de usabilidad, agrega botones a los lados de siguiente y anterior")
- **DETAILS**:
  - Agregados botones "Anterior" y "Siguiente" a los lados de la tarjeta de pregunta
  - Preguntas agrupadas por categoría en el backend (ordenamiento por category.order, luego question.order)
  - Badge de categoría visible en cada pregunta
  - Nombre de categoría en el header
  - Commit: `f565437`, `3948ce6`
- **FILEPATHS**:
  - `apps/web/src/features/diagnostic/components/quiz-card.tsx`
  - `apps/web/src/app/(public)/ie/[slug]/diagnostic/page.tsx`
  - `apps/web/src/app/api/diagnostic/[slug]/route.ts`

---

## TASK 3: Eliminación de Avance Automático y Botón Finalizar
- **STATUS**: ✅ done
- **USER QUERIES**: 2 ("quita ese time, la decisión que sea unicamente del usuario, y tambien agregar un boton de finalizar")
- **DETAILS**:
  - Eliminados `setTimeout` en `handleAnswer` (antes 300ms auto-avance)
  - Usuario controla navegación manualmente con botones
  - Botón "Finalizar Diagnóstico" agregado en última pregunta
  - Validación: botón deshabilitado si faltan respuestas
  - Estado de carga mientras procesa
  - Commit: incluido en commits posteriores
- **FILEPATHS**:
  - `apps/web/src/app/(public)/ie/[slug]/diagnostic/page.tsx`
  - `apps/web/src/features/diagnostic/components/quiz-card.tsx`

---

## TASK 4: Sistema de Colores por Categoría y Logo de IE
- **STATUS**: ✅ done
- **USER QUERIES**: 3 ("Los botones siguiente y anterior son muy sutiles. Al inicio del cuestionario reemplaza el logo por el logo de la IE")
- **DETAILS**:
  - Creado sistema de colores: 5 esquemas (azul, verde, morado, naranja, rosa)
  - Archivo `category-colors.ts` con mapeo categoryId → colores
  - Botones de navegación: `h-16 w-16`, iconos `w-8 h-8`, color sólido según categoría
  - Fondo dinámico con gradiente que cambia por categoría
  - Logo de IE agregado a landing page (campo correcto: `settings.logoUrl`)
  - Número de preguntas dinámico (17 en lugar de hardcoded 23)
  - Commits: `2c390ef`, `601d03d`
- **FILEPATHS**:
  - `apps/web/src/features/diagnostic/lib/category-colors.ts`
  - `apps/web/src/features/diagnostic/components/quiz-card.tsx`
  - `apps/web/src/features/diagnostic/components/diagnostic-landing.tsx`
  - `apps/web/src/app/api/diagnostic/[slug]/route.ts`
  - `apps/web/src/features/diagnostic/types/index.ts`

---

## TASK 5: Funcionalidad de Rechazar Docentes
- **STATUS**: ✅ done
- **USER QUERIES**: 5 ("no existe la opción de rechazar")
- **DETAILS**:
  - Endpoint API creado: `POST /api/institutions/[id]/diagnostic/reject/[sessionId]`
  - Tipo `SessionStatus` actualizado: agregado 'rejected'
  - UI: botón "Rechazar" (rojo) y "Aprobar" (azul) en panel de pendientes
  - Ambos botones se deshabilitan mutuamente durante acción
  - Commit: `27c0a17`
- **FILEPATHS**:
  - `apps/web/src/app/api/institutions/[id]/diagnostic/reject/[sessionId]/route.ts`
  - `apps/web/src/features/diagnostic/components/admin/pending-tab.tsx`
  - `apps/web/src/features/diagnostic/types/index.ts`

---

## TASK 6: Fix Logo de IE No Aparece
- **STATUS**: ✅ done
- **USER QUERIES**: 6 ("revisa, el logo de la IE no esta, analiza a fondo")
- **DETAILS**:
  - Problema: campo incorrecto `settings.logo` → correcto `settings.logoUrl`
  - Solución: cambio a `(institution.settings as any)?.logoUrl`
  - Número de preguntas hardcoded → dinámico desde API
  - Commit: `601d03d`
- **FILEPATHS**:
  - `apps/web/src/app/api/diagnostic/[slug]/route.ts`
  - `apps/web/src/features/diagnostic/components/diagnostic-landing.tsx`

---

## TASK 7: Fix Error al Completar Diagnóstico (Primera Vez Falla)
- **STATUS**: ✅ done
- **USER QUERIES**: 7 ("es raro el comportamiento en el primer intento da error y en el segundo intento reciendo guarda los resultados")
- **DETAILS**:
  - **Problema identificado**: `BrandColorProvider` en root layout llama a `useMyInstitution()` en TODAS las páginas (incluyendo rutas públicas)
  - Esto causa múltiples requests 401 a `/api/institutions/my-institution` en rutas sin autenticación
  - PWA con `NetworkFirst` intenta cachear y reintentar, interfiriendo con `/complete`
  - **Solución implementada**:
    1. Modificado `BrandColorProvider` para solo llamar `useMyInstitution()` si hay sesión activa
    2. Modificado hook `useMyInstitution` para aceptar opción `enabled`
    3. Mejorada configuración PWA para no cachear endpoints autenticados (`NetworkOnly` para `/api/institutions/my-institution`, etc.)
    4. Agregado `CacheFirst` para assets estáticos (30 días)
    5. Agregado `NetworkFirst` para API de diagnóstico (5 minutos cache)
  - **Commit**: `bf2c7db` - fix(diagnostic): prevent 401 errors on public routes and improve PWA caching
- **FILEPATHS**:
  - `apps/web/src/components/brand-color-provider.tsx`
  - `apps/web/src/features/institutions/hooks/use-my-institution.ts`
  - `apps/web/next.config.ts`

---

## USER CORRECTIONS AND INSTRUCTIONS

- Probar en local ANTES de hacer commits para evitar errores de build
- No usar sombras como solución visual (preferir colores sólidos)
- Opción A para botones: fondo de color sólido con flecha blanca
- Las preguntas deben estar agrupadas por categoría/dimensión
- Navegación debe ser completamente manual (sin auto-avance)
- Análisis a fondo antes de escribir código cuando se solicita

---

## METADATA

- **Rama actual**: `master`
- **Último commit**: `bf2c7db` - fix(diagnostic): prevent 401 errors on public routes and improve PWA caching
- **Build status**: ✅ Passing
- **Base de datos**: Neon PostgreSQL (producción)

---

## NEXT STEPS

1. ✅ Probar en producción que el diagnóstico se complete correctamente en el primer intento
2. ✅ Verificar que no haya más errores 401 en consola
3. ✅ Confirmar que el PWA no interfiere con requests autenticados
4. Monitorear comportamiento en producción
5. Considerar agregar notificación en dashboard para docentes con diagnóstico pendiente (FASE 5 del plan)

---

## ARCHIVOS CLAVE DEL MÓDULO

### Sistema de Colores
- `apps/web/src/features/diagnostic/lib/category-colors.ts` - Sistema de colores por categoría

### Componentes UI Públicos
- `apps/web/src/features/diagnostic/components/diagnostic-landing.tsx` - Landing page
- `apps/web/src/features/diagnostic/components/identification-form.tsx` - Formulario de identificación
- `apps/web/src/features/diagnostic/components/quiz-card.tsx` - Componente principal del quiz
- `apps/web/src/features/diagnostic/components/results-screen.tsx` - Pantalla de resultados

### Componentes UI Admin
- `apps/web/src/features/diagnostic/components/admin/config-tab.tsx` - Configuración
- `apps/web/src/features/diagnostic/components/admin/questions-tab.tsx` - Gestión de preguntas
- `apps/web/src/features/diagnostic/components/admin/pending-tab.tsx` - Docentes pendientes
- `apps/web/src/features/diagnostic/components/admin/results-tab.tsx` - Resultados

### API Endpoints
- `apps/web/src/app/api/diagnostic/[slug]/route.ts` - Config y preguntas
- `apps/web/src/app/api/diagnostic/[slug]/complete/route.ts` - Finalizar diagnóstico
- `apps/web/src/app/api/institutions/[id]/diagnostic/reject/[sessionId]/route.ts` - Rechazar docente

### Scripts
- `apps/web/scripts/update-diagnostic-questions-2025.ts` - Actualización de preguntas 2025
- `apps/web/scripts/seed-diagnostic-questions.ts` - Seed inicial

### Tipos
- `apps/web/src/features/diagnostic/types/index.ts` - Tipos TypeScript del módulo
