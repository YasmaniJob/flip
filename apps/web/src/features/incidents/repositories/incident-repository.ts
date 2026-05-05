import { db } from '@/lib/db';
import {
  incidents,
  incidentChangeHistory,
  users,
  resources,
} from '@/lib/db/schema';
import {
  eq,
  and,
  sql,
  or,
  like,
  inArray,
  gte,
  lte,
} from 'drizzle-orm';
import { alias as aliasedTable } from 'drizzle-orm/pg-core';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateIncidentData {
  institutionId: string;
  sequentialId: number;
  displayId: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  reporterId: string;
  resourceId?: string | null;
  location?: string | null;
}

export interface IncidentFilter {
  institutionId: string;
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
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedIncidents {
  data: ReturnType<typeof buildIncidentRow>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Infer the row shape for reuse
type IncidentRow = {
  incident: typeof incidents.$inferSelect;
  reporter: { id: string; name: string; email: string } | null;
  assignee: { id: string; name: string; email: string } | null;
  resource: { id: string; name: string; internalId: string; categoryId: string } | null;
};

function buildIncidentRow(_row: unknown): IncidentRow {
  return _row as IncidentRow;
}

// ─── Repository ──────────────────────────────────────────────────────────────

export const IncidentRepository = {
  /**
   * Persist a new Incident and its creation history entry atomically.
   */
  async create(data: CreateIncidentData) {
    const inserted = await db
      .insert(incidents)
      .values({
        id: crypto.randomUUID(),
        institutionId: data.institutionId,
        sequentialId: data.sequentialId,
        displayId: data.displayId,
        title: data.title,
        description: data.description ?? '',
        type: data.type,
        priority: data.priority,
        status: 'reportada',
        reporterId: data.reporterId,
        resourceId: data.resourceId ?? null,
        location: data.location ?? null,
      })
      .returning() as (typeof incidents.$inferSelect)[];
    const incident = inserted[0];

    // Record creation event in change history
    await db.insert(incidentChangeHistory).values({
      id: crypto.randomUUID(),
      incidentId: incident.id,
      changedBy: data.reporterId,
      field: 'status',
      oldValue: null,
      newValue: 'reportada',
      changeType: 'created',
      metadata: {
        title: incident.title,
        type: incident.type,
        priority: incident.priority,
      },
    });

    return incident;
  },

  /**
   * Mark an incident as recurrent after it has been created.
   */
  async markRecurrent(incidentId: string, recurrenceCount: number) {
    await db
      .update(incidents)
      .set({ isRecurrent: true, recurrenceCount })
      .where(eq(incidents.id, incidentId));
  },

  /**
   * List incidents with optional filters, joins, and pagination.
   */
  async findMany(filter: IncidentFilter): Promise<PaginatedIncidents> {
    const {
      institutionId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filter;

    // ── Build WHERE conditions ────────────────────────────────────────────────
    const conditions: ReturnType<typeof eq>[] = [
      eq(incidents.institutionId, institutionId),
      eq(incidents.isActive, true),
    ];

    if (filter.search) {
      conditions.push(
        or(
          like(incidents.title, `%${filter.search}%`),
          like(incidents.description, `%${filter.search}%`),
          like(incidents.displayId, `%${filter.search}%`),
        )!,
      );
    }

    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      conditions.push(inArray(incidents.status, statuses));
    }

    if (filter.priority) {
      const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
      conditions.push(inArray(incidents.priority, priorities));
    }

    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      conditions.push(inArray(incidents.type, types));
    }

    if (filter.assigneeId) conditions.push(eq(incidents.assigneeId, filter.assigneeId));
    if (filter.reporterId) conditions.push(eq(incidents.reporterId, filter.reporterId));
    if (filter.resourceId) conditions.push(eq(incidents.resourceId, filter.resourceId));
    if (filter.isRecurrent !== undefined) conditions.push(eq(incidents.isRecurrent, filter.isRecurrent));
    if (filter.dateFrom) conditions.push(gte(incidents.createdAt, new Date(filter.dateFrom)));
    if (filter.dateTo) conditions.push(lte(incidents.createdAt, new Date(filter.dateTo)));

    const whereClause = and(...conditions);

    // ── Count ────────────────────────────────────────────────────────────────
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(incidents)
      .where(whereClause);

    // Fetch with relations
    const reporterUsers = aliasedTable(users, 'reporter_users');
    const assigneeUsers = aliasedTable(users, 'assignee_users');

    const rows = await db
      .select({
        incident: incidents,
        reporter: {
          id: reporterUsers.id,
          name: reporterUsers.name,
          email: reporterUsers.email,
        },
        assignee: {
          id: assigneeUsers.id,
          name: assigneeUsers.name,
          email: assigneeUsers.email,
        },
        resource: {
          id: resources.id,
          name: resources.name,
          internalId: resources.internalId,
          categoryId: resources.categoryId,
        },
      })
      .from(incidents)
      .leftJoin(reporterUsers, eq(incidents.reporterId, reporterUsers.id))
      .leftJoin(assigneeUsers, eq(incidents.assigneeId, assigneeUsers.id))
      .leftJoin(resources, eq(incidents.resourceId, resources.id))
      .where(whereClause)
      .orderBy(
        sortOrder === 'asc'
          ? sql`${incidents[sortBy as keyof typeof incidents]} asc`
          : sql`${incidents[sortBy as keyof typeof incidents]} desc`,
      )
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      data: rows as unknown as ReturnType<typeof buildIncidentRow>[],
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  },
};
