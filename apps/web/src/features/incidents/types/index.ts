// ============================================
// INCIDENT MANAGEMENT - TYPES & INTERFACES
// ============================================

// Core Types
export type IncidentType = 'recursos' | 'infraestructura' | 'servicios' | 'seguridad' | 'otros';
export type IncidentPriority = 'baja' | 'media' | 'alta' | 'critica';
export type IncidentStatus = 'reportada' | 'en_revision' | 'en_progreso' | 'resuelta' | 'cerrada';
export type ChangeType = 'created' | 'updated' | 'deleted';

// State Machine - Valid transitions
export const INCIDENT_STATE_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  reportada: ['en_revision'],
  en_revision: ['en_progreso'],
  en_progreso: ['resuelta'],
  resuelta: ['cerrada', 'en_progreso'], // Can reopen
  cerrada: [], // Terminal state
};

// Priority Colors
export const INCIDENT_PRIORITY_COLORS: Record<IncidentPriority, string> = {
  baja: 'gray',
  media: 'yellow',
  alta: 'orange',
  critica: 'red',
};

// Status Colors
export const INCIDENT_STATUS_COLORS: Record<IncidentStatus, string> = {
  reportada: 'blue',
  en_revision: 'purple',
  en_progreso: 'yellow',
  resuelta: 'green',
  cerrada: 'gray',
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
  changeType: ChangeType;
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

// API Request/Response Types
export interface CreateIncidentRequest {
  title: string;
  description: string;
  type: IncidentType;
  priority: IncidentPriority;
  resourceId?: string;
  location?: string;
}

export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  type?: IncidentType;
  priority?: IncidentPriority;
  resourceId?: string | null;
  location?: string | null;
}

export interface ChangeStatusRequest {
  status: IncidentStatus;
  resolutionComment?: string;
}

export interface ChangePriorityRequest {
  priority: IncidentPriority;
}

export interface AssignIncidentRequest {
  assigneeId: string | null;
}

export interface CreateCommentRequest {
  content: string;
}

export interface BulkUpdateRequest {
  incidentIds: string[];
  action: 'status' | 'priority' | 'assign';
  value: IncidentStatus | IncidentPriority | string | null;
}

export interface ListIncidentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string | string[];
  priority?: string | string[];
  type?: string | string[];
  assigneeId?: string;
  reporterId?: string;
  resourceId?: string;
  isRecurrent?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}
