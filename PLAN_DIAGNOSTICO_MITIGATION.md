# Plan de Mitigación de Riesgos - Diagnóstico de Habilidades Digitales

## 🛡️ ESTRATEGIA GENERAL: Implementación Incremental con Rollback

### Principio: "Feature Flags + Branch Strategy"
- Cada fase se desarrolla en una rama separada
- Feature flags permiten activar/desactivar sin redeploy
- Rollback inmediato si algo falla

---

## 📦 FASE 0: Preparación (ANTES de escribir código)

### 1. Backup de Base de Datos
```bash
# Crear backup completo de Neon
# Desde el dashboard de Neon o CLI
neon db backup create --project-id <tu-project-id>

# Guardar el backup ID para rollback rápido
echo "BACKUP_ID=<backup-id>" >> .env.backup
```

### 2. Feature Flags en Variables de Entorno
```bash
# .env.local y .env.production
FEATURE_DIAGNOSTIC_ENABLED=false           # Master switch
FEATURE_DIAGNOSTIC_PUBLIC_QUIZ=false       # Quiz público
FEATURE_DIAGNOSTIC_ADMIN_PANEL=false       # Panel admin
FEATURE_DIAGNOSTIC_STAFF_INTEGRATION=false # Integración con staff
```

### 3. Crear Rama de Desarrollo
```bash
git checkout -b feature/diagnostic-module
git push -u origin feature/diagnostic-module
```

### 4. Configurar Vercel Preview
- Crear preview deployment para la rama
- Probar en preview antes de merge a master
- Variables de entorno separadas para preview

---

## 🔒 MITIGACIÓN POR RIESGO

### RIESGO 1: Conflicto con tabla `staff`

**Mitigación Técnica:**
```typescript
// apps/web/src/features/diagnostic/lib/staff-integration.ts

import { db } from '@/lib/db';
import { staff, diagnosticSessions } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

export async function approveAndCreateStaff(sessionId: string) {
  return await db.transaction(async (tx) => {
    // 1. Obtener sesión
    const session = await tx.query.diagnosticSessions.findFirst({
      where: eq(diagnosticSessions.id, sessionId)
    });
    
    if (!session) throw new Error('Session not found');
    
    // 2. VERIFICAR si ya existe staff con mismo DNI o email
    const existingStaff = await tx.query.staff.findFirst({
      where: and(
        eq(staff.institutionId, session.institutionId),
        or(
          session.dni ? eq(staff.dni, session.dni) : undefined,
          session.email ? eq(staff.email, session.email) : undefined
        )
      )
    });
    
    if (existingStaff) {
      // 3a. Ya existe → Solo vincular
      await tx.update(diagnosticSessions)
        .set({ 
          staffId: existingStaff.id,
          status: 'approved'
        })
        .where(eq(diagnosticSessions.id, sessionId));
      
      return { 
        success: true, 
        staffId: existingStaff.id,
        action: 'linked' 
      };
    }
    
    // 3b. No existe → Crear nuevo
    const [newStaff] = await tx.insert(staff)
      .values({
        id: crypto.randomUUID(),
        institutionId: session.institutionId,
        name: session.name,
        dni: session.dni,
        email: session.email,
        role: 'docente',
        status: 'active'
      })
      .returning();
    
    // 4. Vincular sesión con nuevo staff
    await tx.update(diagnosticSessions)
      .set({ 
        staffId: newStaff.id,
        status: 'approved'
      })
      .where(eq(diagnosticSessions.id, sessionId));
    
    return { 
      success: true, 
      staffId: newStaff.id,
      action: 'created' 
    };
  });
}
```

**Mitigación Operacional:**
- Probar con datos de prueba primero
- Validar que no hay duplicados antes de aprobar
- Log de todas las operaciones de creación/vinculación

---

### RIESGO 2: Migración de Base de Datos

**Mitigación Técnica:**

**Paso 1: Generar migración con dry-run**
```bash
# Generar SQL de migración
pnpm drizzle-kit generate:pg

# Ver qué SQL se ejecutará (NO ejecuta)
pnpm drizzle-kit push:pg --dry-run
```

**Paso 2: Revisar SQL generado**
```sql
-- Verificar que el SQL sea correcto
-- Buscar en drizzle/migrations/XXXX_*.sql

-- Debe contener:
CREATE TABLE IF NOT EXISTS "diagnostic_categories" (...);
CREATE TABLE IF NOT EXISTS "diagnostic_questions" (...);
CREATE TABLE IF NOT EXISTS "diagnostic_sessions" (...);
CREATE TABLE IF NOT EXISTS "diagnostic_responses" (...);

-- Y NO debe contener:
DROP TABLE ...  -- ❌ Peligroso
ALTER TABLE ... DROP COLUMN ...  -- ❌ Peligroso
```

**Paso 3: Migración segura con transacción**
```typescript
// apps/web/scripts/migrate-diagnostic-safe.ts

import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';

async function safeMigrate() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  try {
    console.log('🚀 Starting migration...');
    
    // Migrar con transacción automática
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Migration successful');
    
    // Verificar que las tablas existen
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE 'diagnostic_%'
    `;
    
    console.log('📋 Created tables:', result);
    
    if (result.length !== 4) {
      throw new Error('Not all tables were created');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('🔄 Rolling back...');
    // Neon automáticamente hace rollback en transacciones fallidas
    process.exit(1);
  }
}

safeMigrate();
```

**Paso 4: Script de rollback manual**
```typescript
// apps/web/scripts/rollback-diagnostic.ts

import { neon } from '@neondatabase/serverless';

async function rollback() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log('⚠️  Rolling back diagnostic tables...');
  
  // Eliminar en orden inverso (por foreign keys)
  await sql`DROP TABLE IF EXISTS diagnostic_responses CASCADE`;
  await sql`DROP TABLE IF EXISTS diagnostic_sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS diagnostic_questions CASCADE`;
  await sql`DROP TABLE IF EXISTS diagnostic_categories CASCADE`;
  
  console.log('✅ Rollback complete');
}

rollback();
```

**Mitigación Operacional:**
- Ejecutar migración en horario de bajo tráfico (madrugada)
- Tener el script de rollback listo
- Monitorear logs durante 30 minutos post-migración
- Comunicar a usuarios sobre mantenimiento programado

---

### RIESGO 3: Slug Público Expuesto

**Mitigación Técnica:**

**Opción A: Rate Limiting con Upstash Redis**
```typescript
// apps/web/src/lib/rate-limit.ts

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const diagnosticRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 intentos por hora
  analytics: true,
  prefix: "diagnostic",
});

// Uso en API route
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  const { success, limit, remaining, reset } = await diagnosticRateLimit.limit(ip);
  
  if (!success) {
    return Response.json(
      { error: 'Too many requests. Try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    );
  }
  
  // Continuar con lógica normal
}
```

**Opción B: Rate Limiting Simple (sin Redis)**
```typescript
// apps/web/src/lib/simple-rate-limit.ts

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function simpleRateLimit(ip: string, maxRequests = 10, windowMs = 3600000) {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }
  
  record.count++;
  return { success: true, remaining: maxRequests - record.count };
}

// Limpiar registros viejos cada hora
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetAt) {
      requestCounts.delete(ip);
    }
  }
}, 3600000);
```

**Validación de Datos**
```typescript
// apps/web/src/features/diagnostic/lib/validation.ts

import { z } from 'zod';

export const identifySchema = z.object({
  dni: z.string()
    .regex(/^\d{8}$/, 'DNI debe tener 8 dígitos')
    .refine(dni => {
      // Validar que no sea un patrón sospechoso
      const suspicious = ['00000000', '11111111', '12345678'];
      return !suspicious.includes(dni);
    }, 'DNI inválido'),
  
  name: z.string()
    .min(3, 'Nombre muy corto')
    .max(100, 'Nombre muy largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Nombre solo debe contener letras'),
  
  email: z.string()
    .email('Email inválido')
    .refine(email => {
      // Bloquear emails temporales conocidos
      const tempDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
      const domain = email.split('@')[1];
      return !tempDomains.includes(domain);
    }, 'Email temporal no permitido'),
});
```

**Mitigación Operacional:**
- Monitorear logs de acceso diariamente
- Alertas automáticas si hay >100 requests de misma IP
- Blacklist manual de IPs abusivas

---

### RIESGO 4: Sesiones sin Autenticación

**Mitigación Técnica:**
```typescript
// apps/web/src/features/diagnostic/lib/session-manager.ts

import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { diagnosticSessions } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function createSecureSession(data: {
  institutionId: string;
  name: string;
  dni: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const token = randomUUID(); // UUID v4 seguro
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
  
  const [session] = await db.insert(diagnosticSessions)
    .values({
      id: crypto.randomUUID(),
      token,
      institutionId: data.institutionId,
      name: data.name,
      dni: data.dni,
      email: data.email,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt,
      status: 'in_progress',
    })
    .returning();
  
  return { session, token };
}

export async function validateSession(token: string, ipAddress?: string, userAgent?: string) {
  const session = await db.query.diagnosticSessions.findFirst({
    where: and(
      eq(diagnosticSessions.token, token),
      gt(diagnosticSessions.expiresAt, new Date()) // No expirada
    )
  });
  
  if (!session) {
    return { valid: false, reason: 'Session not found or expired' };
  }
  
  // Validación adicional de IP/UserAgent (opcional, puede ser estricto)
  const ipChanged = ipAddress && session.ipAddress && ipAddress !== session.ipAddress;
  const uaChanged = userAgent && session.userAgent && userAgent !== session.userAgent;
  
  if (ipChanged || uaChanged) {
    console.warn('Session security warning:', { token, ipChanged, uaChanged });
    // Decidir si rechazar o solo loggear
  }
  
  return { valid: true, session };
}

// Recuperación por email
export async function sendRecoveryEmail(email: string, institutionSlug: string) {
  const sessions = await db.query.diagnosticSessions.findMany({
    where: and(
      eq(diagnosticSessions.email, email),
      gt(diagnosticSessions.expiresAt, new Date())
    ),
    orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
    limit: 1
  });
  
  if (sessions.length === 0) {
    return { success: false, message: 'No active session found' };
  }
  
  const session = sessions[0];
  const recoveryLink = `https://flip.org.pe/ie/${institutionSlug}/diagnostic?token=${session.token}`;
  
  // Enviar email con Resend
  await sendEmail({
    to: email,
    subject: 'Recupera tu diagnóstico de habilidades',
    html: `<p>Continúa tu diagnóstico aquí: <a href="${recoveryLink}">${recoveryLink}</a></p>`
  });
  
  return { success: true };
}
```

---

### RIESGO 5: JSONB en `institutions.settings`

**Mitigación: Usar Columnas Dedicadas**
```typescript
// Modificar schema.ts

export const institutions = pgTable('institutions', {
  // ... campos existentes
  
  // Nuevas columnas dedicadas (más seguro que JSONB)
  diagnosticEnabled: boolean('diagnostic_enabled').default(false),
  diagnosticRequiresApproval: boolean('diagnostic_requires_approval').default(true),
  diagnosticCustomMessage: text('diagnostic_custom_message'), // Mensaje personalizado opcional
});

// Migración para agregar columnas
// drizzle/migrations/XXXX_add_diagnostic_columns.sql
ALTER TABLE institutions 
ADD COLUMN diagnostic_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN diagnostic_requires_approval BOOLEAN DEFAULT TRUE,
ADD COLUMN diagnostic_custom_message TEXT;
```

---

### RIESGO 6: Seed Duplicado

**Mitigación Técnica:**
```typescript
// apps/web/scripts/seed-diagnostic-questions.ts

import { db } from '@/lib/db';
import { diagnosticCategories, diagnosticQuestions } from '@/lib/db/schema';

const categories = [
  { id: 'cat-1', code: 'MANEJO_INFO', name: 'Manejo de Información', order: 1 },
  { id: 'cat-2', code: 'IA_GENERATIVA', name: 'IA Generativa', order: 2 },
  // ... resto
];

const questions = [
  { 
    id: 'q-1', 
    code: 'MANEJO_INFO_01', // Código único
    categoryId: 'cat-1',
    text: '¿Puedo buscar información en internet usando palabras clave efectivas?',
    order: 1
  },
  // ... resto
];

async function seed() {
  console.log('🌱 Seeding diagnostic data...');
  
  // Usar onConflictDoNothing para evitar duplicados
  await db.insert(diagnosticCategories)
    .values(categories)
    .onConflictDoNothing(); // Si ya existe, no hace nada
  
  await db.insert(diagnosticQuestions)
    .values(questions)
    .onConflictDoNothing();
  
  console.log('✅ Seed complete');
}

seed();
```

**Agregar constraint único en schema:**
```typescript
export const diagnosticQuestions = pgTable('diagnostic_questions', {
  // ... campos
  code: text('code').unique(), // Código único para evitar duplicados
}, (table) => ({
  codeIdx: uniqueIndex('idx_diagnostic_question_code').on(table.code),
}));
```

---

## 🧪 TESTING STRATEGY

### 1. Tests Unitarios
```typescript
// apps/web/src/features/diagnostic/__tests__/staff-integration.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { approveAndCreateStaff } from '../lib/staff-integration';

describe('Staff Integration', () => {
  it('should link existing staff instead of creating duplicate', async () => {
    // Arrange: crear staff existente
    const existingStaff = await createTestStaff({ dni: '12345678' });
    const session = await createTestSession({ dni: '12345678' });
    
    // Act
    const result = await approveAndCreateStaff(session.id);
    
    // Assert
    expect(result.action).toBe('linked');
    expect(result.staffId).toBe(existingStaff.id);
  });
  
  it('should create new staff if not exists', async () => {
    // Arrange
    const session = await createTestSession({ dni: '87654321' });
    
    // Act
    const result = await approveAndCreateStaff(session.id);
    
    // Assert
    expect(result.action).toBe('created');
    expect(result.staffId).toBeDefined();
  });
});
```

### 2. Tests de Integración
```bash
# Probar flujo completo en local
pnpm test:integration
```

### 3. Tests Manuales (Checklist)
- [ ] Completar quiz como usuario nuevo
- [ ] Completar quiz como usuario existente
- [ ] Intentar acceder con token expirado
- [ ] Probar rate limiting (hacer 11 requests seguidos)
- [ ] Aprobar docente desde panel admin
- [ ] Intentar aprobar docente con DNI duplicado
- [ ] Desactivar módulo y verificar que no sea accesible

---

## 📊 MONITOREO POST-DEPLOY

### Métricas a Vigilar
```typescript
// Agregar logging en puntos críticos

import { logger } from '@/lib/logger';

// En cada endpoint
logger.info('diagnostic.session.created', {
  institutionId,
  sessionId,
  timestamp: new Date()
});

logger.error('diagnostic.staff.duplicate', {
  dni,
  email,
  institutionId,
  error: error.message
});
```

### Dashboard de Monitoreo
- Número de sesiones creadas por día
- Tasa de completación del quiz
- Errores de duplicados de staff
- Requests bloqueados por rate limiting
- Tiempo promedio de completación

---

## 🚨 PLAN DE ROLLBACK

### Si algo sale mal en producción:

**Opción 1: Desactivar Feature Flags (Inmediato)**
```bash
# En Vercel dashboard o CLI
vercel env rm FEATURE_DIAGNOSTIC_ENABLED production
vercel env add FEATURE_DIAGNOSTIC_ENABLED production
# Valor: false

# Redeploy
vercel --prod
```

**Opción 2: Revertir Commit (5 minutos)**
```bash
git revert <commit-hash>
git push origin master
# Vercel auto-deploya
```

**Opción 3: Rollback de Base de Datos (15 minutos)**
```bash
# Restaurar desde backup de Neon
neon db restore --backup-id <backup-id>

# O ejecutar script de rollback
pnpm tsx scripts/rollback-diagnostic.ts
```

---

## ✅ CHECKLIST FINAL ANTES DE MERGE

- [ ] Todos los tests pasan
- [ ] Feature flags configurados
- [ ] Backup de BD creado
- [ ] Scripts de rollback probados
- [ ] Rate limiting implementado
- [ ] Validaciones de datos completas
- [ ] Logging agregado en puntos críticos
- [ ] Documentación actualizada
- [ ] Preview deployment probado
- [ ] Equipo notificado del deploy

---

## 📞 CONTACTOS DE EMERGENCIA

- **DBA/DevOps:** [Tu contacto]
- **Backup de Neon:** [Dashboard URL]
- **Vercel Dashboard:** [URL]
- **Logs:** [Vercel Logs URL]
