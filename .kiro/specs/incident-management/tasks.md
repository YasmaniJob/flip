# Implementation Plan: Incident Management Module

## Overview

Este plan implementa el módulo completo de gestión de incidencias para instituciones educativas en la plataforma FLIP. La implementación sigue una arquitectura feature-based con Next.js 15 App Router, React Server Components, TanStack Query, y Drizzle ORM. El plan está organizado en grupos lógicos que permiten desarrollo incremental, comenzando con la fundación (base de datos) y construyendo progresivamente hasta las características avanzadas.

## Tasks

- [ ] 1. Base de datos y migraciones
  - [ ] 1.1 Crear esquema de base de datos para incidencias
    - Crear tabla `incidents` con todos los campos definidos en el diseño
    - Crear tabla `incident_sequences` para IDs secuenciales por institución
    - Agregar índices compuestos para optimización de consultas
    - _Requirements: 1.1, 1.5, 1.6, 14.7_
  
  - [ ] 1.2 Crear esquema para comentarios y adjuntos
    - Crear tabla `incident_comments` con relación a incidents
    - Crear tabla `incident_attachments` para archivos adjuntos
    - Agregar índices en campos de búsqueda frecuente
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_
  
  - [ ] 1.3 Crear esquema para historial y plantillas
    - Crear tabla `incident_change_history` para auditoría
    - Crear tabla `incident_templates` para plantillas reutilizables
    - Agregar índices apropiados
    - _Requirements: 8.1, 8.2, 8.3, 17.1, 17.2_
  
  - [ ] 1.4 Generar y ejecutar migraciones de Drizzle
    - Ejecutar `drizzle-kit generate` para crear archivos de migración
    - Revisar SQL generado para verificar correctitud
    - Ejecutar migraciones en base de datos de desarrollo
    - _Requirements: 1.1, 1.5, 14.7_

- [ ] 2. Tipos TypeScript y validaciones
  - [ ] 2.1 Definir tipos base y enums
    - Crear tipos `IncidentType`, `IncidentPriority`, `IncidentStatus`
    - Definir constante `INCIDENT_STATE_TRANSITIONS` para máquina de estados
    - Crear interfaces para todos los modelos de dominio
    - _Requirements: 1.2, 2.1, 3.1, 4.1_
  
  - [ ] 2.2 Crear schemas de validación con Zod
    - Implementar `createIncidentSchema` con validación condicional de resourceId
    - Implementar schemas para update, status change, priority change, assign
    - Implementar schemas para comentarios y operaciones masivas
    - _Requirements: 1.2, 3.2, 4.3, 5.1, 6.2, 15.1_
  
  - [ ]* 2.3 Escribir tests unitarios para validaciones
    - Probar validación condicional de resourceId cuando type='recursos'
    - Probar límites de longitud en título y descripción
    - Probar validación de transiciones de estado
    - _Requirements: 1.2, 2.2, 4.3_

- [ ] 3. Servicios de lógica de negocio
  - [ ] 3.1 Implementar servicio de generación de IDs secuenciales
    - Crear función para obtener y actualizar secuencia atómicamente
    - Generar displayId en formato "INC-XXX"
    - Manejar concurrencia con transacciones
    - _Requirements: 1.5_
  
  - [ ] 3.2 Implementar servicio de máquina de estados
    - Crear función `canTransition(from, to)` usando INCIDENT_STATE_TRANSITIONS
    - Validar transiciones permitidas incluyendo caso especial resuelta→en_progreso
    - _Requirements: 4.3, 4.8_
  
  - [ ] 3.3 Implementar servicio de permisos
    - Crear funciones de autorización: `canCreateIncident`, `canAssignIncident`, `canChangeStatus`, `canEditIncident`
    - Implementar lógica de permisos basada en roles (Admin, PIP, Assignee, Reporter)
    - Validar ventana de edición de 24 horas para reporters
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_
  
  - [ ]* 3.4 Escribir tests unitarios para servicios
    - Probar todas las transiciones de estado válidas e inválidas
    - Probar permisos para cada rol y acción
    - Probar generación de IDs secuenciales con casos concurrentes
    - _Requirements: 4.3, 14.1-14.6_

- [ ] 4. API endpoints core - CRUD básico
  - [ ] 4.1 Implementar POST /api/institutions/[id]/incidents
    - Validar input con createIncidentSchema
    - Verificar permisos de usuario autenticado
    - Generar ID secuencial y displayId
    - Crear incidencia con estado "reportada"
    - Registrar en change_history con changeType='created'
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 8.1_
  
  - [ ] 4.2 Implementar GET /api/institutions/[id]/incidents (lista)
    - Filtrar por institutionId del usuario
    - Implementar paginación (default 20 items)
    - Incluir relaciones: reporter, assignee, resource
    - Incluir contadores de comments y attachments
    - _Requirements: 11.1, 11.7, 14.2, 14.7_
  
  - [ ] 4.3 Implementar GET /api/institutions/[id]/incidents/[incidentId] (detalle)
    - Verificar aislamiento multi-tenant por institutionId
    - Incluir todas las relaciones: reporter, assignee, resource
    - Incluir comments, attachments, y change_history
    - _Requirements: 11.2, 11.3, 14.2, 14.7_
  
  - [ ] 4.4 Implementar PATCH /api/institutions/[id]/incidents/[incidentId]
    - Validar permisos según rol y tiempo transcurrido
    - Validar input con updateIncidentSchema
    - Registrar cada cambio en change_history
    - _Requirements: 3.3, 8.1, 8.2, 14.5_
  
  - [ ] 4.5 Implementar DELETE /api/institutions/[id]/incidents/[incidentId]
    - Verificar permisos (solo Admin/PIP)
    - Implementar soft delete (isActive=false)
    - Preservar change_history
    - _Requirements: 8.5, 14.6_

- [ ] 5. Checkpoint - Verificar CRUD básico
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. API endpoints - Comentarios
  - [ ] 6.1 Implementar POST /api/institutions/[id]/incidents/[incidentId]/comments
    - Validar permisos (Reporter, Assignee, Admin, PIP)
    - Validar contenido con createCommentSchema
    - Crear comentario con timestamp
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 6.2 Implementar GET /api/institutions/[id]/incidents/[incidentId]/comments
    - Retornar comentarios en orden cronológico ascendente
    - Incluir información del autor
    - _Requirements: 6.7_
  
  - [ ] 6.3 Implementar PATCH /api/institutions/[id]/incidents/[incidentId]/comments/[commentId]
    - Verificar que el usuario es el autor
    - Validar ventana de edición de 15 minutos
    - Marcar como editado con timestamp
    - _Requirements: 6.5_
  
  - [ ] 6.4 Implementar DELETE /api/institutions/[id]/incidents/[incidentId]/comments/[commentId]
    - Verificar permisos (Admin, PIP, o autor)
    - Eliminar comentario permanentemente
    - _Requirements: 6.6_

- [ ] 7. API endpoints - Adjuntos
  - [ ] 7.1 Implementar POST /api/institutions/[id]/incidents/[incidentId]/attachments
    - Validar tipo de archivo (JPEG, PNG, WebP)
    - Validar tamaño máximo 5MB por archivo
    - Validar límite de 5 archivos por incidencia
    - Subir a Vercel Blob o storage configurado
    - Crear registro en incident_attachments
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 7.2 Implementar DELETE /api/institutions/[id]/incidents/[incidentId]/attachments/[attachmentId]
    - Verificar permisos (Reporter, Admin, PIP)
    - Eliminar archivo del storage
    - Eliminar registro de base de datos
    - Registrar eliminación en change_history
    - _Requirements: 7.5, 7.6_

- [ ] 8. API endpoints - Transiciones de estado
  - [ ] 8.1 Implementar POST /api/institutions/[id]/incidents/[incidentId]/status
    - Validar permisos según rol (Admin, PIP, Assignee)
    - Validar transición de estado con servicio de máquina de estados
    - Requerir resolutionComment cuando status→'resuelta'
    - Registrar timestamp de resolución y calcular resolutionTime
    - Registrar cambio en change_history
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 16.1, 16.2, 16.3_
  
  - [ ] 8.2 Implementar POST /api/institutions/[id]/incidents/[incidentId]/priority
    - Validar permisos (Admin, PIP, Assignee)
    - Validar prioridad con changePrioritySchema
    - Registrar cambio en change_history
    - _Requirements: 3.3, 3.5_
  
  - [ ] 8.3 Implementar POST /api/institutions/[id]/incidents/[incidentId]/assign
    - Validar permisos (Admin, PIP)
    - Validar que assigneeId existe y pertenece a la institución
    - Permitir null para desasignar
    - Registrar cambio en change_history
    - _Requirements: 5.1, 5.2, 5.4, 5.6_

- [ ] 9. Checkpoint - Verificar transiciones y permisos
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Integración con servicio de notificaciones
  - [ ] 10.1 Implementar trigger de notificación al crear incidencia
    - Notificar a todos los Admin y PIP de la institución
    - Usar servicio de notificaciones existente
    - _Requirements: 1.7, 9.1_
  
  - [ ] 10.2 Implementar trigger de notificación al asignar
    - Notificar al nuevo assignee
    - _Requirements: 5.3, 5.5, 9.2_
  
  - [ ] 10.3 Implementar trigger de notificación al cambiar estado
    - Notificar al reporter cuando status→'resuelta'
    - _Requirements: 4.7, 9.3_
  
  - [ ] 10.4 Implementar trigger de notificación al agregar comentario
    - Notificar al reporter y assignee (si existe)
    - _Requirements: 6.4, 9.4_
  
  - [ ] 10.5 Implementar trigger de notificación para prioridad crítica
    - Notificar a todos los Admin y PIP cuando priority→'crítica'
    - _Requirements: 3.4, 9.5_
  
  - [ ] 10.6 Implementar trigger de notificación al reabrir
    - Notificar al assignee y Admin/PIP cuando se reabre una incidencia
    - _Requirements: 16.6_

- [ ] 11. Hooks de TanStack Query
  - [ ] 11.1 Crear hook useIncidents para lista
    - Implementar query con paginación y filtros
    - Configurar staleTime y cacheTime apropiados
    - Incluir invalidación automática
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.1_
  
  - [ ] 11.2 Crear hook useIncident para detalle
    - Implementar query con todas las relaciones
    - _Requirements: 11.2, 11.3_
  
  - [ ] 11.3 Crear hook useCreateIncident
    - Implementar mutation con optimistic update
    - Invalidar queries relacionadas al éxito
    - _Requirements: 1.1_
  
  - [ ] 11.4 Crear hook useUpdateIncident
    - Implementar mutation con optimistic update
    - Invalidar cache de detalle y lista
    - _Requirements: 3.3, 4.3_
  
  - [ ] 11.5 Crear hooks para comentarios y adjuntos
    - Crear useIncidentComments, useCreateComment, useUpdateComment, useDeleteComment
    - Crear useCreateAttachment, useDeleteAttachment
    - _Requirements: 6.1, 6.5, 6.6, 7.1, 7.5_
  
  - [ ] 11.6 Crear hooks para transiciones de estado
    - Crear useChangeStatus, useChangePriority, useAssignIncident
    - Implementar invalidación de cache apropiada
    - _Requirements: 4.3, 3.3, 5.1_

- [ ] 12. Componentes UI básicos - Lista de incidencias
  - [ ] 12.1 Crear componente IncidentList
    - Mostrar tabla/grid con: displayId, título, tipo, prioridad, estado, assignee, fecha
    - Implementar indicadores visuales de prioridad con colores
    - Implementar badges de estado con colores distintivos
    - Integrar con useIncidents hook
    - _Requirements: 11.1, 11.4, 11.5_
  
  - [ ] 12.2 Crear componente IncidentFilters
    - Implementar filtros por estado, prioridad, tipo, assignee, reporter
    - Implementar filtro por rango de fechas
    - Implementar búsqueda en tiempo real con debounce
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 12.3 Crear componente IncidentPagination
    - Implementar paginación con controles de navegación
    - Mostrar información de página actual y total
    - _Requirements: 11.7, 20.2_

- [ ] 13. Componentes UI básicos - Detalle de incidencia
  - [ ] 13.1 Crear componente IncidentDetail
    - Mostrar toda la información de la incidencia
    - Mostrar información del reporter, assignee, y resource vinculado
    - Incluir enlace al recurso en módulo de inventario
    - Integrar con useIncident hook
    - _Requirements: 11.2, 11.3, 11.6, 12.2, 12.3_
  
  - [ ] 13.2 Crear componente IncidentComments
    - Mostrar lista de comentarios en orden cronológico
    - Mostrar información del autor y timestamp
    - Indicar comentarios editados
    - Marcar visualmente comentarios de resolución
    - _Requirements: 6.3, 6.7_
  
  - [ ] 13.3 Crear componente IncidentAttachments
    - Mostrar grid de imágenes adjuntas
    - Implementar lightbox para ver imágenes en tamaño completo
    - Implementar lazy loading de imágenes
    - _Requirements: 7.4, 20.3_
  
  - [ ] 13.4 Crear componente IncidentChangeHistory
    - Mostrar historial en orden cronológico descendente
    - Formatear cambios de manera legible
    - Mostrar usuario que realizó cada cambio
    - _Requirements: 8.3, 8.4_

- [ ] 14. Checkpoint - Verificar visualización básica
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Componentes UI - Formularios
  - [ ] 15.1 Crear componente CreateIncidentForm
    - Implementar formulario con react-hook-form y Zod
    - Incluir campos: título, descripción, tipo, prioridad
    - Implementar selector de recurso condicional (cuando tipo='recursos')
    - Implementar campo de ubicación para infraestructura/servicios
    - Implementar upload de hasta 5 imágenes
    - Integrar con useCreateIncident hook
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3_
  
  - [ ] 15.2 Crear componente EditIncidentForm
    - Reutilizar lógica de CreateIncidentForm
    - Validar permisos y ventana de edición de 24 horas
    - Pre-llenar con datos existentes
    - _Requirements: 14.5_
  
  - [ ] 15.3 Crear componente AddCommentForm
    - Implementar textarea con validación
    - Integrar con useCreateComment hook
    - _Requirements: 6.1, 6.2_
  
  - [ ] 15.4 Crear componente ChangeStatusDialog
    - Implementar selector de estado con validación de transiciones
    - Requerir comentario de resolución cuando status→'resuelta'
    - Integrar con useChangeStatus hook
    - _Requirements: 4.3, 16.1_
  
  - [ ] 15.5 Crear componentes para cambiar prioridad y asignar
    - Crear ChangePriorityDialog con selector de prioridad
    - Crear AssignIncidentDialog con selector de usuario (staff)
    - Integrar con hooks correspondientes
    - _Requirements: 3.3, 5.1_

- [ ] 16. Integración con módulo de recursos
  - [ ] 16.1 Implementar selector de recursos en formulario
    - Crear componente ResourceSelector con búsqueda
    - Filtrar recursos por institución
    - Mostrar información relevante del recurso
    - _Requirements: 1.3, 12.1_
  
  - [ ] 16.2 Implementar actualización de estado de recurso
    - Actualizar resource.status a "en_mantenimiento" cuando incident.status='en_progreso'
    - Permitir actualizar resource.status cuando incident.status='resuelta'
    - _Requirements: 12.5, 12.6_
  
  - [ ] 16.3 Mostrar incidencias en vista de recurso
    - Agregar sección en detalle de recurso mostrando incidencias asociadas
    - Incluir enlace bidireccional entre recurso e incidencia
    - _Requirements: 12.3, 12.4_

- [ ] 17. Búsqueda y filtrado avanzado
  - [ ] 17.1 Implementar búsqueda full-text en backend
    - Agregar índice full-text en título y descripción
    - Implementar query de búsqueda optimizada
    - _Requirements: 10.1, 20.6_
  
  - [ ] 17.2 Implementar filtros combinados
    - Permitir múltiples filtros simultáneos
    - Implementar lógica AND entre filtros
    - _Requirements: 10.4_
  
  - [ ] 17.3 Implementar ordenamiento
    - Permitir ordenar por fecha, prioridad, estado, última actualización
    - Implementar orden ascendente/descendente
    - _Requirements: 10.6, 10.7_
  
  - [ ] 17.4 Implementar búsqueda en tiempo real
    - Implementar debounce de 300ms
    - Mostrar resultados mientras el usuario escribe
    - _Requirements: 10.5, 20.4_

- [ ] 18. Dashboard y estadísticas
  - [ ] 18.1 Implementar API de estadísticas
    - Crear GET /api/institutions/[id]/incidents/stats
    - Calcular métricas: total, por estado, por prioridad, por tipo
    - Calcular tiempo promedio de resolución general y por tipo
    - Obtener top 5 recursos con más incidencias
    - Implementar caching de 5 minutos
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.7, 20.4_
  
  - [ ] 18.2 Crear componente IncidentDashboard
    - Mostrar tarjetas con métricas clave
    - Implementar gráfico de distribución por tipo
    - Implementar gráfico de distribución por prioridad
    - Implementar gráfico de distribución por estado
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [ ] 18.3 Crear componente TopResourcesChart
    - Mostrar top 5 recursos con más incidencias
    - Implementar gráfico de barras o lista ordenada
    - _Requirements: 13.7_
  
  - [ ] 18.4 Implementar filtro de rango de fechas en dashboard
    - Permitir filtrar estadísticas por período
    - Actualizar todos los gráficos según filtro
    - _Requirements: 13.6_

- [ ] 19. Checkpoint - Verificar dashboard y búsqueda
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Operaciones masivas
  - [ ] 20.1 Implementar API de operaciones masivas
    - Crear POST /api/institutions/[id]/incidents/bulk/status
    - Crear POST /api/institutions/[id]/incidents/bulk/priority
    - Crear POST /api/institutions/[id]/incidents/bulk/assign
    - Validar límite de 50 incidencias por operación
    - Registrar cada cambio individual en change_history
    - _Requirements: 15.2, 15.3, 15.4, 15.6_
  
  - [ ] 20.2 Crear componente BulkActionsToolbar
    - Implementar checkboxes para selección múltiple
    - Mostrar contador de incidencias seleccionadas
    - Implementar botones de acción masiva
    - _Requirements: 15.1_
  
  - [ ] 20.3 Implementar confirmación de cambios masivos
    - Mostrar dialog de confirmación con resumen de cambios
    - Listar incidencias afectadas
    - _Requirements: 15.5_
  
  - [ ] 20.4 Implementar notificaciones agrupadas
    - Agrupar notificaciones para evitar spam
    - Enviar resumen de cambios masivos
    - _Requirements: 15.7_

- [ ] 21. Plantillas de incidencias
  - [ ] 21.1 Implementar API de plantillas
    - Crear GET /api/institutions/[id]/incidents/templates
    - Crear POST /api/institutions/[id]/incidents/templates
    - Crear PATCH /api/institutions/[id]/incidents/templates/[templateId]
    - Crear DELETE /api/institutions/[id]/incidents/templates/[templateId]
    - _Requirements: 17.1, 17.6_
  
  - [ ] 21.2 Crear componente TemplateManager
    - Mostrar lista de plantillas activas
    - Permitir crear, editar, y desactivar plantillas
    - Validar permisos (Admin, PIP)
    - _Requirements: 17.1, 17.6_
  
  - [ ] 21.3 Integrar plantillas en formulario de creación
    - Mostrar selector de plantillas al crear incidencia
    - Pre-llenar formulario con valores de plantilla
    - Permitir modificar campos pre-llenados
    - Implementar sustitución de variables en descripción
    - _Requirements: 17.2, 17.3, 17.4, 17.5_

- [ ] 22. Detección de incidencias recurrentes
  - [ ] 22.1 Implementar lógica de detección de recurrencia
    - Detectar 3+ incidencias del mismo recurso en 30 días
    - Detectar 3+ incidencias de misma ubicación y tipo en 30 días
    - Marcar incidencias como recurrentes automáticamente
    - _Requirements: 18.1, 18.2_
  
  - [ ] 22.2 Crear API para incidencias recurrentes
    - Crear GET /api/institutions/[id]/incidents/recurrent
    - Retornar incidencias agrupadas por recurso o ubicación
    - _Requirements: 18.3, 18.7_
  
  - [ ] 22.3 Crear componente RecurrentIncidentsAlert
    - Mostrar alerta en dashboard cuando hay incidencias recurrentes
    - Listar incidencias recurrentes sin resolver
    - _Requirements: 18.4_
  
  - [ ] 22.4 Implementar agrupación de incidencias recurrentes
    - Permitir a Admin/PIP crear "incidencia maestra"
    - Vincular incidencias individuales a incidencia maestra
    - Mostrar relaciones en vista de detalle
    - _Requirements: 18.5, 18.6_

- [ ] 23. Exportación de datos
  - [ ] 23.1 Implementar exportación CSV
    - Crear GET /api/institutions/[id]/incidents/export?format=csv
    - Incluir todos los campos, comentarios, y change_history
    - Incluir URLs de attachments
    - Aplicar filtros de búsqueda a exportación
    - _Requirements: 19.1, 19.3, 19.4, 19.5_
  
  - [ ] 23.2 Implementar exportación PDF
    - Crear GET /api/institutions/[id]/incidents/export?format=pdf
    - Generar PDF formateado con toda la información
    - Incluir imágenes adjuntas en el PDF
    - _Requirements: 19.2, 19.3, 19.4, 19.6_
  
  - [ ] 23.3 Implementar log de auditoría de exportaciones
    - Registrar cada exportación con usuario y timestamp
    - Crear tabla audit_log si no existe
    - _Requirements: 19.7_

- [ ] 24. Checkpoint - Verificar características avanzadas
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Testing integral
  - [ ]* 25.1 Escribir tests de integración para APIs
    - Probar cada endpoint con casos válidos e inválidos
    - Probar aislamiento multi-tenant
    - Probar manejo de errores
  
  - [ ]* 25.2 Escribir tests E2E para flujos principales
    - Flujo completo: crear → asignar → comentar → resolver → cerrar
    - Flujo de operaciones masivas
    - Flujo de detección de recurrencia
  
  - [ ]* 25.3 Escribir tests de rendimiento
    - Probar carga de lista con 1000+ incidencias
    - Probar búsqueda full-text
    - Probar cálculo de estadísticas con caching

- [ ] 26. Optimizaciones finales
  - [ ] 26.1 Optimizar queries de base de datos
    - Revisar y optimizar queries N+1
    - Agregar índices faltantes si es necesario
    - Implementar select específico en lugar de select *
    - _Requirements: 20.1, 20.5_
  
  - [ ] 26.2 Implementar lazy loading y code splitting
    - Lazy load componentes pesados (dashboard, charts)
    - Implementar code splitting por ruta
    - Lazy load attachments en vista de lista
    - _Requirements: 20.3_
  
  - [ ] 26.3 Implementar optimistic updates
    - Actualizar UI inmediatamente en mutaciones
    - Revertir en caso de error
    - Mostrar indicadores de carga apropiados
  
  - [ ] 26.4 Configurar rate limiting
    - Implementar límites de requests por usuario
    - Implementar límites específicos para file uploads
    - Implementar límites para operaciones masivas

- [ ] 27. Integración con frontend - Rutas y navegación
  - [ ] 27.1 Crear rutas del dashboard para incidencias
    - Crear `/app/(dashboard)/incidencias/page.tsx` para lista de incidencias
    - Crear `/app/(dashboard)/incidencias/[id]/page.tsx` para detalle de incidencia
    - Crear `/app/(dashboard)/incidencias/nueva/page.tsx` para crear incidencia
    - Implementar Server Components donde sea apropiado
    - _Requirements: 11.1, 11.2, 1.1_
  
  - [ ] 27.2 Agregar entrada en navegación principal
    - Actualizar componente de navegación lateral (sidebar) para incluir "Incidencias"
    - Agregar ícono apropiado (AlertTriangle o similar)
    - Posicionar después de "Recursos" en el menú
    - Verificar permisos de acceso (todos los usuarios autenticados)
    - _Requirements: 14.1, 14.2_
  
  - [ ] 27.3 Crear página principal de incidencias
    - Implementar layout con filtros en sidebar y lista principal
    - Integrar IncidentList, IncidentFilters, IncidentPagination
    - Agregar botón flotante "Nueva Incidencia"
    - Implementar tabs para vistas: "Todas", "Mis Incidencias", "Asignadas a mí"
    - _Requirements: 11.1, 10.1-10.7_
  
  - [ ] 27.4 Crear página de detalle de incidencia
    - Implementar layout de dos columnas: info principal + sidebar con acciones
    - Integrar IncidentDetail, IncidentComments, IncidentAttachments, IncidentChangeHistory
    - Agregar botones de acción según permisos: editar, cambiar estado, asignar, etc.
    - Implementar breadcrumbs para navegación
    - _Requirements: 11.2, 11.3_
  
  - [ ] 27.5 Integrar con módulo de recursos
    - Agregar tab "Incidencias" en página de detalle de recurso
    - Mostrar lista de incidencias asociadas al recurso
    - Agregar botón "Reportar Incidencia" en detalle de recurso
    - Pre-llenar formulario con resourceId cuando se crea desde recurso
    - _Requirements: 12.3, 12.4_
  
  - [ ] 27.6 Agregar notificaciones in-app
    - Integrar con sistema de notificaciones existente
    - Mostrar badge con contador de incidencias sin leer
    - Implementar dropdown de notificaciones en header
    - Enlazar notificaciones a incidencias correspondientes
    - _Requirements: 9.1-9.6_
  
  - [ ] 27.7 Agregar widgets en dashboard principal
    - Crear widget "Incidencias Pendientes" para dashboard home
    - Mostrar métricas clave: total abiertas, críticas, asignadas a mí
    - Agregar enlace rápido a página de incidencias
    - _Requirements: 13.1_

- [ ] 28. Integración con frontend - Configuración y permisos
  - [ ] 28.1 Agregar configuración de incidencias en settings
    - Crear `/app/(dashboard)/settings/incidencias/page.tsx`
    - Implementar gestión de plantillas (TemplateManager)
    - Agregar configuración de notificaciones por usuario
    - Agregar entrada en menú de configuración
    - _Requirements: 17.1, 17.6, 9.7_
  
  - [ ] 28.2 Implementar control de permisos en UI
    - Ocultar/deshabilitar acciones según rol del usuario
    - Mostrar tooltips explicativos cuando acción no está permitida
    - Implementar guards en rutas si es necesario
    - _Requirements: 14.1-14.6_
  
  - [ ] 28.3 Agregar feature flag para módulo de incidencias
    - Permitir habilitar/deshabilitar módulo por institución
    - Ocultar navegación cuando módulo está deshabilitado
    - Agregar toggle en configuración de institución (Admin)
    - _Requirements: 14.7_

- [ ] 29. Documentación y deployment
  - [ ] 29.1 Documentar variables de entorno
    - Documentar DATABASE_URL, BLOB_READ_WRITE_TOKEN, RESEND_API_KEY
    - Crear archivo .env.example
  
  - [ ] 29.2 Crear guía de uso para usuarios
    - Documentar flujo de creación de incidencias
    - Documentar permisos por rol
    - Documentar características avanzadas
  
  - [ ] 29.3 Configurar monitoreo
    - Configurar Sentry para error tracking
    - Configurar alertas para queries lentas
    - Configurar monitoreo de tasa de éxito de notificaciones

- [ ] 30. Final checkpoint - Verificación completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental del progreso
- El plan sigue las prioridades especificadas: fundación → core → características avanzadas
- La implementación usa TypeScript, Next.js 15, TanStack Query, y Drizzle ORM
- Todas las queries filtran por institutionId para garantizar aislamiento multi-tenant
- El sistema implementa soft delete para preservar datos de auditoría
