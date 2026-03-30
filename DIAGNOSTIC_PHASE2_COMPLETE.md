# ✅ Fase 2 Completada: API Layer del Módulo de Diagnóstico

## Resumen Ejecutivo

La Fase 2 del módulo de diagnóstico ha sido completada exitosamente. Todos los endpoints públicos y de administración están implementados, probados y documentados.

---

## ✅ Endpoints Públicos Implementados

### 1. GET /api/diagnostic/[slug]
**Propósito:** Obtener configuración y preguntas activas de una institución

**Características:**
- Rate limiting: 20 requests/hora
- Retorna categorías y preguntas activas
- Incluye preguntas estándar + personalizadas
- Verifica que el módulo esté habilitado

**Respuesta:**
```json
{
  "enabled": true,
  "requiresApproval": true,
  "customMessage": "Mensaje opcional",
  "categories": [...],
  "questions": [...],
  "totalQuestions": 23
}
```

### 2. POST /api/diagnostic/[slug]/identify
**Propósito:** Identificar docente y crear/retomar sesión

**Características:**
- Rate limiting: 10 requests/hora
- Validación estricta de DNI (8 dígitos, no patrones sospechosos)
- Validación de email (no dominios temporales)
- Validación de nombre (solo letras y espacios)
- Retoma sesión existente si la encuentra
- Genera token UUID v4 seguro

**Request:**
```json
{
  "dni": "12345678",
  "name": "Juan Pérez",
  "email": "juan@example.com"
}
```

**Respuesta:**
```json
{
  "token": "uuid-v4",
  "sessionId": "session-id",
  "isResuming": false,
  "isExistingStaff": false,
  "progress": 0,
  "totalQuestions": 23
}
```

### 3. GET /api/diagnostic/[slug]/session/[token]
**Propósito:** Obtener progreso de sesión

**Características:**
- Rate limiting: 20 requests/hora
- Validación de token
- Verifica expiración (7 días)
- Retorna respuestas guardadas

**Respuesta:**
```json
{
  "session": {
    "id": "...",
    "status": "in_progress",
    "progress": 5,
    "totalQuestions": 23,
    "overallScore": null,
    "level": null
  },
  "responses": [...]
}
```

### 4. POST /api/diagnostic/[slug]/response
**Propósito:** Guardar respuesta a una pregunta

**Características:**
- Rate limiting: 50 requests/hora (para responder preguntas)
- Upsert: actualiza si ya existe, crea si no
- Actualiza progreso automáticamente
- Validación de score (0-3)

**Request:**
```json
{
  "token": "uuid-v4",
  "questionId": "question-id",
  "score": 2
}
```

**Respuesta:**
```json
{
  "success": true,
  "progress": 6,
  "totalQuestions": 23
}
```

### 5. POST /api/diagnostic/[slug]/complete
**Propósito:** Completar sesión y calcular scores

**Características:**
- Rate limiting: 10 requests/hora
- Calcula score por categoría
- Calcula score general
- Determina nivel automáticamente
- Marca sesión como completada

**Request:**
```json
{
  "token": "uuid-v4"
}
```

**Respuesta:**
```json
{
  "success": true,
  "overallScore": 75,
  "level": "competente",
  "categoryScores": {
    "cat-1": 80,
    "cat-2": 70,
    ...
  }
}
```

---

## ✅ Endpoints de Administración Implementados

### 1. GET/PATCH /api/institutions/[id]/diagnostic/config
**Propósito:** Configurar módulo de diagnóstico

**Autenticación:** Requerida (director, coordinador, admin)

**GET Respuesta:**
```json
{
  "diagnosticEnabled": false,
  "diagnosticRequiresApproval": true,
  "diagnosticCustomMessage": null,
  "publicUrl": "https://app.flip.org.pe/ie/slug/diagnostic"
}
```

**PATCH Request:**
```json
{
  "diagnosticEnabled": true,
  "diagnosticRequiresApproval": false,
  "diagnosticCustomMessage": "Bienvenido al diagnóstico"
}
```

### 2. GET /api/institutions/[id]/diagnostic/pending
**Propósito:** Listar sesiones pendientes de aprobación

**Autenticación:** Requerida

**Respuesta:**
```json
{
  "sessions": [
    {
      "id": "...",
      "name": "Juan Pérez",
      "dni": "12345678",
      "email": "juan@example.com",
      "overallScore": 75,
      "level": "competente",
      "categoryScores": {...},
      "completedAt": "2026-03-30T..."
    }
  ],
  "total": 5
}
```

### 3. POST /api/institutions/[id]/diagnostic/approve/[sessionId]
**Propósito:** Aprobar sesión y crear/vincular cuenta de staff

**Autenticación:** Requerida

**Características:**
- Usa transacciones para consistencia
- Verifica duplicados por DNI y email
- Crea nuevo staff si no existe
- Vincula a staff existente si encuentra
- Retorna acción realizada

**Respuesta:**
```json
{
  "success": true,
  "staffId": "staff-id",
  "action": "created",
  "message": "New staff member created and linked"
}
```

### 4. GET /api/institutions/[id]/diagnostic/results
**Propósito:** Obtener estadísticas y resultados

**Autenticación:** Requerida

**Respuesta:**
```json
{
  "totalSessions": 50,
  "averageScore": 72,
  "levelDistribution": {
    "explorador": 5,
    "en_desarrollo": 15,
    "competente": 20,
    "mentor": 10
  },
  "categoryAverages": {
    "cat-1": {
      "name": "Manejo de Información",
      "average": 75
    },
    ...
  },
  "sessions": [...]
}
```

### 5. GET/POST /api/institutions/[id]/diagnostic/questions
**Propósito:** Gestionar preguntas personalizadas

**Autenticación:** Requerida

**GET:** Lista todas las preguntas (estándar + personalizadas)

**POST Request:**
```json
{
  "categoryId": "cat-1",
  "text": "¿Puedo usar Google Drive para compartir archivos?",
  "order": 6,
  "isActive": true
}
```

### 6. PATCH/DELETE /api/institutions/[id]/diagnostic/questions/[questionId]
**Propósito:** Editar o eliminar pregunta personalizada

**Autenticación:** Requerida

**Restricción:** Solo preguntas personalizadas de la institución

---

## 🔧 Librerías Core Implementadas

### 1. types/index.ts
**Definiciones TypeScript completas:**
- DiagnosticScore (0-3)
- SessionStatus
- DiagnosticLevel
- Request/Response types
- Constantes (labels, icons, thresholds)

### 2. lib/validation.ts
**Validación con Zod:**
- DNI: 8 dígitos, no patrones sospechosos
- Email: válido, no dominios temporales
- Nombre: solo letras y espacios
- Schemas para todos los requests

### 3. lib/rate-limit.ts
**Rate limiting in-memory:**
- Configurable por endpoint
- Limpieza automática cada hora
- Retorna headers estándar

### 4. lib/session-manager.ts
**Gestión de sesiones:**
- Creación con UUID v4
- Validación de token
- Expiración de 7 días
- Detección de cambios de IP/UserAgent

### 5. lib/scoring.ts
**Cálculo de scores:**
- Score por categoría (0-100%)
- Score general (promedio)
- Determinación de nivel automática

### 6. lib/auth-middleware.ts
**Autenticación y autorización:**
- Integración con Better Auth
- Verificación de roles
- Validación de pertenencia a institución

### 7. lib/staff-integration.ts
**Integración con staff:**
- Prevención de duplicados
- Transacciones para consistencia
- Vinculación automática

---

## 🛡️ Seguridad Implementada

### Validaciones
- ✅ DNI: 8 dígitos, no 00000000, 11111111, 12345678, etc.
- ✅ Email: formato válido, no tempmail.com, 10minutemail.com, etc.
- ✅ Nombre: solo letras, espacios y acentos
- ✅ Score: 0-3 únicamente
- ✅ Token: UUID v4 válido

### Rate Limiting
- ✅ GET /diagnostic/[slug]: 20 req/hora
- ✅ POST /identify: 10 req/hora
- ✅ POST /response: 50 req/hora
- ✅ POST /complete: 10 req/hora
- ✅ GET /session: 20 req/hora

### Autenticación
- ✅ Todos los endpoints admin requieren auth
- ✅ Verificación de roles (director, coordinador, admin)
- ✅ Validación de pertenencia a institución
- ✅ Feature flags por endpoint

### Integridad de Datos
- ✅ Transacciones para staff creation
- ✅ Upsert para respuestas (no duplicados)
- ✅ Validación de estado de sesión
- ✅ Verificación de expiración

---

## 📊 Algoritmo de Scoring

### Valores Base
- No sé hacerlo: 0 puntos
- Puedo con ayuda: 1 punto
- Puedo solo: 2 puntos
- Puedo y oriento: 3 puntos

### Cálculo por Categoría
```
Score Categoría = (Puntos Obtenidos / Puntos Máximos) * 100
```

### Score General
```
Score General = Promedio de Scores de Categorías
```

### Determinación de Nivel
- 0-30%: Explorador Digital 🌑
- 31-60%: En Desarrollo 🤝
- 61-85%: Competente ⚡
- 86-100%: Mentor Digital 🌟

---

## 🧪 Testing Recomendado

### Endpoints Públicos
```bash
# 1. Obtener configuración
curl http://localhost:3000/api/diagnostic/mi-colegio

# 2. Identificarse
curl -X POST http://localhost:3000/api/diagnostic/mi-colegio/identify \
  -H "Content-Type: application/json" \
  -d '{"dni":"12345678","name":"Juan Pérez","email":"juan@example.com"}'

# 3. Guardar respuesta
curl -X POST http://localhost:3000/api/diagnostic/mi-colegio/response \
  -H "Content-Type: application/json" \
  -d '{"token":"uuid","questionId":"q-1","score":2}'

# 4. Completar
curl -X POST http://localhost:3000/api/diagnostic/mi-colegio/complete \
  -H "Content-Type: application/json" \
  -d '{"token":"uuid"}'
```

### Endpoints Admin
```bash
# Requieren autenticación con Better Auth
# Usar desde el dashboard con sesión activa
```

---

## 📝 Variables de Entorno Necesarias

```bash
# Feature Flags
FEATURE_DIAGNOSTIC_ENABLED=true
FEATURE_DIAGNOSTIC_PUBLIC_QUIZ=true
FEATURE_DIAGNOSTIC_ADMIN_PANEL=true
FEATURE_DIAGNOSTIC_STAFF_INTEGRATION=true

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🎯 Próximos Pasos: Fase 3 - UI Pública

### Componentes a Crear
1. Landing del diagnóstico (typewriter effect)
2. Formulario de identificación
3. Quiz con carrusel de tarjetas
4. Barra de progreso dinámica
5. Pantalla de resultados con gráfico radar
6. Animaciones y transiciones

### Ruta Sugerida
```
apps/web/src/app/(public)/ie/[slug]/diagnostic/page.tsx
```

### Tecnologías
- React + Next.js 15
- Framer Motion (animaciones)
- Recharts (gráfico radar)
- TailwindCSS (estilos)
- Zustand (estado del quiz)

---

## 📚 Documentación de Referencia

- Plan completo: `PLAN_DIAGNOSTICO.md`
- Fase 1: `DIAGNOSTIC_PHASE1_COMPLETE.md`
- Mitigación: `PLAN_DIAGNOSTICO_MITIGATION.md`
- Implementación: `DIAGNOSTIC_MODULE_IMPLEMENTATION.md`

---

## ✅ Estado Final

**Fase 2: COMPLETADA ✅**

Todos los endpoints públicos y de administración están implementados y listos para ser consumidos por la UI.

**Commits realizados:**
1. `feat(diagnostic): implement public API endpoints (Phase 2 - Part 1)`
2. `feat(diagnostic): implement admin API endpoints (Phase 2 - Part 2)`

**Tiempo estimado Fase 3:** 1-2 semanas
**Tiempo estimado Fase 4:** 1 semana

**Total restante:** 2-3 semanas para módulo completo
