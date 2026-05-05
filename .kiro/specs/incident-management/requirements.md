# Requirements Document - Incident Management Module

## Introduction

El módulo de gestión de incidencias permite a cualquier usuario autenticado de la plataforma FLIP reportar, rastrear y resolver problemas relacionados con recursos, infraestructura, servicios y seguridad en instituciones educativas. El sistema proporciona un flujo completo desde el reporte inicial hasta la resolución, incluyendo asignación de responsables, seguimiento con comentarios, adjuntos de evidencias, notificaciones y reportes estadísticos.

## Glossary

- **Incident_System**: El módulo completo de gestión de incidencias
- **Incident**: Una incidencia reportada en el sistema
- **Reporter**: Usuario autenticado que reporta una incidencia
- **Assignee**: Usuario responsable asignado para resolver una incidencia
- **Priority**: Nivel de urgencia de una incidencia (baja, media, alta, crítica)
- **Status**: Estado actual en el ciclo de vida de una incidencia
- **Comment**: Actualización o nota agregada a una incidencia
- **Attachment**: Archivo adjunto (foto/evidencia) asociado a una incidencia
- **Incident_Type**: Categoría de incidencia (recursos, infraestructura, servicios, seguridad, otros)
- **Change_History**: Registro histórico de todas las modificaciones a una incidencia
- **Notification_Service**: Servicio que envía notificaciones a usuarios relevantes
- **Resource**: Equipo o material del inventario existente en el sistema
- **Institution**: Institución educativa multi-tenant
- **Authenticated_User**: Cualquier usuario con sesión activa en la plataforma

## Requirements

### Requirement 1: Crear Incidencias

**User Story:** Como usuario autenticado, quiero reportar una incidencia, para que los problemas sean documentados y resueltos.

#### Acceptance Criteria

1. WHEN un usuario autenticado envía un formulario de incidencia válido, THE Incident_System SHALL crear una nueva incidencia con estado "reportada"
2. THE Incident_System SHALL requerir título, descripción, tipo de incidencia y prioridad para crear una incidencia
3. THE Incident_System SHALL permitir al Reporter vincular opcionalmente un Resource existente a la incidencia
4. THE Incident_System SHALL permitir al Reporter adjuntar opcionalmente hasta 5 archivos de imagen como evidencia
5. THE Incident_System SHALL asignar automáticamente un identificador único secuencial por institución a cada incidencia
6. THE Incident_System SHALL registrar la fecha y hora de creación, el Reporter y la Institution asociada
7. WHEN una incidencia es creada, THE Notification_Service SHALL notificar a los usuarios con rol Admin y PIP de la institución

### Requirement 2: Clasificación de Incidencias

**User Story:** Como usuario, quiero clasificar las incidencias por tipo, para que sean dirigidas al área correcta.

#### Acceptance Criteria

1. THE Incident_System SHALL soportar cinco tipos de incidencias: recursos/equipos, infraestructura, servicios, seguridad, y otros
2. WHEN el tipo es "recursos/equipos", THE Incident_System SHALL permitir vincular un Resource específico del inventario
3. THE Incident_System SHALL permitir al Reporter especificar una ubicación física para incidencias de infraestructura y servicios
4. THE Incident_System SHALL requerir que cada incidencia tenga exactamente un tipo asignado

### Requirement 3: Gestión de Prioridades

**User Story:** Como usuario, quiero asignar prioridades a las incidencias, para que las más urgentes sean atendidas primero.

#### Acceptance Criteria

1. THE Incident_System SHALL soportar cuatro niveles de prioridad: baja, media, alta, y crítica
2. THE Incident_System SHALL permitir al Reporter establecer la prioridad inicial al crear la incidencia
3. THE Incident_System SHALL permitir a usuarios con rol Admin, PIP o Assignee modificar la prioridad en cualquier momento
4. WHEN la prioridad cambia a "crítica", THE Notification_Service SHALL enviar notificación inmediata a todos los Admin y PIP
5. THE Incident_System SHALL registrar cada cambio de prioridad en el Change_History

### Requirement 4: Ciclo de Vida de Estados

**User Story:** Como usuario, quiero rastrear el progreso de las incidencias, para saber en qué etapa se encuentran.

#### Acceptance Criteria

1. THE Incident_System SHALL soportar cinco estados: reportada, en_revision, en_progreso, resuelta, y cerrada
2. THE Incident_System SHALL crear nuevas incidencias con estado "reportada"
3. THE Incident_System SHALL permitir transiciones de estado solo en el siguiente orden: reportada → en_revision → en_progreso → resuelta → cerrada
4. THE Incident_System SHALL permitir a usuarios con rol Admin o PIP cambiar el estado de cualquier incidencia
5. THE Incident_System SHALL permitir al Assignee cambiar el estado de incidencias asignadas a ellos
6. WHEN el estado cambia, THE Incident_System SHALL registrar la transición en el Change_History con timestamp y usuario
7. WHEN el estado cambia a "resuelta", THE Notification_Service SHALL notificar al Reporter original
8. THE Incident_System SHALL prevenir cambios de estado hacia atrás en el flujo (excepto de resuelta a en_progreso)

### Requirement 5: Asignación de Responsables

**User Story:** Como administrador, quiero asignar responsables a las incidencias, para que haya claridad sobre quién debe resolverlas.

#### Acceptance Criteria

1. THE Incident_System SHALL permitir a usuarios con rol Admin o PIP asignar un Assignee a cualquier incidencia
2. THE Incident_System SHALL permitir que una incidencia tenga cero o un Assignee
3. WHEN un Assignee es asignado, THE Notification_Service SHALL notificar al usuario asignado
4. THE Incident_System SHALL permitir cambiar el Assignee en cualquier momento antes de que la incidencia esté cerrada
5. WHEN el Assignee cambia, THE Notification_Service SHALL notificar al nuevo Assignee
6. THE Incident_System SHALL registrar cada cambio de asignación en el Change_History

### Requirement 6: Sistema de Comentarios

**User Story:** Como usuario involucrado en una incidencia, quiero agregar comentarios, para comunicar actualizaciones y coordinar la resolución.

#### Acceptance Criteria

1. THE Incident_System SHALL permitir al Reporter, Assignee, Admin y PIP agregar comentarios a una incidencia
2. THE Incident_System SHALL requerir que cada Comment tenga contenido de texto no vacío
3. THE Incident_System SHALL registrar el autor, timestamp y contenido de cada Comment
4. WHEN un Comment es agregado, THE Notification_Service SHALL notificar al Reporter y al Assignee (si existe)
5. THE Incident_System SHALL permitir al autor de un Comment editarlo dentro de 15 minutos de su creación
6. THE Incident_System SHALL permitir a usuarios con rol Admin o PIP eliminar cualquier Comment
7. THE Incident_System SHALL mostrar los comentarios en orden cronológico ascendente

### Requirement 7: Adjuntar Evidencias

**User Story:** Como usuario, quiero adjuntar fotos y archivos a las incidencias, para proporcionar evidencia visual de los problemas.

#### Acceptance Criteria

1. THE Incident_System SHALL permitir adjuntar archivos de imagen (JPEG, PNG, WebP) al crear o actualizar una incidencia
2. THE Incident_System SHALL limitar el tamaño máximo de cada archivo a 5MB
3. THE Incident_System SHALL permitir hasta 5 archivos adjuntos por incidencia
4. THE Incident_System SHALL almacenar los archivos de forma segura y asociarlos a la incidencia correspondiente
5. THE Incident_System SHALL permitir al Reporter y usuarios con rol Admin o PIP eliminar attachments
6. THE Incident_System SHALL registrar la eliminación de attachments en el Change_History

### Requirement 8: Historial de Cambios

**User Story:** Como usuario, quiero ver el historial completo de cambios de una incidencia, para entender su evolución.

#### Acceptance Criteria

1. THE Incident_System SHALL registrar automáticamente cada modificación a una incidencia en el Change_History
2. THE Incident_System SHALL capturar cambios en: estado, prioridad, assignee, tipo, título, descripción, y resource vinculado
3. THE Incident_System SHALL registrar para cada cambio: campo modificado, valor anterior, valor nuevo, usuario que realizó el cambio, y timestamp
4. THE Incident_System SHALL mostrar el Change_History en orden cronológico descendente (más reciente primero)
5. THE Incident_System SHALL preservar el Change_History incluso si la incidencia es eliminada (soft delete)

### Requirement 9: Notificaciones

**User Story:** Como usuario, quiero recibir notificaciones sobre incidencias relevantes, para estar informado de cambios importantes.

#### Acceptance Criteria

1. WHEN una incidencia es creada, THE Notification_Service SHALL notificar a todos los usuarios con rol Admin y PIP de la institución
2. WHEN un usuario es asignado como Assignee, THE Notification_Service SHALL notificar a ese usuario
3. WHEN el estado cambia a "resuelta", THE Notification_Service SHALL notificar al Reporter
4. WHEN un Comment es agregado, THE Notification_Service SHALL notificar al Reporter y al Assignee
5. WHEN la prioridad cambia a "crítica", THE Notification_Service SHALL notificar a todos los Admin y PIP
6. THE Notification_Service SHALL enviar notificaciones por email y notificaciones in-app
7. THE Incident_System SHALL permitir a los usuarios configurar sus preferencias de notificación

### Requirement 10: Búsqueda y Filtrado

**User Story:** Como usuario, quiero buscar y filtrar incidencias, para encontrar rápidamente las que necesito revisar.

#### Acceptance Criteria

1. THE Incident_System SHALL permitir buscar incidencias por título, descripción, o identificador
2. THE Incident_System SHALL permitir filtrar incidencias por estado, prioridad, tipo, assignee, y reporter
3. THE Incident_System SHALL permitir filtrar incidencias por rango de fechas de creación
4. THE Incident_System SHALL permitir combinar múltiples filtros simultáneamente
5. THE Incident_System SHALL mostrar resultados de búsqueda en tiempo real mientras el usuario escribe
6. THE Incident_System SHALL ordenar resultados por fecha de creación (descendente) por defecto
7. THE Incident_System SHALL permitir ordenar resultados por prioridad, estado, o fecha de última actualización

### Requirement 11: Visualización de Incidencias

**User Story:** Como usuario, quiero ver listas y detalles de incidencias, para revisar su información completa.

#### Acceptance Criteria

1. THE Incident_System SHALL mostrar una lista de incidencias con: identificador, título, tipo, prioridad, estado, assignee, y fecha de creación
2. THE Incident_System SHALL permitir acceder a la vista detallada de una incidencia al hacer clic en ella
3. THE Incident_System SHALL mostrar en la vista detallada: toda la información de la incidencia, comentarios, attachments, y change history
4. THE Incident_System SHALL mostrar indicadores visuales de prioridad mediante colores (crítica: rojo, alta: naranja, media: amarillo, baja: gris)
5. THE Incident_System SHALL mostrar badges de estado con colores distintivos
6. WHEN una incidencia está vinculada a un Resource, THE Incident_System SHALL mostrar un enlace al recurso en el inventario
7. THE Incident_System SHALL paginar listas de incidencias mostrando 20 elementos por página

### Requirement 12: Integración con Recursos

**User Story:** Como usuario, quiero vincular incidencias a recursos del inventario, para rastrear problemas específicos de equipos.

#### Acceptance Criteria

1. WHEN el tipo de incidencia es "recursos/equipos", THE Incident_System SHALL permitir buscar y seleccionar un Resource del inventario
2. THE Incident_System SHALL mostrar información del Resource vinculado (nombre, código interno, categoría) en la vista de incidencia
3. THE Incident_System SHALL permitir navegar desde la incidencia al detalle del Resource en el módulo de inventario
4. THE Incident_System SHALL mostrar en la vista de detalle del Resource todas las incidencias asociadas a ese recurso
5. THE Incident_System SHALL actualizar automáticamente el estado del Resource a "en_mantenimiento" cuando una incidencia vinculada está en estado "en_progreso"
6. WHEN una incidencia vinculada a un Resource cambia a estado "resuelta", THE Incident_System SHALL permitir al usuario actualizar el estado del Resource

### Requirement 13: Reportes y Estadísticas

**User Story:** Como administrador, quiero ver reportes y estadísticas de incidencias, para analizar tendencias y tomar decisiones.

#### Acceptance Criteria

1. THE Incident_System SHALL generar un dashboard con métricas clave: total de incidencias, incidencias abiertas, incidencias resueltas, y tiempo promedio de resolución
2. THE Incident_System SHALL mostrar distribución de incidencias por tipo en un gráfico de barras o pastel
3. THE Incident_System SHALL mostrar distribución de incidencias por prioridad
4. THE Incident_System SHALL mostrar distribución de incidencias por estado
5. THE Incident_System SHALL calcular y mostrar el tiempo promedio de resolución por tipo de incidencia
6. THE Incident_System SHALL permitir filtrar estadísticas por rango de fechas
7. THE Incident_System SHALL mostrar los top 5 recursos con más incidencias reportadas
8. THE Incident_System SHALL permitir exportar reportes en formato PDF o CSV

### Requirement 14: Permisos y Seguridad

**User Story:** Como administrador del sistema, quiero controlar quién puede realizar qué acciones, para mantener la seguridad y privacidad.

#### Acceptance Criteria

1. THE Incident_System SHALL permitir a cualquier Authenticated_User crear incidencias
2. THE Incident_System SHALL permitir a cualquier Authenticated_User ver incidencias de su Institution
3. THE Incident_System SHALL permitir solo a Admin y PIP asignar o cambiar el Assignee
4. THE Incident_System SHALL permitir solo a Admin, PIP y Assignee cambiar el estado de incidencias
5. THE Incident_System SHALL permitir solo al Reporter original editar título y descripción de una incidencia dentro de 24 horas de creación
6. THE Incident_System SHALL permitir solo a Admin y PIP eliminar incidencias (soft delete)
7. THE Incident_System SHALL aislar completamente las incidencias entre diferentes instituciones (multi-tenant)
8. THE Incident_System SHALL registrar en Change_History todos los intentos de modificación con el usuario que los realizó

### Requirement 15: Gestión de Incidencias Masivas

**User Story:** Como administrador, quiero realizar acciones en múltiples incidencias simultáneamente, para gestionar eficientemente grandes volúmenes.

#### Acceptance Criteria

1. THE Incident_System SHALL permitir a usuarios con rol Admin o PIP seleccionar múltiples incidencias mediante checkboxes
2. THE Incident_System SHALL permitir cambiar el estado de múltiples incidencias seleccionadas en una sola operación
3. THE Incident_System SHALL permitir cambiar la prioridad de múltiples incidencias seleccionadas en una sola operación
4. THE Incident_System SHALL permitir asignar un Assignee a múltiples incidencias seleccionadas en una sola operación
5. THE Incident_System SHALL mostrar una confirmación antes de aplicar cambios masivos
6. THE Incident_System SHALL registrar cada cambio individual en el Change_History de cada incidencia afectada
7. WHEN se realizan cambios masivos, THE Notification_Service SHALL enviar notificaciones agrupadas para evitar spam

### Requirement 16: Resolución y Cierre

**User Story:** Como usuario asignado, quiero marcar incidencias como resueltas y cerrarlas, para completar el ciclo de vida.

#### Acceptance Criteria

1. THE Incident_System SHALL requerir que el Assignee agregue un Comment de resolución al cambiar el estado a "resuelta"
2. WHEN una incidencia cambia a estado "resuelta", THE Incident_System SHALL registrar la fecha y hora de resolución
3. THE Incident_System SHALL calcular automáticamente el tiempo de resolución (diferencia entre fecha de creación y fecha de resolución)
4. THE Incident_System SHALL permitir al Reporter o Admin cambiar el estado de "resuelta" a "cerrada" después de verificar la solución
5. THE Incident_System SHALL permitir al Reporter reabrir una incidencia "resuelta" cambiándola a "en_progreso" si el problema persiste
6. WHEN una incidencia es reabierta, THE Notification_Service SHALL notificar al Assignee y a los Admin/PIP
7. THE Incident_System SHALL prevenir cualquier modificación a incidencias en estado "cerrada" excepto agregar comentarios

### Requirement 17: Plantillas de Incidencias

**User Story:** Como usuario, quiero usar plantillas predefinidas para tipos comunes de incidencias, para reportar más rápidamente.

#### Acceptance Criteria

1. THE Incident_System SHALL permitir a usuarios con rol Admin o PIP crear plantillas de incidencias para su institución
2. THE Incident_System SHALL permitir que cada plantilla incluya: tipo, prioridad sugerida, título predefinido, y descripción con campos variables
3. THE Incident_System SHALL mostrar plantillas disponibles al crear una nueva incidencia
4. WHEN un usuario selecciona una plantilla, THE Incident_System SHALL pre-llenar el formulario con los valores de la plantilla
5. THE Incident_System SHALL permitir al usuario modificar cualquier campo pre-llenado antes de crear la incidencia
6. THE Incident_System SHALL permitir a Admin y PIP editar o desactivar plantillas existentes

### Requirement 18: Incidencias Recurrentes

**User Story:** Como administrador, quiero identificar incidencias recurrentes, para abordar problemas sistémicos.

#### Acceptance Criteria

1. THE Incident_System SHALL detectar automáticamente incidencias recurrentes cuando el mismo Resource tiene 3 o más incidencias en 30 días
2. THE Incident_System SHALL detectar automáticamente incidencias recurrentes cuando la misma ubicación física tiene 3 o más incidencias del mismo tipo en 30 días
3. WHEN se detecta una incidencia recurrente, THE Incident_System SHALL marcar visualmente las incidencias relacionadas
4. THE Incident_System SHALL mostrar una alerta en el dashboard cuando hay incidencias recurrentes sin resolver
5. THE Incident_System SHALL permitir a Admin y PIP agrupar incidencias recurrentes en una "incidencia maestra"
6. WHEN incidencias son agrupadas, THE Incident_System SHALL vincular las incidencias individuales a la incidencia maestra
7. THE Incident_System SHALL mostrar en reportes las incidencias recurrentes más frecuentes

### Requirement 19: Exportación de Datos

**User Story:** Como administrador, quiero exportar datos de incidencias, para análisis externo o cumplimiento normativo.

#### Acceptance Criteria

1. THE Incident_System SHALL permitir a usuarios con rol Admin exportar incidencias en formato CSV
2. THE Incident_System SHALL permitir a usuarios con rol Admin exportar incidencias en formato PDF
3. THE Incident_System SHALL incluir en la exportación: todos los campos de la incidencia, comentarios, y change history
4. THE Incident_System SHALL permitir filtrar qué incidencias exportar usando los mismos filtros de búsqueda
5. THE Incident_System SHALL incluir attachments como URLs en la exportación CSV
6. THE Incident_System SHALL generar un PDF formateado con toda la información de cada incidencia incluyendo imágenes adjuntas
7. THE Incident_System SHALL registrar cada exportación en un log de auditoría con usuario y timestamp

### Requirement 20: Optimización de Rendimiento

**User Story:** Como usuario, quiero que el sistema responda rápidamente, para trabajar eficientemente.

#### Acceptance Criteria

1. THE Incident_System SHALL cargar la lista de incidencias en menos de 500ms para conjuntos de hasta 1000 incidencias
2. THE Incident_System SHALL implementar paginación para listas con más de 20 elementos
3. THE Incident_System SHALL implementar lazy loading para attachments en la vista de lista
4. THE Incident_System SHALL cachear estadísticas del dashboard por 5 minutos
5. THE Incident_System SHALL usar índices de base de datos en campos frecuentemente filtrados (status, priority, type, institutionId, assigneeId)
6. THE Incident_System SHALL optimizar consultas de búsqueda usando full-text search cuando esté disponible
7. THE Incident_System SHALL cargar comentarios y change history solo cuando el usuario expande esas secciones en la vista detallada
