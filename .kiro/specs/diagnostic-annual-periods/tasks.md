# Plan de Implementación: Sistema de Periodización Anual para Diagnóstico de Habilidades Digitales

## Resumen

Este plan implementa la periodización anual del módulo de diagnóstico, permitiendo que los docentes completen el diagnóstico una vez por año calendario con detección automática del año actual, validación de unicidad, histórico multi-año y visualizaciones comparativas.

## Tareas

- [x] 1. Fase 1: Migración de Base de Datos
  - [x] 1.1 Crear migración SQL para agregar campo year
    - Crear archivo de migración `apps/web/drizzle/YYYYMMDDHHMMSS_add_year_to_diagnostic_sessions.sql`
    - Agregar columna `year INTEGER` (permitir NULL temporalmente)
    - Actualizar sesiones existentes con `year = 2025`
    - Hacer columna NOT NULL con `ALTER COLUMN year SET NOT NULL`
    - Agregar check constraint `CHECK (year >= 2025 AND year <= 2100)`
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 12.5_

  - [x] 1.2 Crear índices de base de datos
    - Crear índice `idx_diagnostic_session_year` en columna `year`
    - Crear índice compuesto `idx_diagnostic_session_institution_year` en `(institution_id, year)`
    - Crear índice compuesto `idx_diagnostic_session_staff_year` en `(staff_id, year)` con condición `WHERE staff_id IS NOT NULL`
    - _Requisitos: 3.5, 3.6, 16.3, 16.4, 16.5_

  - [x] 1.3 Crear constraints de unicidad
    - Crear constraint único `unique_institution_staff_year` en `(institution_id, staff_id, year)`
    - Crear constraint único `unique_institution_user_year` en `(institution_id, user_id, year)`
    - _Requisitos: 2.3, 3.7, 3.8, 18.1_

  - [x] 1.4 Actualizar schema de Drizzle
    - Modificar `apps/web/src/lib/db/schema.ts` en tabla `diagnosticSessions`
    - Agregar campo `year: integer('year').notNull()`
    - Agregar índices en la configuración de tabla
    - Agregar constraints únicos en la configuración de tabla
    - _Requisitos: 3.1, 3.2, 3.3_

  - [x] 1.5 Ejecutar y verificar migración
    - Ejecutar `npm run db:generate` para generar migración
    - Ejecutar `npm run db:migrate` en desarrollo
    - Verificar que todas las sesiones tienen `year` no nulo
    - Verificar que los índices se crearon correctamente
    - Verificar que los constraints se crearon correctamente
    - _Requisitos: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

- [x] 2. Checkpoint - Verificar migración exitosa
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Fase 2: Servicios Core
  - [x] 3.1 Implementar YearService
    - Crear archivo `apps/web/src/features/diagnostic/services/year-service.ts`
    - Implementar función `getCurrentYear(): number` que retorna `new Date().getFullYear()`
    - Implementar función `isValidYear(year: number): boolean` que valida rango [2025, currentYear + 1]
    - Implementar función `getAvailableYears(sessions: DiagnosticSession[]): number[]` que extrae años únicos ordenados DESC
    - Agregar cache opcional del año actual con invalidación diaria
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 12.1, 12.2, 12.3_

  - [ ]* 3.2 Escribir tests unitarios para YearService
    - Test: `getCurrentYear` retorna año actual
    - Test: `isValidYear` acepta años >= 2025
    - Test: `isValidYear` rechaza años < 2025
    - Test: `isValidYear` rechaza años > currentYear + 1
    - Test: `getAvailableYears` extrae años únicos ordenados DESC
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 12.1, 12.2, 12.3_

  - [x] 3.3 Implementar ValidationService
    - Crear archivo `apps/web/src/features/diagnostic/services/validation-service.ts`
    - Implementar función `checkExistingSession(institutionId, staffId, userId, year)` que busca sesión existente
    - Implementar función `validateUniqueSession(institutionId, staffId, userId, year)` que valida unicidad
    - Retornar objeto `ValidationResult` con `valid: boolean`, `reason?: string`, `existingYear?: number`
    - Manejar casos de staffId vs userId (docentes registrados vs temporales)
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 4.2, 4.3_

  - [ ]* 3.4 Escribir tests unitarios para ValidationService
    - Test: `validateUniqueSession` retorna `valid: true` si no hay sesión
    - Test: `validateUniqueSession` retorna `valid: false` si existe sesión del mismo año
    - Test: `validateUniqueSession` permite sesión en año diferente
    - Test: `checkExistingSession` retorna sesión si existe
    - Test: `checkExistingSession` retorna null si no existe
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 4.2, 4.3_

- [x] 4. Fase 3: API Endpoints
  - [x] 4.1 Actualizar endpoint de identificación
    - Modificar `apps/web/src/app/api/diagnostic/[slug]/identify/route.ts`
    - Obtener año actual usando `getCurrentYear()`
    - Verificar sesión existente usando `checkExistingSession()`
    - Retornar `canComplete: false` si ya existe sesión del año actual
    - Retornar `canComplete: true` con año actual si no existe sesión
    - Incluir datos de sesión existente en respuesta si aplica
    - _Requisitos: 1.1, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 4.2 Actualizar endpoint de completar diagnóstico
    - Modificar `apps/web/src/app/api/diagnostic/[slug]/complete/route.ts`
    - Obtener año actual usando `getCurrentYear()`
    - Validar unicidad usando `validateUniqueSession()` antes de guardar
    - Asignar `year` al crear la sesión en base de datos
    - Manejar error de constraint único (código 23505) y retornar HTTP 409
    - Retornar sessionId, year y results en respuesta exitosa
    - _Requisitos: 2.3, 2.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 18.2, 18.3, 18.4, 18.5_

  - [x] 4.3 Crear endpoint de histórico multi-año
    - Crear archivo `apps/web/src/app/api/diagnostic/[slug]/history/route.ts`
    - Implementar GET handler que recibe `staffId` o `userId` como query param
    - Obtener todas las sesiones del docente ordenadas por `year DESC`
    - Calcular métricas de evolución si hay 2+ sesiones
    - Retornar array de sesiones con resultados por dimensión
    - Retornar objeto `evolution` con mejoras/retrocesos por dimensión
    - Implementar autorización: docente solo ve su histórico, admin ve todos de su institución
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ]* 4.4 Escribir tests de integración para endpoints
    - Test: POST `/identify` permite completar si no hay sesión del año actual
    - Test: POST `/identify` bloquea si ya completó el año actual
    - Test: POST `/complete` crea sesión con año actual
    - Test: POST `/complete` rechaza sesión duplicada con HTTP 409
    - Test: GET `/history` retorna histórico ordenado por año DESC
    - Test: GET `/history` calcula evolución con múltiples años
    - Test: GET `/history` retorna `evolution: null` con 0-1 sesiones
    - _Requisitos: 2.1, 2.2, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4_

- [x] 5. Checkpoint - Verificar API funcional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Fase 4: UI - Quiz Público
  - [x] 6.1 Actualizar pantalla de identificación
    - Modificar `apps/web/src/features/diagnostic/components/identification-form.tsx`
    - Mostrar año actual en el título: "Diagnóstico de Habilidades Digitales {year}"
    - Al recibir respuesta de API, verificar campo `canComplete`
    - Si `canComplete === false`, mostrar mensaje "Ya completaste el diagnóstico de {year}"
    - Deshabilitar formulario si ya completó el año actual
    - Mostrar botón para ver resultados de sesión existente
    - _Requisitos: 1.1, 1.2, 1.3, 4.3, 4.4, 4.5, 11.4, 11.5, NF-7.1, NF-7.2_

  - [x] 6.2 Actualizar pantalla de resultados
    - Modificar `apps/web/src/features/diagnostic/components/results-screen.tsx`
    - Mostrar año del diagnóstico en el encabezado
    - Incluir año en el contexto de los resultados mostrados
    - _Requisitos: 1.1, 1.3_

- [ ] 7. Fase 5: UI - Dashboard Docente
  - [ ] 7.1 Crear componente de histórico multi-año
    - Crear archivo `apps/web/src/features/diagnostic/components/teacher/history-view.tsx`
    - Implementar selector de año (dropdown con años disponibles)
    - Mostrar lista de sesiones con año, fecha y puntaje general
    - Implementar hook `useHistory` para obtener datos del endpoint `/history`
    - _Requisitos: 6.1, 6.2, 7.1, 7.2, 7.5_

  - [ ] 7.2 Crear gráfico de radar comparativo multi-año
    - Modificar `apps/web/src/features/diagnostic/components/radar-chart-svg.tsx` para soportar múltiples series
    - Superponer datos de 2+ años en el mismo gráfico
    - Usar colores diferentes para cada año
    - Agregar leyenda con años
    - _Requisitos: 7.2, 7.3_

  - [ ] 7.3 Crear tabla de evolución por dimensión
    - Crear componente `EvolutionTable` que muestra diferencias por dimensión
    - Mostrar indicadores visuales de mejora (↑ verde) o retroceso (↓ rojo)
    - Calcular y mostrar porcentaje de cambio
    - Mostrar puntaje general de evolución
    - _Requisitos: 6.4, 6.5, 7.3, 7.4, 7.6_

- [ ] 8. Fase 6: UI - Panel Admin
  - [ ] 8.1 Agregar selector de año en panel admin
    - Modificar `apps/web/src/features/diagnostic/components/admin/results-tab.tsx`
    - Agregar dropdown de selección de año en la parte superior
    - Listar todos los años con sesiones completadas en la institución
    - Implementar estado para año seleccionado
    - _Requisitos: 8.1, 8.2, 8.3_

  - [ ] 8.2 Filtrar resultados por año seleccionado
    - Modificar queries para filtrar por año seleccionado
    - Actualizar visualizaciones con datos del año filtrado
    - Mostrar mensaje "No hay datos para este año" si no hay sesiones
    - _Requisitos: 8.3, 8.4, 8.6_

  - [ ] 8.3 Calcular métricas institucionales por año
    - Implementar función para calcular total de sesiones del año
    - Calcular puntaje promedio general del año
    - Calcular promedios por dimensión del año
    - Mostrar métricas en cards o tabla
    - _Requisitos: 8.4, 8.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 9. Fase 7: Generación de PDF
  - [x] 9.1 Actualizar componente de PDF con año
    - Modificar `apps/web/src/features/diagnostic/components/diagnostic-pdf-document.tsx`
    - Agregar prop `year: number`
    - Mostrar año en el encabezado del PDF
    - Incluir año junto a la fecha de completado
    - _Requisitos: 9.1, 9.3_

  - [x] 9.2 Actualizar nombre de archivo PDF
    - Modificar lógica de generación de PDF
    - Cambiar formato de nombre a `diagnostico-{nombre}-{year}.pdf`
    - _Requisitos: 9.2_

- [x] 10. Checkpoint - Verificar funcionalidad completa
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Fase 8: Testing y Validación
  - [ ]* 11.1 Escribir property-based tests
    - **Propiedad 1: Unicidad de sesión por año**
    - **Valida: Requisitos 2.1, 2.2, 2.3**
    - Usar fast-check para generar institutionId, staffId, year aleatorios
    - Verificar que no se pueden crear dos sesiones del mismo año para el mismo docente
    - Primera sesión debe crearse exitosamente, segunda debe fallar

  - [ ]* 11.2 Escribir property-based tests de puntajes
    - **Propiedad 2: Puntajes siempre válidos**
    - **Valida: Requisitos 20.4, 20.5, 20.6, 20.7**
    - Generar respuestas aleatorias con fast-check
    - Verificar que todos los puntajes calculados están entre 0 y 100
    - Verificar las 5 dimensiones y el puntaje general

  - [ ]* 11.3 Escribir property-based tests de histórico
    - **Propiedad 3: Histórico siempre ordenado**
    - **Valida: Requisitos 6.7**
    - Generar años aleatorios y crear sesiones en orden aleatorio
    - Verificar que `getSessionsByStaff` retorna sesiones ordenadas por año DESC

  - [ ]* 11.4 Escribir tests de UI para identificación
    - Test: Muestra año actual en el título
    - Test: Deshabilita formulario si ya completó este año
    - Test: Muestra mensaje "Ya completaste el diagnóstico de {year}"
    - Test: Permite completar si no hay sesión del año actual

  - [ ]* 11.5 Escribir tests de manejo de errores
    - Test: Error 409 cuando se intenta crear sesión duplicada
    - Test: Error 400 cuando el año es inválido
    - Test: Error 404 cuando no se encuentra docente
    - Test: Error 500 cuando falla transacción
    - Test: Rollback automático en caso de error

  - [ ]* 11.6 Escribir tests de autorización
    - Test: Docente solo puede ver su propio histórico
    - Test: Admin puede ver histórico de todos los docentes de su institución
    - Test: Error 403 cuando usuario no autorizado intenta acceder
    - Test: Validación de permisos antes de ejecutar queries

  - [ ]* 11.7 Escribir tests de performance
    - Test: Query de validación de sesión existente < 100ms (p95)
    - Test: Query de histórico < 200ms (p95)
    - Test: Uso correcto de índices en queries
    - Test: Métricas institucionales usan índices compuestos

- [ ] 12. Checkpoint final - Validación completa
  - Ensure all tests pass, ask the user if questions arise.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos que implementa para trazabilidad
- Los checkpoints permiten validación incremental y detección temprana de problemas
- La implementación usa TypeScript con el stack existente (Next.js, Drizzle ORM, PostgreSQL)
- Los property-based tests usan fast-check para validar propiedades universales
- La migración es idempotente y puede ejecutarse múltiples veces sin error
- Los constraints de base de datos garantizan integridad de datos incluso con race conditions
