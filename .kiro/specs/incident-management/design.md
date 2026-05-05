# Design Document - Incident Management Module

## Overview

El módulo de gestión de incidencias es un sistema completo de reporte y seguimiento de problemas en instituciones educativas. Permite a cualquier usuario autenticado reportar incidencias relacionadas con recursos, infraestructura, servicios y seguridad, asignar responsables, realizar seguimiento mediante comentarios, adjuntar evidencias fotográficas, y generar reportes estadísticos.

El sistema sigue una arquitectura feature-based consistente con los módulos existentes de FLIP, utilizando Next.js 15 App Router, React Server Components donde sea apropiado, TanStack Query para gestión de estado del servidor, y Drizzle ORM para acceso a datos.

### Key Design Decisions

1. **Multi-tenant isolation**: Todas las consultas filtran por `institutionId` para garantizar aislamiento completo entre instituciones
2. **Soft delete**: Las incidencias eliminadas se marcan como inactivas pero se preservan para auditoría
3. **Change history tracking**: Cada modificación se registra automáticamente en una tabla de historial
4. **File storage**: Los attachments se almacenan en el sistema de archivos o servicio de almacenamiento externo (compatible con Vercel Blob)
5. **Real-time notifications**: Integración con el sistema de notificaciones existente para alertas in-app y email
6. **Sequential IDs**: Identificadores secuenciales por institución para facilitar referencia (INC-001, INC-002, etc.)
7. **State machine**: Flujo de estados unidireccional con validaciones estrictas
8. **Performance optimization**: Índices estratégicos, paginación, lazy loading, y caching

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Incident Management                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │  API Layer   │  │  Data Layer  │      │
│  │              │  │              │  │              │      │
│  │ - List View  │  │ - REST APIs  │  │ - Drizzle    │      │
│  │ - Detail     │  │ - Validation │  │ - PostgreSQL │      │
│  │ - Forms      │  │ - Auth       │  │ - Indexes    │      │
│  │ - Filters    │  │ - Business   │  │              │      │
│  │ - Dashboard  │  │   Logic      │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│  ┌─────────────────────────┴──────────────────────────┐     │
│  │           External Integrations                     │     │
│  │                                                      │     │
│  │  - Notification Service (in-app + email)           │     │
│  │  - File Storage (Vercel Blob / local)              │     │
│  │  - Resources Module (inventory integration)        │     │
│  │  - Staff Module (user/staff data)                  │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Create Incident**: User → Form → API → Validation → DB → Notification Service
2. **Update Incident**: User → Action → API → Auth Check → DB Update → Change History → Notifications
3. **Add Comment**: User → Comment Form → API → DB → Notify Stakeholders
4. **Upload Attachment**: User → File Upload → Storage Service → DB Reference → Success
5. **Search/Filter**: User → Query → API → DB (indexed query) → Paginated Results

## Components and Interfaces

### Database Schema


El esquema de base de datos sigue el patrón multi-tenant con aislamiento por `institutionId`. Todas las tablas principales incluyen este campo para garantizar la separación de datos entre instituciones.

#### Core Tables

**incidents**
```typescript
{
  id: text (PK),
  institutionId: text (FK -> institutions.id, NOT NULL),
  sequentialId: integer (NOT NULL), // Auto-incrementing per institution
  displayId: text (NOT NULL), // e.g., "INC-001", "INC-002"
  
  // Basic Information
  title: text (NOT NULL),
  description: text (NOT NULL),
  type: text (NOT NULL), // 'recursos' | 'infraestructura' | 'servicios' | 'seguridad' | 'otros'
  priority: text (NOT NULL), // 'baja' | 'media' | 'alta' | 'critica'
  status: text (NOT NULL), // 'reportada' | 'en_revision' | 'en_progreso' | 'resuelta' | 'cerrada'
  
  // Relationships
  reporterId: text (FK -> users.id, NOT NULL),
  assigneeId: text (FK -> users.id, NULL),
  resourceId: text (FK -> resources.id, NULL), // Only for type='recursos'
  
  // Location (for infraestructura/servicios)
  location: text (NULL),
  
  // Recurrence tracking
  masterIncidentId: text (FK -> incidents.id, NULL), // For grouped recurring incidents
  isRecurrent: boolean (DEFAULT false),
  recurrenceCount: integer (DEFAULT 0),
  
  // Resolution tracking
  resolvedAt: timestamp (NULL),
  resolutionTime: integer (NULL), // Minutes from creation to resolution
  
  // Metadata
  isActive: boolean (DEFAULT true), // Soft delete
  createdAt: timestamp (DEFAULT NOW),
  updatedAt: timestamp (DEFAULT NOW),
  
  // Indexes
  UNIQUE(institutionId, sequentialId),
  INDEX(institutionId, status),
  INDEX(institutionId, priority),
  INDEX(institutionId, type),
  INDEX(institutionId, reporterId),
  INDEX(institutionId, assigneeId),
  INDEX(institutionId, resourceId),
  INDEX(institutionId, createdAt),
  INDEX(institutionId, isRecurrent),
  INDEX(masterIncidentId)
}
```

**incident_comments**
```typescript
{
  id: text (PK),
  incidentId: text (FK -> incidents.id, NOT NULL),
  authorId: text (FK -> users.id, NOT NULL),
  content: text (NOT NULL),
  isResolutionComment: boolean (DEFAULT false), // Marks the resolution explanation
  isEdited: boolean (DEFAULT false),
  editedAt: timestamp (NULL),
  createdAt: timestamp (DEFAULT NOW),
  
  // Indexes
  INDEX(incidentId, createdAt),
  INDEX(authorId)
}
```

**incident_attachments**
```typescript
{
  id: text (PK),
  incidentId: text (FK -> incidents.id, NOT NULL),
  uploadedBy: text (FK -> users.id, NOT NULL),
  fileName: text (NOT NULL),
  fileSize: integer (NOT NULL), // Bytes
  mimeType: text (NOT NULL),
  storageKey: text (NOT NULL), // Path in storage service
  storageUrl: text (NOT NULL), // Public URL
  createdAt: timestamp (DEFAULT NOW),
  
  // Indexes
  INDEX(incidentId),
  INDEX(uploadedBy)
}
```

**incident_change_history**
```typescript
{
  id: text (PK),
  incidentId: text (FK -> incidents.id, NOT NULL),
  changedBy: text (FK -> users.id, NOT NULL),
  field: text (NOT NULL), // 'status' | 'priority' | 'assignee' | 'type' | 'title' | 'description' | 'resource'
  oldValue: text (NULL),
  newValue: text (NULL),
  changeType: text (NOT NULL), // 'created' | 'updated' | 'deleted'
  metadata: jsonb (NULL), // Additional context
  createdAt: timestamp (DEFAULT NOW),
  
  // Indexes
  INDEX(incidentId, createdAt DESC),
  INDEX(changedBy)
}
```

**incident_templates**
```typescript
{
  id: text (PK),
  institutionId: text (FK -> institutions.id, NOT NULL),
  name: text (NOT NULL),
  type: text (NOT NULL),
  suggestedPriority: text (NOT NULL),
  titleTemplate: text (NOT NULL),
  descriptionTemplate: text (NOT NULL), // Can include {{variables}}
  isActive: boolean (DEFAULT true),
  createdBy: text (FK -> users.id, NOT NULL),
  createdAt: timestamp (DEFAULT NOW),
  updatedAt: timestamp (DEFAULT NOW),
  
  // Indexes
  INDEX(institutionId, isActive),
  INDEX(institutionId, type)
}
```

**incident_sequences**
```typescript
{
  id: text (PK),
  institutionId: text (FK -> institutions.id, NOT NULL),
  lastNumber: integer (DEFAULT 0, NOT NULL),
  
  // Indexes
  UNIQUE(institutionId)
}
```

#### Integration Points

- **users**: Reporter and assignee references
- **resources**: Optional link for equipment-related incidents
- **institutions**: Multi-tenant isolation
- **staff**: For assignee selection (users with staff records)

### API Endpoints

El módulo expone una API RESTful siguiendo las convenciones de Next.js App Router.

#### Incident Management

```
POST   /api/institutions/[id]/incidents
GET    /api/institutions/[id]/incidents
GET    /api/institutions/[id]/incidents/[incidentId]
PATCH  /api/institutions/[id]/incidents/[incidentId]
DELETE /api/institutions/[id]/incidents/[incidentId]
```

#### Comments

```
POST   /api/institutions/[id]/incidents/[incidentId]/comments
GET    /api/institutions/[id]/incidents/[incidentId]/comments
PATCH  /api/institutions/[id]/incidents/[incidentId]/comments/[commentId]
DELETE /api/institutions/[id]/incidents/[incidentId]/comments/[commentId]
```

#### Attachments

```
POST   /api/institutions/[id]/incidents/[incidentId]/attachments
DELETE /api/institutions/[id]/incidents/[incidentId]/attachments/[attachmentId]
```

#### State Transitions

```
POST   /api/institutions/[id]/incidents/[incidentId]/status
POST   /api/institutions/[id]/incidents/[incidentId]/priority
POST   /api/institutions/[id]/incidents/[incidentId]/assign
```

#### Bulk Operations

```
POST   /api/institutions/[id]/incidents/bulk/status
POST   /api/institutions/[id]/incidents/bulk/priority
POST   /api/institutions/[id]/incidents/bulk/assign
```

#### Templates

```
GET    /api/institutions/[id]/incidents/templates
POST   /api/institutions/[id]/incidents/templates
PATCH  /api/institutions/[id]/incidents/templates/[templateId]
DELETE /api/institutions/[id]/incidents/templates/[templateId]
```

#### Statistics & Reports

```
GET    /api/institutions/[id]/incidents/stats
GET    /api/institutions/[id]/incidents/export?format=csv|pdf
GET    /api/institutions/[id]/incidents/recurrent
```

### Request/Response Schemas

#### Create Incident Request
```typescript
{
  title: string;
  description: string;
  type: 'recursos' | 'infraestructura' | 'servicios' | 'seguridad' | 'otros';
  priority: 'baja' | 'media' | 'alta' | 'critica';
  resourceId?: string; // Required if type === 'recursos'
  location?: string; // For infraestructura/servicios
  attachments?: File[]; // Max 5 files, 5MB each
}
```

#### Incident Response
```typescript
{
  id: string;
  displayId: string; // "INC-001"
  institutionId: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  reporterId: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  assigneeId: string | null;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  resourceId: string | null;
  resource: {
    id: string;
    name: string;
    internalId: string;
  } | null;
  location: string | null;
  isRecurrent: boolean;
  recurrenceCount: number;
  masterIncidentId: string | null;
  resolvedAt: string | null;
  resolutionTime: number | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    comments: number;
    attachments: number;
  };
}
```

#### List Incidents Query Parameters
```typescript
{
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
  search?: string; // Search in title, description, displayId
  status?: string | string[]; // Filter by status
  priority?: string | string[]; // Filter by priority
  type?: string | string[]; // Filter by type
  assigneeId?: string; // Filter by assignee
  reporterId?: string; // Filter by reporter
  resourceId?: string; // Filter by resource
  isRecurrent?: boolean; // Filter recurrent incidents
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status'; // Default: createdAt
  sortOrder?: 'asc' | 'desc'; // Default: desc
}
```

## Data Models

### TypeScript Interfaces

```typescript
// Core Types
export type IncidentType = 'recursos' | 'infraestructura' | 'servicios' | 'seguridad' | 'otros';
export type IncidentPriority = 'baja' | 'media' | 'alta' | 'critica';
export type IncidentStatus = 'reportada' | 'en_revision' | 'en_progreso' | 'resuelta' | 'cerrada';

// State Machine
export const INCIDENT_STATE_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  reportada: ['en_revision'],
  en_revision: ['en_progreso'],
  en_progreso: ['resuelta'],
  resuelta: ['cerrada', 'en_progreso'], // Can reopen
  cerrada: [], // Terminal state
};

// Domain Models
export interface Incident {
  id: string;
  institutionId: string;
  sequentialId: number;
  displayId: string;
  title: string;
  description: string;
  type: IncidentType;
  priority: IncidentPriority;
  status: IncidentStatus;
  reporterId: string;
  assigneeId: string | null;
  resourceId: string | null;
  location: string | null;
  masterIncidentId: string | null;
  isRecurrent: boolean;
  recurrenceCount: number;
  resolvedAt: Date | null;
  resolutionTime: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  authorId: string;
  content: string;
  isResolutionComment: boolean;
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
}

export interface IncidentAttachment {
  id: string;
  incidentId: string;
  uploadedBy: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  storageUrl: string;
  createdAt: Date;
}

export interface IncidentChangeHistory {
  id: string;
  incidentId: string;
  changedBy: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: 'created' | 'updated' | 'deleted';
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export interface IncidentTemplate {
  id: string;
  institutionId: string;
  name: string;
  type: IncidentType;
  suggestedPriority: IncidentPriority;
  titleTemplate: string;
  descriptionTemplate: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// View Models (with relations)
export interface IncidentWithRelations extends Incident {
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  resource: {
    id: string;
    name: string;
    internalId: string;
    categoryId: string;
  } | null;
  _count: {
    comments: number;
    attachments: number;
  };
}

export interface IncidentDetailView extends IncidentWithRelations {
  comments: Array<IncidentComment & {
    author: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  attachments: IncidentAttachment[];
  changeHistory: Array<IncidentChangeHistory & {
    changedByUser: {
      id: string;
      name: string;
    };
  }>;
}

// Statistics
export interface IncidentStats {
  total: number;
  byStatus: Record<IncidentStatus, number>;
  byPriority: Record<IncidentPriority, number>;
  byType: Record<IncidentType, number>;
  open: number; // reportada + en_revision + en_progreso
  resolved: number; // resuelta + cerrada
  averageResolutionTime: number; // minutes
  averageResolutionTimeByType: Record<IncidentType, number>;
  topResourcesWithIncidents: Array<{
    resourceId: string;
    resourceName: string;
    count: number;
  }>;
  recurrentIncidents: number;
}
```

### Validation Schemas (Zod)

```typescript
import { z } from 'zod';

export const createIncidentSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  type: z.enum(['recursos', 'infraestructura', 'servicios', 'seguridad', 'otros']),
  priority: z.enum(['baja', 'media', 'alta', 'critica']),
  resourceId: z.string().uuid().optional(),
  location: z.string().max(200).optional(),
}).refine(
  (data) => {
    // If type is 'recursos', resourceId is required
    if (data.type === 'recursos') {
      return !!data.resourceId;
    }
    return true;
  },
  {
    message: "resourceId is required when type is 'recursos'",
    path: ['resourceId'],
  }
);

export const updateIncidentSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  type: z.enum(['recursos', 'infraestructura', 'servicios', 'seguridad', 'otros']).optional(),
  priority: z.enum(['baja', 'media', 'alta', 'critica']).optional(),
  resourceId: z.string().uuid().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(['reportada', 'en_revision', 'en_progreso', 'resuelta', 'cerrada']),
  resolutionComment: z.string().min(10).optional(), // Required when status -> 'resuelta'
});

export const changePrioritySchema = z.object({
  priority: z.enum(['baja', 'media', 'alta', 'critica']),
});

export const assignIncidentSchema = z.object({
  assigneeId: z.string().uuid().nullable(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const bulkUpdateSchema = z.object({
  incidentIds: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(['status', 'priority', 'assign']),
  value: z.union([
    z.enum(['reportada', 'en_revision', 'en_progreso', 'resuelta', 'cerrada']),
    z.enum(['baja', 'media', 'alta', 'critica']),
    z.string().uuid().nullable(),
  ]),
});
```

## Error Handling

### Error Types

```typescript
export class IncidentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'IncidentError';
  }
}

// Specific error classes
export class IncidentNotFoundError extends IncidentError {
  constructor(incidentId: string) {
    super(`Incident ${incidentId} not found`, 'INCIDENT_NOT_FOUND', 404);
  }
}

export class InvalidStateTransitionError extends IncidentError {
  constructor(from: string, to: string) {
    super(
      `Invalid state transition from ${from} to ${to}`,
      'INVALID_STATE_TRANSITION',
      400
    );
  }
}

export class UnauthorizedActionError extends IncidentError {
  constructor(action: string) {
    super(
      `User not authorized to perform action: ${action}`,
      'UNAUTHORIZED_ACTION',
      403
    );
  }
}

export class AttachmentLimitExceededError extends IncidentError {
  constructor() {
    super(
      'Maximum 5 attachments allowed per incident',
      'ATTACHMENT_LIMIT_EXCEEDED',
      400
    );
  }
}

export class FileSizeLimitExceededError extends IncidentError {
  constructor() {
    super(
      'File size must not exceed 5MB',
      'FILE_SIZE_LIMIT_EXCEEDED',
      400
    );
  }
}
```

### Error Handling Strategy

1. **API Layer**: Catch all errors and return consistent error responses
2. **Validation Errors**: Return 400 with detailed field-level errors
3. **Authorization Errors**: Return 403 with clear message
4. **Not Found Errors**: Return 404 with resource identifier
5. **Server Errors**: Return 500 with generic message (log details internally)
6. **Client-Side**: Display user-friendly error messages with toast notifications

### Error Response Format

```typescript
{
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  }
}
```

## Testing Strategy

Este módulo es un sistema CRUD con integraciones de servicios externos (notificaciones, almacenamiento de archivos, base de datos). Property-Based Testing NO es apropiado para este tipo de sistema. En su lugar, utilizaremos:

### Unit Tests

Enfocados en lógica de negocio aislada:

- **State Machine Validation**: Verificar transiciones de estado válidas e inválidas
- **Permission Checks**: Validar reglas de autorización para cada acción
- **Sequential ID Generation**: Probar generación atómica de IDs secuenciales
- **Recurrence Detection**: Verificar lógica de detección de incidencias recurrentes
- **Resolution Time Calculation**: Probar cálculo de tiempo de resolución
- **Template Variable Substitution**: Verificar reemplazo de variables en plantillas

Ejemplos de casos de prueba:

```typescript
describe('State Machine', () => {
  it('should allow transition from reportada to en_revision', () => {
    expect(canTransition('reportada', 'en_revision')).toBe(true);
  });

  it('should not allow transition from reportada to resuelta', () => {
    expect(canTransition('reportada', 'resuelta')).toBe(false);
  });

  it('should allow reopening from resuelta to en_progreso', () => {
    expect(canTransition('resuelta', 'en_progreso')).toBe(true);
  });

  it('should not allow any transition from cerrada', () => {
    expect(canTransition('cerrada', 'en_progreso')).toBe(false);
  });
});

describe('Permissions', () => {
  it('should allow any authenticated user to create incidents', () => {
    expect(canCreateIncident(regularUser)).toBe(true);
  });

  it('should allow only Admin/PIP to assign incidents', () => {
    expect(canAssignIncident(adminUser)).toBe(true);
    expect(canAssignIncident(regularUser)).toBe(false);
  });

  it('should allow assignee to change status of their incidents', () => {
    expect(canChangeStatus(assigneeUser, incidentAssignedToThem)).toBe(true);
  });

  it('should allow reporter to edit within 24 hours', () => {
    const recentIncident = { createdAt: new Date(Date.now() - 1000 * 60 * 60) }; // 1 hour ago
    expect(canEditIncident(reporterUser, recentIncident)).toBe(true);
    
    const oldIncident = { createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25) }; // 25 hours ago
    expect(canEditIncident(reporterUser, oldIncident)).toBe(false);
  });
});
```

### Integration Tests

Verificar interacciones entre componentes:

- **API Endpoints**: Probar cada endpoint con casos válidos e inválidos
- **Database Operations**: Verificar CRUD operations con transacciones
- **File Upload**: Probar subida de archivos al storage service (con mocks)
- **Notification Triggers**: Verificar que se envían notificaciones correctas (con mocks)
- **Multi-tenant Isolation**: Asegurar que usuarios de una institución no pueden acceder a incidencias de otra
- **Change History Tracking**: Verificar que cada modificación se registra correctamente

### End-to-End Tests

Flujos completos de usuario:

- **Create and Resolve Incident**: Crear incidencia → Asignar → Cambiar estado → Agregar comentario → Resolver → Cerrar
- **Bulk Operations**: Seleccionar múltiples incidencias → Cambiar estado/prioridad en masa
- **Recurrence Detection**: Crear múltiples incidencias para el mismo recurso → Verificar detección de recurrencia
- **Template Usage**: Crear plantilla → Usar plantilla para nueva incidencia → Verificar pre-llenado
- **Search and Filter**: Aplicar múltiples filtros → Verificar resultados correctos

### Performance Tests

- **List Performance**: Cargar lista con 1000+ incidencias en <500ms
- **Search Performance**: Búsqueda full-text en <300ms
- **Dashboard Stats**: Calcular estadísticas en <1s con caching
- **Concurrent Sequential ID Generation**: Probar generación de IDs bajo carga concurrente

### Test Coverage Goals

- Unit Tests: >80% coverage en lógica de negocio
- Integration Tests: Todos los endpoints API
- E2E Tests: Flujos críticos de usuario
- Performance Tests: Operaciones frecuentes

### Testing Tools

- **Vitest**: Unit and integration tests
- **Playwright**: E2E tests
- **MSW (Mock Service Worker)**: API mocking
- **Testing Library**: Component testing
- **Faker**: Test data generation

## Performance Optimization

### Database Optimization

1. **Indexes**: Índices compuestos en campos frecuentemente filtrados
   - `(institutionId, status)`
   - `(institutionId, priority)`
   - `(institutionId, createdAt)`
   - `(institutionId, assigneeId)`

2. **Query Optimization**:
   - Usar `SELECT` específico en lugar de `SELECT *`
   - Limitar joins a relaciones necesarias
   - Implementar paginación en todas las listas

3. **Connection Pooling**: Configurar pool de conexiones apropiado para Neon/Vercel

### Caching Strategy

1. **Dashboard Statistics**: Cache por 5 minutos (invalidar en cambios)
2. **User Permissions**: Cache en sesión
3. **Templates List**: Cache por institución
4. **Resource Lookup**: Cache referencias a recursos

### Frontend Optimization

1. **Code Splitting**: Lazy load componentes pesados (dashboard, charts)
2. **Virtualization**: Usar virtual scrolling para listas largas
3. **Optimistic Updates**: Actualizar UI inmediatamente, revertir en error
4. **Debounced Search**: Debounce de 300ms en búsqueda en tiempo real
5. **Image Optimization**: Lazy load attachments, usar thumbnails

### File Upload Optimization

1. **Client-side Validation**: Validar tamaño/tipo antes de subir
2. **Progress Indicators**: Mostrar progreso de subida
3. **Parallel Uploads**: Subir múltiples archivos en paralelo
4. **Compression**: Comprimir imágenes antes de subir (opcional)

## Security Considerations

### Authentication & Authorization

1. **Session Validation**: Verificar sesión en cada request
2. **Institution Isolation**: Filtrar SIEMPRE por `institutionId` del usuario
3. **Role-Based Access**: Implementar checks de permisos por rol
4. **Action Authorization**: Validar permisos específicos por acción

### Input Validation

1. **Schema Validation**: Usar Zod para validar todos los inputs
2. **SQL Injection Prevention**: Usar Drizzle ORM (prepared statements)
3. **XSS Prevention**: Sanitizar contenido de comentarios
4. **File Upload Validation**: Validar tipo MIME y tamaño

### Data Protection

1. **Soft Delete**: Preservar datos para auditoría
2. **Change History**: Registrar todas las modificaciones
3. **Audit Log**: Log de acciones sensibles (eliminaciones, cambios masivos)
4. **GDPR Compliance**: Permitir exportación y eliminación de datos

### Rate Limiting

1. **API Rate Limits**: Limitar requests por usuario/IP
2. **File Upload Limits**: Máximo 5 archivos por incidencia
3. **Bulk Operation Limits**: Máximo 50 incidencias por operación masiva

## Deployment Considerations

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# File Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Email (for notifications)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@flip.edu.pe

# App Config
NEXT_PUBLIC_APP_URL=https://app.flip.edu.pe
```

### Database Migrations

1. Crear tablas en orden correcto (respetando foreign keys)
2. Crear índices después de insertar datos iniciales
3. Seed data: Ninguno requerido (las incidencias se crean por usuarios)

### Monitoring

1. **Error Tracking**: Sentry para errores de producción
2. **Performance Monitoring**: Vercel Analytics
3. **Database Monitoring**: Neon dashboard para queries lentas
4. **Notification Delivery**: Monitorear tasa de éxito de emails

### Rollback Strategy

1. **Database**: Mantener migrations reversibles
2. **File Storage**: No eliminar archivos inmediatamente (soft delete)
3. **Feature Flags**: Permitir deshabilitar módulo por institución

## Future Enhancements

Posibles mejoras para versiones futuras:

1. **Mobile App**: Aplicación móvil nativa para reportar incidencias con cámara
2. **Real-time Updates**: WebSockets para actualizaciones en tiempo real
3. **AI-Powered Categorization**: Sugerir tipo y prioridad automáticamente
4. **SLA Tracking**: Definir y rastrear SLAs por tipo de incidencia
5. **Integration with External Systems**: Integrar con sistemas de ticketing externos
6. **Advanced Analytics**: Dashboards más detallados con predicciones
7. **Workflow Automation**: Reglas automáticas (auto-asignar, escalar prioridad)
8. **Multi-language Support**: Soporte para múltiples idiomas

