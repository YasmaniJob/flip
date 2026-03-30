# Plan de Implementación: Diagnóstico de Habilidades Digitales

> **Nota:** Este módulo requiere implementarse en el orden exacto indicado. Cada fase es prerequisito de la siguiente.

---

## FASE 1 — Base de Datos y Seed (Backend Foundation)

**Objetivo:** Crear las tablas y cargar el contenido base oficial (MINEDU).

### Tablas a crear en `schema.ts`

| Tabla | Propósito |
|---|---|
| `diagnostic_categories` | Dimensiones del diagnóstico (Manejo de info, IA, etc.) |
| `diagnostic_questions` | Preguntas por dimensión (editables por institución) |
| `diagnostic_sessions` | Una sesión por docente (progreso, estado "pendiente/completado") |
| `diagnostic_responses` | Respuestas individuales de cada docente (score 0-3) |

**Regla clave:** `institution_id = NULL` → pregunta/categoría estándar de Flip. `institution_id = X` → personalización de ese colegio.

### Campos clave de `institutions` a añadir (JSONB `settings` o propios)
- Toggle: `diagnostic_enabled` (activa/desactiva el módulo)
- Toggle: `diagnostic_requires_approval` (docentes nuevos quedan "Pendientes")

### Seed inicial
Cargar las **5 dimensiones** y **23 preguntas base** redactadas en primera persona con tono pedagógico-normativo.

---

## FASE 2 — API Layer (Endpoints)

### Endpoints Públicos (sin autenticación requerida para acceder)
- `GET  /api/diagnostic/[slug]` → Devuelve configuración y preguntas activas de la institución.
- `POST /api/diagnostic/[slug]/identify` → Recibe DNI/Correo, devuelve token de sesión.
- `GET  /api/diagnostic/[slug]/session/[token]` → Retoma progreso guardado.
- `POST /api/diagnostic/[slug]/response` → Guarda la respuesta actual (upsert).
- `POST /api/diagnostic/[slug]/complete` → Finaliza la sesión y calcula scores.

### Endpoints Privados (Administrador)
- `GET/PATCH /api/institutions/[id]/diagnostic/config` → Config del módulo.
- `POST/PATCH /api/institutions/[id]/diagnostic/questions` → CRUD de preguntas personalizadas.
- `GET /api/institutions/[id]/diagnostic/pending` → Lista de docentes no registrados.
- `POST /api/institutions/[id]/diagnostic/approve/[sessionId]` → Convierte la sesión pendiente en un Staff oficial de la I.E.

---

## FASE 3 — UI Pública: El Quiz Gamificado

**Ruta sugerida:** Componente independiente accesible por `flip.org.pe/ie/[slug]`

### Flujo de Pantallas
1. **Landing:** Título "Diagnóstico de Habilidades Digitales 2025" con efecto typewriter.
2. **Identificación:** "Para guardar tus resultados, ingresa DNI, Nombres y Correo". (Verifica si retoma, es nuevo o es existente).
3. **El Quiz (Carrusel de Tarjetas):**
   - Pregunta grande. Cuatro opciones visuales tipo botones.
   - 🌑 No sé hacerlo | 🤝 Puedo con ayuda | ⚡ Puedo solo | 🌟 Puedo y oriento a otros
   - Barra de progreso dinámica. Animaciones de transición. Sin botón de "Siguiente" (auto-slide al responder).
4. **Pantalla Final:**
   - Gráfico de Telaraña (Radar chart) con el desempeño.
   - Nivel alcanzado (Explorador Digital, Competente, Mentor).
   - Botón CTA para "Continuar en Flip".

---

## FASE 4 — UI Privada: Panel del Administrador (Director/PIP)

**Ruta:** `apps/web/src/app/(dashboard)/settings/diagnostico/`

### Secciones
1. **Pestaña Configuración:** Activar/desactivar el enlace institucional. Toggle de aprobación.
2. **Pestaña Cuestionario:** Vista de las dimensiones estilo **Jira Flat**. Switches ON/OFF para apagar una pregunta o agregar nuevas a la base estándar de la I.E.
3. **Pestaña Pendientes:** Tabla con los docentes que completaron el test pero no estaban en el Staff. Botón de "Aprobar y crear acceso".
4. **Pestaña Resultados:** Dashboard con promedio general y desglose por dimensión.

---

## FASE 5 — Integración con Dashboard del Docente (Logueado)

**Ruta:** `apps/web/src/app/(dashboard)/`

- Banner "Flash" en la página principal: *"Tienes pendiente tu Diagnóstico de Habilidades 2025. ¡Completa tu perfil ahora!"*
- Al darle clic, abre el mismo Quiz de la Fase 3, pero **saltea el paso 2 (Identificación)** porque el docente ya es conocido.

---

## Algoritmo de Score (Calificación)

**Valores base:**
| Selección | Puntos |
|---|---|
| No sé hacerlo | 0 |
| Puedo hacerlo con ayuda | 1 |
| Puedo hacerlo solo | 2 |
| Puedo hacerlo y orientar a otros | 3 |

**Score por Dimsión (%):** `(pts obtenidos / pts máximos) * 100`

**Nivel General:**
- **0 – 30%** → Inicio (🌑 Explorador)
- **31 – 60%** → Proceso (🤝 En Desarrollo)
- **61 – 85%** → Logrado (⚡ Competente)
- **86 – 100%** → Destacado (🌟 Mentor Digital)

---

## Orden de Entrega (Checklist Sugerido)
- [ ] Semana 1: Arquitectura de base de datos (Schema) e Ingestión de datos base (Seeding).
- [ ] Semana 2: APIs (Backend). Rutas de lógica sin diseño de interfaz. 
- [ ] Semana 3: Experiencia Pública "Gamificada" (El Quiz y su lógica de estado).
- [ ] Semana 4: Panel Administrativo y métricas finales.
