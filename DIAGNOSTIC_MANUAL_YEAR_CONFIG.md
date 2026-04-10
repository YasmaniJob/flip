# Configuración Manual del Año del Diagnóstico

## Resumen

Se ha implementado la funcionalidad para configurar manualmente el año del período de diagnóstico desde el panel de administración. Esto permite a las instituciones tener total libertad para asignar el tiempo de prueba sin depender exclusivamente del año actual del sistema.

## Cambios Realizados

### 1. Base de Datos

**Archivo:** `apps/web/src/lib/db/schema.ts`
- Agregado campo `diagnosticActiveYear` a la tabla `institutions`
- Tipo: `integer`, nullable (NULL = usar año automático)
- Permite configurar manualmente el año del diagnóstico

**Migración:** `apps/web/drizzle/20260410000000_add_diagnostic_active_year.sql`
- Agrega la columna `diagnostic_active_year` a la tabla `institutions`
- Incluye constraint de validación (2025-2100)
- Documentación del propósito de la columna

### 2. Servicio de Año

**Archivo:** `apps/web/src/features/diagnostic/services/year-service.ts`
- Nueva función: `getActiveDiagnosticYear(institutionActiveYear)`
- Retorna el año configurado manualmente si existe
- Retorna el año actual si no hay configuración manual
- Mantiene compatibilidad con `getCurrentYear()` existente

### 3. API de Configuración

**Archivo:** `apps/web/src/app/api/institutions/[id]/diagnostic/config/route.ts`
- GET: Retorna el año activo configurado
- PATCH: Permite actualizar el año activo
- Validación de valores entre 2025-2100

**Archivo:** `apps/web/src/features/diagnostic/lib/validation.ts`
- Actualizado `updateConfigRequestSchema` para incluir `diagnosticActiveYear`
- Validación: número entero, min 2025, max 2100, nullable

### 4. Interfaz de Usuario

**Archivo:** `apps/web/src/features/diagnostic/components/admin/config-tab.tsx`
- Nueva sección: "Período de Evaluación"
- Campo numérico para configurar el año
- Botón para volver al modo automático
- Indicador visual del año efectivo (manual o automático)
- Placeholder muestra el año actual cuando está en modo automático

### 5. Lógica de Sesiones

**Archivo:** `apps/web/src/features/diagnostic/lib/session-manager.ts`
- Actualizado `CreateSessionData` para recibir `activeYear`
- Las sesiones se crean con el año activo de la institución

**Archivo:** `apps/web/src/app/api/diagnostic/[slug]/identify/route.ts`
- Usa `getActiveDiagnosticYear()` en lugar de `getCurrentYear()`
- Pasa el año activo al crear sesiones

**Archivo:** `apps/web/src/app/api/diagnostic/[slug]/complete/route.ts`
- Usa `getActiveDiagnosticYear()` para validaciones

### 6. Documentación

**Archivo:** `.kiro/specs/diagnostic-annual-periods/requirements.md`
- Agregado Requisito 1.1: Configuración Manual del Año
- Criterios de aceptación detallados

## Cómo Funciona

### Modo Automático (Por Defecto)
```typescript
// Si diagnosticActiveYear es NULL
institution.diagnosticActiveYear = null
// El sistema usa el año actual
activeYear = new Date().getFullYear() // 2026
```

### Modo Manual
```typescript
// Si el admin configura un año específico
institution.diagnosticActiveYear = 2025
// El sistema usa ese año
activeYear = 2025
```

## Casos de Uso

### 1. Extender Período de Prueba
Un administrador puede configurar el año 2025 en abril de 2026 para permitir que docentes que no completaron el diagnóstico en 2025 puedan hacerlo ahora.

```
Configuración: diagnosticActiveYear = 2025
Resultado: Nuevas sesiones se crean con year = 2025
```

### 2. Preparar Diagnóstico del Próximo Año
Un administrador puede configurar el año 2027 en diciembre de 2026 para comenzar a recibir diagnósticos del próximo período.

```
Configuración: diagnosticActiveYear = 2027
Resultado: Nuevas sesiones se crean con year = 2027
```

### 3. Volver al Modo Automático
El administrador puede limpiar la configuración manual para que el sistema vuelva a usar el año actual automáticamente.

```
Configuración: diagnosticActiveYear = null
Resultado: El sistema usa el año actual (2026)
```

## Interfaz de Usuario

La nueva sección en el panel de configuración incluye:

1. **Campo de Año**: Input numérico con validación
2. **Placeholder**: Muestra "Automático (2026)" cuando está vacío
3. **Botón "Usar Automático"**: Aparece solo cuando hay un año manual configurado
4. **Indicador de Año Efectivo**: Muestra el año que se está usando actualmente
5. **Validación**: Min 2025, Max año actual + 2

## Validaciones

- El año debe ser un número entero
- Rango válido: 2025 - 2100
- Puede ser NULL (modo automático)
- Se valida tanto en frontend como en backend
- Constraint de base de datos garantiza integridad

## Migración

Para aplicar los cambios en la base de datos:

```bash
# Ejecutar la migración
npm run db:push
# o
npm run db:migrate
```

La migración es segura y no afecta datos existentes:
- Agrega la columna como nullable
- Todas las instituciones existentes quedan en modo automático (NULL)
- No requiere downtime

## Compatibilidad

- ✅ Totalmente compatible con código existente
- ✅ No rompe funcionalidad actual
- ✅ Instituciones existentes siguen usando año automático
- ✅ Puede activarse/desactivarse por institución
- ✅ No requiere cambios en el frontend público del diagnóstico

## Próximos Pasos

1. Ejecutar la migración de base de datos
2. Probar la configuración en el panel de admin
3. Verificar que las sesiones se crean con el año correcto
4. Documentar el uso para los administradores

## Notas Técnicas

- La función `getActiveDiagnosticYear()` es el punto central de la lógica
- Todos los endpoints que crean sesiones usan esta función
- El año se valida en múltiples capas (UI, API, DB)
- La migración incluye comentarios SQL para documentación
