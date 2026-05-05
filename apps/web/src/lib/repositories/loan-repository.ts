import { db } from '@/lib/db';
import {
  loans,
  loanResources,
  resources,
  users,
  grades,
  sections,
  curricularAreas,
} from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { CreateLoanInput, ReturnLoanInput, LoansQueryInput } from '@/lib/validations/schemas/loans';

// ─── Types ──────────────────────────────────────────────────────────────────

export type LoanRow = {
  id: string;
  institutionId: string;
  staffId: string | null;
  requestedByUserId: string | null;
  staffName: string | undefined;
  staffArea: string | null | undefined;
  status: string | null;
  approvalStatus: string;
  purpose: string | null;
  gradeName: string | undefined;
  sectionName: string | undefined;
  curricularAreaName: string | undefined;
  notes: string | null;
  studentPickupNote: string | null;
  loanDate: Date | null;
  returnDate: Date | null;
  items: string[];
  resourceNames: (string | undefined)[];
  resources: { id: string; name: string; internalId: string; status: string }[];
  damageReports: unknown;
  suggestionReports: unknown;
};

export type PaginatedLoans = {
  data: LoanRow[];
  pagination: { total: number; page: number; limit: number; lastPage: number };
};

// ─── Repository ──────────────────────────────────────────────────────────────

export const LoanRepository = {
  /**
   * Fetch all loans for an institution with enriched relations and lookup maps.
   * Applies role-based filtering: docentes only see their own loans.
   */
  async findMany(
    institutionId: string,
    query: LoansQueryInput,
    userId: string,
    isDocente: boolean,
  ): Promise<PaginatedLoans> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const baseWhere = isDocente
      ? and(eq(loans.institutionId, institutionId), eq(loans.requestedByUserId, userId))
      : eq(loans.institutionId, institutionId);

    const [loansData, totalResult] = await Promise.all([
      db.query.loans.findMany({
        where: baseWhere,
        with: {
          staff: true,
          loanResources: { with: { resource: { with: { category: true } } } },
        },
        orderBy: (l, { desc }) => [desc(l.loanDate)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)` }).from(loans).where(baseWhere),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);

    // Collect IDs for batch enrichment
    const details = loansData.map((l) => (l.purposeDetails ?? {}) as Record<string, string>);
    const gradeIds = [...new Set(details.map((d) => d.gradeId).filter(Boolean))];
    const sectionIds = [...new Set(details.map((d) => d.sectionId).filter(Boolean))];
    const areaIds = [...new Set(details.map((d) => d.curricularAreaId).filter(Boolean))];
    const userIds = [
      ...new Set(
        loansData
          .filter((l) => !l.staffId && l.requestedByUserId)
          .map((l) => l.requestedByUserId as string),
      ),
    ];

    const [gradesData, sectionsData, areasData, usersResult] = await Promise.all([
      gradeIds.length > 0 ? db.query.grades.findMany({ where: inArray(grades.id, gradeIds) }) : [],
      sectionIds.length > 0 ? db.query.sections.findMany({ where: inArray(sections.id, sectionIds) }) : [],
      areaIds.length > 0 ? db.query.curricularAreas.findMany({ where: inArray(curricularAreas.id, areaIds) }) : [],
      userIds.length > 0 ? db.query.users.findMany({ where: inArray(users.id, userIds) }) : [],
    ]);

    const gradeMap = new Map(gradesData.map((g) => [g.id, g.name]));
    const sectionMap = new Map(sectionsData.map((s) => [s.id, s.name]));
    const areaMap = new Map(areasData.map((a) => [a.id, a.name]));
    const userMap = new Map(usersResult.map((u) => [u.id, u.name]));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = loansData.map((loan) => {
      const loanDate = new Date(loan.loanDate ?? new Date());
      loanDate.setHours(0, 0, 0, 0);
      const d = (loan.purposeDetails ?? {}) as Record<string, string>;
      const calculatedStatus =
        loan.status === 'active' && loanDate < today ? 'overdue' : loan.status;

      return {
        id: loan.id,
        institutionId: loan.institutionId,
        staffId: loan.staffId,
        requestedByUserId: loan.requestedByUserId ?? null,
        staffName: (loan.staff as any)?.name ?? (loan.requestedByUserId ? userMap.get(loan.requestedByUserId) : undefined),
        staffArea: (loan.staff as any)?.area,
        status: calculatedStatus,
        approvalStatus: loan.approvalStatus ?? 'approved',
        purpose: loan.purpose,
        gradeName: d.gradeId ? gradeMap.get(d.gradeId) : undefined,
        sectionName: d.sectionId ? sectionMap.get(d.sectionId) : undefined,
        curricularAreaName: d.curricularAreaId ? areaMap.get(d.curricularAreaId) : undefined,
        notes: loan.notes,
        studentPickupNote: loan.studentPickupNote ?? null,
        loanDate: loan.loanDate,
        returnDate: loan.returnDate,
        items: loan.loanResources.map((lr) => lr.resourceId),
        resourceNames: loan.loanResources.map((lr) => lr.resource?.name).filter(Boolean),
        resources: loan.loanResources.map((lr) => ({
          id: lr.resource.id,
          name: lr.resource.name,
          internalId: lr.resource.internalId,
          status: lr.resource.status,
        })),
        damageReports: loan.damageReports,
        suggestionReports: loan.suggestionReports,
      };
    });

    return { data, pagination: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  },

  /** Find a single loan by id scoped to institution, with optional eager loads. */
  async findById(id: string, institutionId: string, withResources = false) {
    return db.query.loans.findFirst({
      where: and(eq(loans.id, id), eq(loans.institutionId, institutionId)),
      ...(withResources ? { with: { loanResources: true } } : {}),
    });
  },

  /** Find a loan with full relations (for return response). */
  async findByIdWithRelations(id: string) {
    return db.query.loans.findFirst({
      where: eq(loans.id, id),
      with: {
        staff: true,
        loanResources: { with: { resource: { with: { category: true } } } },
      },
    });
  },

  /**
   * Validate that all requested resources exist and are available.
   * Throws a descriptive error on the first unavailable resource.
   */
  async validateResourcesAvailable(institutionId: string, resourceIds: string[]) {
    if (resourceIds.length === 0) return;
    const resourcesData = await db.query.resources.findMany({
      where: and(eq(resources.institutionId, institutionId), inArray(resources.id, resourceIds)),
    });
    if (resourcesData.length !== resourceIds.length) {
      throw new Error('Uno o más recursos solicitados no existen en la institución');
    }
    for (const resource of resourcesData) {
      if (resource.status !== 'disponible') {
        throw new Error(`El recurso "${resource.name}" no está disponible (Estado: ${resource.status})`);
      }
    }
  },

  /**
   * Create a loan + loan_resources in a single transaction.
   * Resources are immediately set to 'prestado' to prevent double-booking.
   */
  async create(
    institutionId: string,
    input: CreateLoanInput,
    requestedByUserId: string,
    isDocente: boolean,
  ) {
    const loanId = randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(loans).values({
        id: loanId,
        institutionId,
        staffId: input.staffId || null,
        requestedByUserId,
        status: 'active',
        approvalStatus: isDocente ? 'pending' : 'approved',
        purpose: input.purpose || null,
        notes: input.notes || null,
        studentPickupNote: input.studentPickupNote || null,
        loanDate: new Date(),
        returnDate: null,
        purposeDetails: {
          gradeId: input.gradeId,
          sectionId: input.sectionId,
          curricularAreaId: input.curricularAreaId,
        },
      });

      if (input.resourceIds.length > 0) {
        await tx.insert(loanResources).values(
          input.resourceIds.map((resourceId) => ({ id: randomUUID(), loanId, resourceId })),
        );
        await tx
          .update(resources)
          .set({ status: 'prestado' })
          .where(and(eq(resources.institutionId, institutionId), inArray(resources.id, input.resourceIds)));
      }
    });

    return loanId;
  },

  /** Approve a pending loan (approvalStatus only). */
  async approve(id: string, institutionId: string) {
    const [updated] = await db
      .update(loans)
      .set({ approvalStatus: 'approved' })
      .where(and(eq(loans.id, id), eq(loans.institutionId, institutionId)))
      .returning();
    return updated;
  },

  /** Reject a pending loan and release its resources back to 'disponible'. */
  async reject(id: string, institutionId: string, resourceIds: string[]) {
    await db.transaction(async (tx) => {
      await tx
        .update(loans)
        .set({ approvalStatus: 'rejected' })
        .where(and(eq(loans.id, id), eq(loans.institutionId, institutionId)));

      if (resourceIds.length > 0) {
        await tx
          .update(resources)
          .set({ status: 'disponible' })
          .where(and(eq(resources.institutionId, institutionId), inArray(resources.id, resourceIds)));
      }
    });
  },

  /**
   * Return a loan: sets status='returned', returnDate=now(), saves reports,
   * and batch-updates resource statuses according to user decisions.
   */
  async return(id: string, institutionId: string, input: ReturnLoanInput) {
    const available: string[] = [];
    const maintenance: string[] = [];
    const baja: string[] = [];

    for (const resourceId of input.resourcesReceived ?? []) {
      const decision = input.resourceStatusDecisions?.[resourceId] ?? 'disponible';
      if (decision === 'disponible') available.push(resourceId);
      else if (decision === 'mantenimiento') maintenance.push(resourceId);
      else if (decision === 'baja') baja.push(resourceId);
    }

    await db.transaction(async (tx) => {
      await tx
        .update(loans)
        .set({
          status: 'returned',
          returnDate: new Date(),
          damageReports: input.damageReports ?? null,
          suggestionReports: input.suggestionReports ?? null,
          missingResources: input.missingResources ?? null,
        })
        .where(and(eq(loans.id, id), eq(loans.institutionId, institutionId)));

      const batchUpdate = async (ids: string[], status: string) => {
        if (ids.length === 0) return;
        await tx
          .update(resources)
          .set({ status })
          .where(and(eq(resources.institutionId, institutionId), inArray(resources.id, ids)));
      };

      await batchUpdate(available, 'disponible');
      await batchUpdate(maintenance, 'mantenimiento');
      await batchUpdate(baja, 'baja');
    });
  },
};
