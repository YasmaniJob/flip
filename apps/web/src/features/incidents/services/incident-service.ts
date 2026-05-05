import { z } from 'zod';
import { createIncidentSchema, listIncidentsQuerySchema } from '../schemas';
import { canCreateIncident, User } from './permissions-service';
import { generateSequentialId } from './sequence-service';
import { checkIncidentRecurrence } from './recurrence-detection-service';
import {
  IncidentRepository,
  IncidentFilter,
  PaginatedIncidents,
} from '../repositories/incident-repository';

// ─── Errors ──────────────────────────────────────────────────────────────────

export class IncidentPermissionError extends Error {
  constructor(message = 'No tiene permisos para realizar esta acción') {
    super(message);
    this.name = 'IncidentPermissionError';
  }
}

export class IncidentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IncidentValidationError';
  }
}

// ─── Input types ─────────────────────────────────────────────────────────────

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type ListIncidentsInput = z.infer<typeof listIncidentsQuerySchema>;

// ─── Service ─────────────────────────────────────────────────────────────────

export const IncidentService = {
  /**
   * Create a new Incident.
   *
   * Orchestrates the full workflow:
   *   1. Permission check
   *   2. Sequential ID generation (atomic)
   *   3. Persistence via repository (includes history entry)
   *   4. Recurrence detection and flagging
   */
  async create(
    institutionId: string,
    input: CreateIncidentInput,
    user: User & { institutionId?: string },
  ) {
    // 1. Permission check
    if (!canCreateIncident(user)) {
      throw new IncidentPermissionError('No tiene permisos para crear incidencias');
    }

    // 2. Generate sequential ID atomically
    const { sequentialId, displayId } = await generateSequentialId(institutionId);

    // 3. Persist incident + history in one call
    const incident = await IncidentRepository.create({
      institutionId,
      sequentialId,
      displayId,
      title: input.title,
      description: input.description,
      type: input.type,
      priority: input.priority,
      reporterId: user.id,
      resourceId: input.resourceId ?? null,
      location: input.location ?? null,
    });

    // 4. Recurrence detection (fire-and-forget style — already handled internally)
    const recurrenceCheck = await checkIncidentRecurrence(
      institutionId,
      incident.id,
      incident.resourceId,
      incident.location,
      incident.type,
    );

    if (recurrenceCheck.isRecurrent) {
      await IncidentRepository.markRecurrent(incident.id, recurrenceCheck.recurrenceCount);
    }

    return incident;
  },

  /**
   * List incidents with filters and pagination.
   *
   * Delegates filtering and query building to the repository.
   */
  async list(
    institutionId: string,
    query: ListIncidentsInput,
  ): Promise<PaginatedIncidents> {
    const filter: IncidentFilter = {
      institutionId,
      search: query.search,
      status: query.status as string | string[] | undefined,
      priority: query.priority as string | string[] | undefined,
      type: query.type as string | string[] | undefined,
      assigneeId: query.assigneeId,
      reporterId: query.reporterId,
      resourceId: query.resourceId,
      isRecurrent: query.isRecurrent,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
      page: query.page,
      limit: query.limit,
    };

    return IncidentRepository.findMany(filter);
  },
};
