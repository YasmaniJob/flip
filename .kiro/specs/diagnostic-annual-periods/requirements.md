# Documento de Requisitos: Sistema de Periodización Anual para Diagnóstico de Habilidades Digitales

## Introducción

El sistema de periodización anual permite que los docentes completen el diagnóstico de habilidades digitales una vez por año calendario. El sistema detecta automáticamente el año actual, valida que no existan diagnósticos duplicados en el mismo periodo, mantiene un histórico acumulativo de la evolución del docente, y proporciona visualizaciones comparativas multi-año tanto para docentes como para administradores institucionales.

Este sistema opera en una arquitectura SaaS multi-tenant donde cada institución tiene sus datos aislados, soportando miles de instituciones simultáneamente sin configuración manual de periodos.

## Glosario

- **Sistema**: El módulo de diagnóstico de habilidades digitales con periodización anual
- **Docente**: Usuario que completa el diagnóstico (puede ser staff registrado o usuario temporal)
- **Sesión**: Una instancia completada del diagnóstico con sus respuestas y resultados
- **Año_Calendario**: Año natural (2025, 2026, etc.) usado como periodo de diagnóstico
- **Histórico**: Conjunto de todas las sesiones de un docente ordenadas por año
- **Evolución**: Métricas de cambio entre el primer y último año del histórico
- **Dimensión**: Una de las 5 áreas evaluadas (Informacional, Comunicacional, Creación de Contenidos, Seguridad, Resolución de Problemas)
- **Institución**: Organización educativa que utiliza el sistema (tenant en arquitectura SaaS)
- **Admin**: Usuario con permisos de administración en una institución
- **Quiz_Público**: Interfaz pública donde docentes no autenticados completan el diagnóstico
- **Dashboard_Docente**: Interfaz privada donde docentes autenticados ven su histórico
- **Panel_Admin**: Interfaz de administración institucional

## Requisitos

### Requisito 1: Detección Automática de Año

**User Story:** Como docente, quiero que el sistema detecte automáticamente el año actual, para no tener que seleccionarlo manualmente.

#### Criterios de Aceptación

1. WHEN el Sistema inicia una sesión de diagnóstico, THE Sistema SHALL obtener el año actual del calendario del servidor
2. THE Sistema SHALL usar el año actual como periodo de diagnóstico por defecto
3. THE Sistema SHALL mostrar el año actual en la interfaz de usuario del quiz
4. THE Sistema SHALL validar que el año detectado sea mayor o igual a 2025

### Requisito 2: Unicidad de Sesión por Año

**User Story:** Como docente, quiero completar el diagnóstico una vez por año, para que mi progreso anual quede registrado sin duplicados.

#### Criterios de Aceptación

1. WHEN un Docente intenta iniciar un diagnóstico, THE Sistema SHALL verificar si ya existe una sesión completada para ese Docente en el Año_Calendario actual
2. IF existe una sesión del Año_Calendario actual, THEN THE Sistema SHALL bloquear el inicio de una nueva sesión y mostrar un mensaje informativo
3. WHEN un Docente intenta guardar un diagnóstico, THE Sistema SHALL validar que no exista otra sesión para la misma Institución, mismo Docente y mismo Año_Calendario
4. IF la validación detecta duplicado, THEN THE Sistema SHALL rechazar la operación con código HTTP 409 y mensaje descriptivo
5. WHEN inicia un nuevo Año_Calendario, THE Sistema SHALL permitir automáticamente que el Docente complete un nuevo diagnóstico

### Requisito 3: Almacenamiento de Sesiones con Año

**User Story:** Como sistema, necesito almacenar cada sesión con su año correspondiente, para mantener un histórico preciso y consultable.

#### Criterios de Aceptación

1. WHEN el Sistema guarda una sesión de diagnóstico, THE Sistema SHALL almacenar el Año_Calendario en el campo `year` de la tabla `diagnostic_sessions`
2. THE Sistema SHALL garantizar que el campo `year` sea NOT NULL mediante constraint de base de datos
3. THE Sistema SHALL validar que el valor de `year` esté entre 2025 y 2100 mediante check constraint
4. THE Sistema SHALL crear un índice en el campo `year` para optimizar consultas por periodo
5. THE Sistema SHALL crear un índice compuesto en `(institution_id, year)` para consultas institucionales
6. THE Sistema SHALL crear un constraint único en `(institution_id, staff_id, year)` para docentes registrados
7. THE Sistema SHALL crear un constraint único en `(institution_id, user_id, year)` para usuarios temporales

### Requisito 4: Validación de Identidad con Verificación de Año

**User Story:** Como docente, quiero identificarme al inicio del diagnóstico, para que el sistema verifique si ya lo completé este año.

#### Criterios de Aceptación

1. WHEN un Docente envía sus datos de identificación, THE Sistema SHALL buscar al Docente por tipo y número de documento
2. WHEN el Docente es encontrado, THE Sistema SHALL verificar si existe una sesión para ese Docente en el Año_Calendario actual
3. IF existe sesión del año actual, THEN THE Sistema SHALL retornar `canComplete: false` con los datos de la sesión existente
4. IF no existe sesión del año actual, THEN THE Sistema SHALL retornar `canComplete: true` con el año actual
5. THE Sistema SHALL incluir el Año_Calendario en la respuesta de identificación
6. IF el Docente no es encontrado, THEN THE Sistema SHALL permitir registro lazy y retornar `canComplete: true`

### Requisito 5: Completar Diagnóstico con Año Actual

**User Story:** Como docente, quiero completar el diagnóstico, para que mis respuestas y resultados queden registrados en el año actual.

#### Criterios de Aceptación

1. WHEN un Docente envía las respuestas del diagnóstico, THE Sistema SHALL obtener el Año_Calendario actual
2. WHEN el Sistema guarda la sesión, THE Sistema SHALL asignar el Año_Calendario actual al campo `year`
3. WHEN el Sistema calcula los puntajes, THE Sistema SHALL validar que todos los puntajes estén entre 0 y 100
4. WHEN el Sistema guarda la sesión, THE Sistema SHALL guardar las respuestas y la sesión en una transacción atómica
5. IF la transacción falla, THEN THE Sistema SHALL hacer rollback completo sin guardar datos parciales
6. WHEN la sesión se guarda exitosamente, THE Sistema SHALL retornar el ID de sesión, año y resultados calculados
7. IF se viola el constraint de unicidad, THEN THE Sistema SHALL retornar error 409 con mensaje "Ya existe un diagnóstico completado para el año {year}"

### Requisito 6: Consulta de Histórico Multi-Año

**User Story:** Como docente, quiero ver todas mis sesiones de diagnóstico de años anteriores, para analizar mi evolución en el tiempo.

#### Criterios de Aceptación

1. WHEN un Docente solicita su histórico, THE Sistema SHALL obtener todas las sesiones del Docente ordenadas por año descendente
2. THE Sistema SHALL incluir para cada sesión: ID, año, fecha de completado y resultados por dimensión
3. WHEN el Docente tiene 2 o más sesiones, THE Sistema SHALL calcular métricas de evolución
4. THE Sistema SHALL calcular la diferencia de puntaje entre el último y primer año para cada Dimensión
5. THE Sistema SHALL incluir en la evolución: cantidad de años, primer año, último año y mejoras por dimensión
6. WHEN el Docente tiene 0 o 1 sesión, THE Sistema SHALL retornar `evolution: null`
7. THE Sistema SHALL garantizar que el histórico esté ordenado por año DESC

### Requisito 7: Visualización de Evolución en Dashboard Docente

**User Story:** Como docente, quiero visualizar gráficamente mi evolución multi-año, para entender mi progreso en cada dimensión.

#### Criterios de Aceptación

1. WHEN un Docente accede a su Dashboard_Docente, THE Sistema SHALL mostrar un selector de años con los años disponibles en su histórico
2. WHEN el Docente tiene 2 o más sesiones, THE Sistema SHALL mostrar un gráfico de radar comparativo con múltiples años superpuestos
3. THE Sistema SHALL mostrar una tabla de evolución con las diferencias de puntaje por Dimensión
4. THE Sistema SHALL indicar visualmente si cada Dimensión mejoró (positivo) o retrocedió (negativo)
5. WHEN el Docente selecciona un año específico, THE Sistema SHALL mostrar los resultados detallados de ese año
6. THE Sistema SHALL mostrar el puntaje general (overall) de cada año en el histórico

### Requisito 8: Filtros por Año en Panel Admin

**User Story:** Como admin, quiero filtrar los resultados institucionales por año, para analizar el desempeño de mi institución en periodos específicos.

#### Criterios de Aceptación

1. WHEN un Admin accede al Panel_Admin, THE Sistema SHALL mostrar un selector de año en la parte superior
2. THE Sistema SHALL listar todos los años con sesiones completadas en la Institución
3. WHEN el Admin selecciona un año, THE Sistema SHALL filtrar todos los resultados por ese Año_Calendario
4. THE Sistema SHALL calcular métricas institucionales solo para el año seleccionado
5. THE Sistema SHALL mostrar: total de sesiones, puntaje promedio general y promedios por Dimensión
6. WHEN no hay sesiones para el año seleccionado, THE Sistema SHALL mostrar mensaje "No hay datos para este año"

### Requisito 9: Generación de PDF con Año

**User Story:** Como docente, quiero descargar mi diagnóstico en PDF, para tener un registro físico que incluya el año del diagnóstico.

#### Criterios de Aceptación

1. WHEN el Sistema genera un PDF de diagnóstico, THE Sistema SHALL incluir el Año_Calendario en el encabezado del documento
2. THE Sistema SHALL incluir el año en el nombre del archivo con formato `diagnostico-{nombre}-{year}.pdf`
3. THE Sistema SHALL mostrar el año junto a la fecha de completado en el PDF
4. THE Sistema SHALL incluir todos los resultados por Dimensión del año correspondiente

### Requisito 10: Métricas Institucionales por Año

**User Story:** Como admin, quiero ver métricas agregadas de mi institución por año, para evaluar el progreso institucional en el tiempo.

#### Criterios de Aceptación

1. WHEN un Admin solicita métricas de un año específico, THE Sistema SHALL calcular el total de sesiones completadas en ese año
2. THE Sistema SHALL calcular el puntaje promedio general de todas las sesiones del año
3. THE Sistema SHALL calcular el puntaje promedio por cada Dimensión del año
4. WHEN no hay sesiones en el año, THE Sistema SHALL retornar totales en cero
5. THE Sistema SHALL validar que todos los promedios calculados estén entre 0 y 100
6. THE Sistema SHALL usar índices de base de datos para optimizar el cálculo de métricas

### Requisito 11: Manejo de Errores de Sesión Duplicada

**User Story:** Como docente, quiero recibir un mensaje claro si intento completar el diagnóstico más de una vez en el mismo año, para entender por qué no puedo continuar.

#### Criterios de Aceptación

1. WHEN el Sistema detecta intento de sesión duplicada, THE Sistema SHALL retornar código HTTP 409 Conflict
2. THE Sistema SHALL incluir en la respuesta: mensaje descriptivo, código de error "DUPLICATE_SESSION" y año de la sesión existente
3. THE Sistema SHALL incluir el ID y fecha de completado de la sesión existente
4. WHEN la UI recibe error de sesión duplicada, THE Sistema SHALL mostrar mensaje "Ya completaste el diagnóstico de {year}"
5. THE Sistema SHALL deshabilitar el formulario de diagnóstico cuando ya existe sesión del año actual
6. THE Sistema SHALL ofrecer al Docente ver los resultados de su sesión existente

### Requisito 12: Validación de Año Válido

**User Story:** Como sistema, necesito validar que los años sean válidos, para prevenir datos inconsistentes.

#### Criterios de Aceptación

1. WHEN el Sistema recibe un valor de año, THE Sistema SHALL validar que sea un número entero
2. THE Sistema SHALL validar que el año sea mayor o igual a 2025
3. THE Sistema SHALL validar que el año sea menor o igual al año actual más 1
4. IF el año es inválido, THEN THE Sistema SHALL retornar error 400 Bad Request con mensaje descriptivo
5. THE Sistema SHALL aplicar check constraint en base de datos para garantizar `year >= 2025 AND year <= 2100`

### Requisito 13: Integridad Referencial de Sesiones

**User Story:** Como sistema, necesito garantizar integridad referencial, para que todas las sesiones estén vinculadas a instituciones y docentes válidos.

#### Criterios de Aceptación

1. THE Sistema SHALL garantizar mediante foreign key que toda sesión pertenezca a una Institución existente
2. THE Sistema SHALL garantizar mediante foreign key que toda sesión con `staff_id` pertenezca a un staff existente
3. THE Sistema SHALL garantizar mediante foreign key que toda sesión con `user_id` pertenezca a un user existente
4. THE Sistema SHALL validar que toda sesión tenga `staff_id` O `user_id` (al menos uno no nulo)
5. WHEN se elimina una Institución, THE Sistema SHALL prevenir la eliminación si tiene sesiones asociadas
6. WHEN se elimina un staff o user, THE Sistema SHALL manejar la eliminación según política de retención de datos

### Requisito 14: Atomicidad de Creación de Sesión

**User Story:** Como sistema, necesito garantizar que la creación de sesiones sea atómica, para evitar datos inconsistentes.

#### Criterios de Aceptación

1. WHEN el Sistema crea una sesión, THE Sistema SHALL usar una transacción de base de datos
2. THE Sistema SHALL insertar la sesión en `diagnostic_sessions` dentro de la transacción
3. THE Sistema SHALL insertar todas las respuestas en `diagnostic_answers` dentro de la misma transacción
4. IF cualquier inserción falla, THEN THE Sistema SHALL hacer rollback de toda la transacción
5. WHEN la transacción se completa exitosamente, THE Sistema SHALL hacer commit de todos los cambios
6. IF la transacción falla, THEN THE Sistema SHALL retornar error 500 con mensaje "Error al guardar el diagnóstico"
7. THE Sistema SHALL garantizar que no existan sesiones sin respuestas ni respuestas sin sesión

### Requisito 15: Autorización de Acceso a Histórico

**User Story:** Como docente, quiero que solo yo pueda ver mi histórico, para proteger mi privacidad.

#### Criterios de Aceptación

1. WHEN un Docente solicita un histórico, THE Sistema SHALL verificar que el Docente autenticado sea el propietario del histórico
2. WHEN un Admin solicita un histórico, THE Sistema SHALL verificar que el Admin pertenezca a la misma Institución
3. IF el usuario no está autorizado, THEN THE Sistema SHALL retornar error 403 Forbidden
4. THE Sistema SHALL validar autorización antes de ejecutar cualquier query de histórico
5. THE Sistema SHALL loggear intentos de acceso no autorizado para auditoría

### Requisito 16: Performance de Consultas por Año

**User Story:** Como usuario del sistema, quiero que las consultas sean rápidas, para tener una experiencia fluida.

#### Criterios de Aceptación

1. WHEN el Sistema ejecuta una query de validación de sesión existente, THE Sistema SHALL completarla en menos de 100ms (percentil 95)
2. WHEN el Sistema ejecuta una query de histórico, THE Sistema SHALL completarla en menos de 200ms (percentil 95)
3. WHEN el Sistema calcula métricas institucionales, THE Sistema SHALL usar índices para optimizar la consulta
4. THE Sistema SHALL usar índice en `(institution_id, staff_id, year)` para validaciones de unicidad
5. THE Sistema SHALL usar índice en `(staff_id, year)` para consultas de histórico
6. THE Sistema SHALL usar índice en `(institution_id, year)` para métricas institucionales

### Requisito 17: Migración de Datos Existentes

**User Story:** Como administrador del sistema, necesito migrar datos existentes al nuevo esquema, para preservar el histórico previo.

#### Criterios de Aceptación

1. WHEN se ejecuta la migración, THE Sistema SHALL agregar la columna `year` a la tabla `diagnostic_sessions`
2. THE Sistema SHALL asignar año 2025 a todas las sesiones existentes que no tengan año
3. THE Sistema SHALL hacer la columna `year` NOT NULL después de asignar valores
4. THE Sistema SHALL crear todos los índices especificados en el diseño
5. THE Sistema SHALL crear todos los constraints únicos sin fallar por datos existentes
6. WHEN la migración se completa, THE Sistema SHALL verificar que no existan sesiones con `year` NULL
7. THE Sistema SHALL ejecutar la migración de forma idempotente (puede ejecutarse múltiples veces sin error)

### Requisito 18: Prevención de Race Conditions

**User Story:** Como sistema, necesito prevenir race conditions, para garantizar que no se creen sesiones duplicadas en requests concurrentes.

#### Criterios de Aceptación

1. WHEN dos requests intentan crear sesión simultáneamente para el mismo Docente y año, THE Sistema SHALL permitir solo uno mediante constraint único
2. WHEN el constraint único falla, THE Sistema SHALL capturar el error de violación (código 23505 en PostgreSQL)
3. THE Sistema SHALL convertir el error de constraint en un error de negocio con código "DUPLICATE_SESSION"
4. THE Sistema SHALL retornar HTTP 409 Conflict con mensaje descriptivo
5. THE Sistema SHALL loggear el intento de duplicado para monitoreo

### Requisito 19: Aislamiento Multi-Tenant

**User Story:** Como institución, quiero que mis datos estén aislados de otras instituciones, para garantizar privacidad y seguridad.

#### Criterios de Aceptación

1. THE Sistema SHALL incluir `institution_id` en todas las queries de sesiones
2. WHEN un usuario consulta datos, THE Sistema SHALL filtrar por la Institución del usuario autenticado
3. THE Sistema SHALL validar que el usuario tenga acceso a la Institución antes de ejecutar queries
4. THE Sistema SHALL prevenir acceso cruzado entre instituciones mediante validación de permisos
5. THE Sistema SHALL usar índices compuestos que incluyan `institution_id` para optimizar filtrado por tenant

### Requisito 20: Cálculo de Puntajes por Dimensión

**User Story:** Como docente, quiero que mis respuestas se conviertan en puntajes por dimensión, para entender mi nivel en cada área.

#### Criterios de Aceptación

1. WHEN el Sistema calcula puntajes, THE Sistema SHALL agrupar las respuestas por Dimensión
2. THE Sistema SHALL sumar los puntos de las opciones seleccionadas para cada Dimensión
3. THE Sistema SHALL calcular el porcentaje de puntaje obtenido sobre el máximo posible por Dimensión
4. THE Sistema SHALL normalizar todos los puntajes a escala 0-100
5. THE Sistema SHALL calcular el puntaje general (overall) como promedio de las 5 dimensiones
6. THE Sistema SHALL validar que todos los puntajes calculados estén entre 0 y 100
7. THE Sistema SHALL almacenar los puntajes con precisión de 2 decimales

## Requisitos No Funcionales

### Requisito NF-1: Escalabilidad

**User Story:** Como administrador del sistema, necesito que el sistema escale, para soportar miles de instituciones.

#### Criterios de Aceptación

1. THE Sistema SHALL soportar al menos 10,000 sesiones por año por Institución sin degradación de performance
2. THE Sistema SHALL soportar al menos 1,000 instituciones activas simultáneamente
3. THE Sistema SHALL soportar consultas eficientes con históricos de 5+ años
4. THE Sistema SHALL usar paginación para históricos con más de 10 años de datos

### Requisito NF-2: Disponibilidad

**User Story:** Como usuario del sistema, necesito que el sistema esté disponible, para completar diagnósticos cuando lo necesite.

#### Criterios de Aceptación

1. THE Sistema SHALL mantener un uptime de al menos 99.9% mensual
2. WHEN ocurre un error de base de datos, THE Sistema SHALL reintentar la operación hasta 3 veces
3. THE Sistema SHALL tener manejo de errores robusto que prevenga crashes
4. THE Sistema SHALL loggear todos los errores para debugging y monitoreo

### Requisito NF-3: Seguridad

**User Story:** Como usuario del sistema, necesito que mis datos estén seguros, para proteger mi información personal.

#### Criterios de Aceptación

1. THE Sistema SHALL validar y sanitizar todos los inputs de usuario
2. THE Sistema SHALL usar prepared statements para prevenir SQL injection
3. THE Sistema SHALL implementar rate limiting en endpoints públicos (10 requests por 15 minutos en `/identify`)
4. THE Sistema SHALL implementar rate limiting estricto en endpoint de completar (3 requests por hora)
5. THE Sistema SHALL loggear intentos de acceso no autorizado
6. THE Sistema SHALL usar HTTPS para todas las comunicaciones

### Requisito NF-4: Mantenibilidad

**User Story:** Como desarrollador, necesito código mantenible, para facilitar futuras modificaciones.

#### Criterios de Aceptación

1. THE Sistema SHALL separar lógica de negocio en servicios reutilizables (YearService, ValidationService)
2. THE Sistema SHALL usar TypeScript con tipos estrictos para prevenir errores
3. THE Sistema SHALL tener cobertura de tests unitarios de al menos 80%
4. THE Sistema SHALL tener documentación de API actualizada
5. THE Sistema SHALL seguir principios SOLID y clean architecture

### Requisito NF-5: Observabilidad

**User Story:** Como administrador del sistema, necesito monitorear el sistema, para detectar y resolver problemas rápidamente.

#### Criterios de Aceptación

1. THE Sistema SHALL loggear todas las operaciones críticas (creación de sesión, validaciones, errores)
2. THE Sistema SHALL incluir en logs: timestamp, nivel, mensaje, contexto (institutionId, staffId, year)
3. THE Sistema SHALL exponer métricas de performance (response time, error rate)
4. THE Sistema SHALL alertar cuando el error rate supere 1%
5. THE Sistema SHALL mantener logs por al menos 30 días

### Requisito NF-6: Compatibilidad

**User Story:** Como usuario, necesito que el sistema funcione en diferentes dispositivos, para acceder desde cualquier lugar.

#### Criterios de Aceptación

1. THE Sistema SHALL funcionar en navegadores modernos (Chrome, Firefox, Safari, Edge últimas 2 versiones)
2. THE Sistema SHALL ser responsive y funcionar en dispositivos móviles
3. THE Sistema SHALL mantener compatibilidad con la versión actual de PostgreSQL (14+)
4. THE Sistema SHALL ser compatible con el runtime de Vercel Edge Functions

### Requisito NF-7: Usabilidad

**User Story:** Como docente, necesito una interfaz intuitiva, para completar el diagnóstico sin confusión.

#### Criterios de Aceptación

1. WHEN el Sistema bloquea un diagnóstico por duplicado, THE Sistema SHALL mostrar mensaje claro con el año
2. THE Sistema SHALL mostrar el año actual prominentemente en la interfaz del quiz
3. THE Sistema SHALL usar lenguaje claro y no técnico en mensajes de error
4. THE Sistema SHALL proporcionar feedback visual inmediato en todas las acciones
5. THE Sistema SHALL seguir principios de accesibilidad WCAG 2.1 nivel AA

### Requisito NF-8: Performance de UI

**User Story:** Como usuario, necesito una interfaz rápida, para no esperar en cada interacción.

#### Criterios de Aceptación

1. THE Sistema SHALL cargar la página de identificación en menos de 2 segundos
2. THE Sistema SHALL mostrar feedback de loading durante operaciones asíncronas
3. THE Sistema SHALL usar optimistic updates donde sea apropiado
4. THE Sistema SHALL cachear el año actual para evitar cálculos repetidos
5. THE Sistema SHALL lazy-load componentes pesados (gráficos, tablas grandes)
