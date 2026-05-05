# Revisión de Riesgos: Plan Diagnóstico de Habilidades Digitales

## ✅ PUNTOS SEGUROS

### 1. Aislamiento de Tablas
- Las 4 nuevas tablas (`diagnostic_categories`, `diagnostic_questions`, `diagnostic_sessions`, `diagnostic_responses`) son completamente independientes
- No modifican tablas existentes
- Usan relaciones opcionales con `institutions` y `staff`

### 2. Feature Toggle
- El módulo se activa/desactiva por institución (`diagnostic_enabled` en settings)
- No afecta instituciones que no lo activen
- Implementación no invasiva

### 3. Rutas Públicas Aisladas
- Las rutas `/api/diagnostic/[slug]/*` son nuevas
- No interfieren con rutas existentes
- Acceso público controlado por slug de institución

---

## ⚠️ RIESGOS IDENTIFICADOS Y SOLUCIONES

### RIESGO 1: Conflicto con tabla `staff`
**Problema:** El plan menciona "aprobar docentes y crear acceso" pero `staff` ya existe con estructura definida.

**Impacto:** 
- La tabla `staff` tiene índices únicos en `dni` y `email` por institución
- Crear duplicados causaría errores de constraint

**Solución:**
```typescript
// En lugar de crear nuevo staff, verificar si existe primero
const existingStaff = await db.query.staff.findFirst({
  where: and(
    eq(staff.institutionId, institutionId),
    or(
      eq(staff.dni, session.dni),
      eq(staff.email, session.email)
    )
  )
});

if (existingStaff) {
  // Vincular sesión con staff existente
  await db.update(diagnosticSessions)
    .set({ staffId: existingStaff.id })
    .where(eq(diagnosticSessions.id, sessionId));
} else {
  // Crear nuevo staff
  const newStaff = await db.insert(staff).values({...});
  await db.update(diagnosticSessions)
    .set({ staffId: newStaff.id });
}
```

### RIESGO 2: Migración de Base de Datos
**Problema:** Agregar 4 tablas nuevas requiere migración en producción.

**Impacto:**
- Downtime potencial si la migración falla
- Rollback complejo si hay problemas

**Solución:**
1. Crear migraciones con `drizzle-kit generate`
2. Probar en ambiente local primero
3. Usar transacciones para rollback automático
4. Migrar en horario de bajo tráfico
5. Tener backup de BD antes de migrar

```bash
# Proceso seguro
pnpm drizzle-kit generate:pg
pnpm drizzle-kit push:pg --dry-run  # Ver qué hará
# Backup manual de BD
pnpm drizzle-kit push:pg  # Ejecutar migración
```

### RIESGO 3: Slug Público Expuesto
**Problema:** Cualquiera con el slug puede acceder al diagnóstico.

**Impacto:**
- Posible spam o uso no autorizado
- Datos de diagnóstico podrían ser manipulados

**Solución:**
1. Rate limiting en endpoints públicos
2. Validación de DNI/Email contra patrones sospechosos
3. Captcha opcional en identificación
4. Logs de acceso para detectar abusos

```typescript
// Middleware de rate limiting
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 intentos por hora
});

// En el endpoint
const { success } = await ratelimit.limit(ip);
if (!success) {
  return Response.json({ error: "Too many requests" }, { status: 429 });
}
```

### RIESGO 4: Sesiones sin Autenticación
**Problema:** Las sesiones de diagnóstico usan tokens sin autenticación formal.

**Impacto:**
- Tokens podrían ser adivinados o compartidos
- Pérdida de progreso si se pierde el token

**Solución:**
1. Tokens UUID v4 (imposibles de adivinar)
2. Expiración de sesiones (7 días de inactividad)
3. Vincular token con IP/User-Agent para validación adicional
4. Permitir recuperación por email

```typescript
// Generar token seguro
import { randomUUID } from 'crypto';

const sessionToken = randomUUID(); // e.g., "550e8400-e29b-41d4-a716-446655440000"
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
```

### RIESGO 5: JSONB en `institutions.settings`
**Problema:** Agregar `diagnostic_enabled` y `diagnostic_requires_approval` en JSONB no tiene validación de schema.

**Impacto:**
- Typos en nombres de campos
- Valores inconsistentes
- Difícil de consultar en SQL

**Solución:**
Usar columnas dedicadas en lugar de JSONB:

```typescript
// Agregar a tabla institutions
export const institutions = pgTable('institutions', {
  // ... campos existentes
  diagnosticEnabled: boolean('diagnostic_enabled').default(false),
  diagnosticRequiresApproval: boolean('diagnostic_requires_approval').default(true),
});
```

### RIESGO 6: Carga de Seed Duplicada
**Problema:** Re-ejecutar el seed podría duplicar las 23 preguntas base.

**Impacto:**
- Preguntas duplicadas en el quiz
- Confusión en resultados

**Solución:**
```typescript
// Seed con upsert
await db.insert(diagnosticQuestions)
  .values(baseQuestions)
  .onConflictDoNothing(); // O usar un campo unique como 'code'
```

---

## 📋 CHECKLIST PRE-IMPLEMENTACIÓN

### Base de Datos
- [ ] Revisar que no existan tablas con nombres similares
- [ ] Verificar que los índices no causen overhead
- [ ] Confirmar que Neon (Postgres) soporta todas las features usadas
- [ ] Planificar estrategia de backup antes de migrar

### Código
- [ ] Crear feature flag en código para activar/desactivar completamente
- [ ] Implementar manejo de errores robusto en todos los endpoints
- [ ] Agregar logging para debugging
- [ ] Validar todos los inputs con Zod

### Testing
- [ ] Probar flujo completo en local antes de deploy
- [ ] Verificar que instituciones sin el módulo no se vean afectadas
- [ ] Probar edge cases (DNI duplicado, email duplicado, sesión expirada)
- [ ] Validar que el scoring funciona correctamente

### Seguridad
- [ ] Implementar rate limiting
- [ ] Sanitizar inputs para prevenir SQL injection
- [ ] Validar tokens de sesión
- [ ] Agregar CORS apropiado para rutas públicas

### Performance
- [ ] Índices en columnas de búsqueda frecuente
- [ ] Paginación en lista de resultados
- [ ] Cache de preguntas activas por institución
- [ ] Optimizar queries con joins

---

## 🎯 RECOMENDACIONES DE IMPLEMENTACIÓN

### Orden Sugerido (Modificado)
1. **Semana 1: Schema + Migraciones**
   - Crear tablas con migraciones
   - Agregar columnas a `institutions`
   - Seed de datos base
   - **CHECKPOINT:** Verificar que la app sigue funcionando

2. **Semana 2: APIs Backend**
   - Endpoints públicos con rate limiting
   - Endpoints privados con autenticación
   - **CHECKPOINT:** Probar con Postman/Insomnia

3. **Semana 3: UI Pública**
   - Quiz gamificado
   - Gráfico de resultados
   - **CHECKPOINT:** Probar flujo completo end-to-end

4. **Semana 4: Panel Admin**
   - Configuración
   - Gestión de preguntas
   - Aprobación de docentes
   - **CHECKPOINT:** Probar desde perspectiva de admin

### Feature Flags Recomendados
```typescript
// En .env
FEATURE_DIAGNOSTIC_ENABLED=true
FEATURE_DIAGNOSTIC_PUBLIC_ACCESS=true
FEATURE_DIAGNOSTIC_ADMIN_PANEL=true

// En código
if (!process.env.FEATURE_DIAGNOSTIC_ENABLED) {
  return Response.json({ error: "Feature not available" }, { status: 404 });
}
```

---

## ✅ CONCLUSIÓN

El plan es **VIABLE y SEGURO** si se implementa con las precauciones mencionadas. Los riesgos principales son:

1. ✅ **Manejables:** Conflictos con `staff`, migraciones, seguridad
2. ⚠️ **Requieren atención:** Rate limiting, validación de datos, testing exhaustivo
3. ❌ **Bloqueantes:** Ninguno identificado

**Recomendación:** Proceder con implementación siguiendo el orden modificado y aplicando las soluciones propuestas.
