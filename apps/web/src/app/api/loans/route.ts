import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/utils/response';
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import { createLoanSchema, loansQuerySchema } from '@/lib/validations/schemas/loans';
import { ValidationError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { loans, loanResources, resources, users, grades, sections, curricularAreas } from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// GET /api/loans - List loans with role-based filtering
// Updated: 2026-03-22 12:45 - Optimized to reduce queries from 5 to 2
export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const { searchParams } = new URL(request.url);
    const query = validateQuery(loansQuerySchema, searchParams);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    // Role-based filtering: Docentes only see their own loans
    const isDocente = user.role === 'docente';
    const baseWhere = isDocente
      ? and(eq(loans.institutionId, institutionId), eq(loans.requestedByUserId, user.id))
      : eq(loans.institutionId, institutionId);

    // Query 1: Get loans with resources in parallel with count
    const [loansData, totalResult] = await Promise.all([
      db.query.loans.findMany({
        where: baseWhere,
        with: {
          staff: true,
          loanResources: {
            with: {
              resource: {
                with: { category: true },
              },
            },
          },
        },
        orderBy: (loans, { desc }) => [desc(loans.loanDate)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)` }).from(loans).where(baseWhere),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);

    // Collect referenced IDs for batch queries
    const details = loansData.map((l) => (l.purposeDetails ?? {}) as any);
    const gradeIds = [...new Set(details.map((d) => d.gradeId).filter(Boolean))] as string[];
    const sectionIds = [...new Set(details.map((d) => d.sectionId).filter(Boolean))] as string[];
    const areaIds = [...new Set(details.map((d) => d.curricularAreaId).filter(Boolean))] as string[];
    const userIds = [
      ...new Set(
        loansData
          .filter((l) => !l.staffId && l.requestedByUserId)
          .map((l) => l.requestedByUserId as string)
      ),
    ];

    // Query 2: Batch query for ALL related data in parallel
    const [gradesData, sectionsData, areasData, usersResult] = await Promise.all([
      gradeIds.length > 0
        ? db.query.grades.findMany({ where: inArray(grades.id, gradeIds) })
        : Promise.resolve([]),
      sectionIds.length > 0
        ? db.query.sections.findMany({ where: inArray(sections.id, sectionIds) })
        : Promise.resolve([]),
      areaIds.length > 0
        ? db.query.curricularAreas.findMany({ where: inArray(curricularAreas.id, areaIds) })
        : Promise.resolve([]),
      userIds.length > 0
        ? db.query.users.findMany({ where: inArray(users.id, userIds) })
        : Promise.resolve([]),
    ]);

    // Build lookup maps
    const gradeMap = new Map(gradesData.map((g) => [g.id, g.name]));
    const sectionMap = new Map(sectionsData.map((s) => [s.id, s.name]));
    const areaMap = new Map(areasData.map((a) => [a.id, a.name]));
    const userMap = new Map(usersResult.map((u) => [u.id, u.name]));

    // Calculate overdue status
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = loansData.map((loan) => {
      const loanDate = new Date(loan.loanDate ?? new Date());
      loanDate.setHours(0, 0, 0, 0);

      const d = (loan.purposeDetails ?? {}) as any;

      // Calculate status: if active and past due date, show as overdue
      const calculatedStatus =
        loan.status === 'active' && loanDate < today ? 'overdue' : loan.status;

      return {
        id: loan.id,
        institutionId: loan.institutionId,
        staffId: loan.staffId,
        requestedByUserId: loan.requestedByUserId ?? null,
        staffName:
          loan.staff?.name ??
          (loan.requestedByUserId ? userMap.get(loan.requestedByUserId) : undefined),
        staffArea: loan.staff?.area,
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
          brand: lr.resource.brand,
          model: lr.resource.model,
          status: lr.resource.status,
          internalId: lr.resource.internalId,
          category: lr.resource.category
            ? { name: lr.resource.category.name, color: lr.resource.category.color }
            : undefined,
        })),
        damageReports: loan.damageReports,
        suggestionReports: loan.suggestionReports,
      };
    });

    console.log(`[TIMING] loans GET: ${Date.now() - start}ms`);
    return paginatedResponse(data, {
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.log(`[TIMING] loans GET ERROR: ${Date.now() - start}ms`);
    return errorResponse(error);
  }
}

// POST /api/loans - Create loan
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(createLoanSchema, body);

    const isDocente = user.role === 'docente';

    // Validate resource availability
    if (data.resourceIds.length > 0) {
      const resourcesData = await db.query.resources.findMany({
        where: and(
          eq(resources.institutionId, institutionId),
          inArray(resources.id, data.resourceIds)
        ),
      });

      // Check if all requested resources exist
      if (resourcesData.length !== data.resourceIds.length) {
        throw new ValidationError('Uno o más recursos solicitados no existen en la institución');
      }

      // Check if all resources are available
      for (const resource of resourcesData) {
        if (resource.status !== 'disponible') {
          throw new ValidationError(
            `El recurso "${resource.name}" no está disponible (Estado: ${resource.status})`
          );
        }
      }
    }

    // Create loan in transaction
    const loanId = randomUUID();

    await db.transaction(async (tx) => {
      // Insert loan
      await tx.insert(loans).values({
        id: loanId,
        institutionId,
        staffId: data.staffId || null,
        requestedByUserId: user.id,
        status: 'active', // ALWAYS 'active' on create
        approvalStatus: isDocente ? 'pending' : 'approved', // Depends on role
        purpose: data.purpose || null,
        notes: data.notes || null,
        studentPickupNote: data.studentPickupNote || null,
        loanDate: new Date(),
        returnDate: null,
        purposeDetails: {
          gradeId: data.gradeId,
          sectionId: data.sectionId,
          curricularAreaId: data.curricularAreaId,
        },
      });

      // Insert loan resources
      if (data.resourceIds.length > 0) {
        const loanResourcesValues = data.resourceIds.map((resourceId) => ({
          id: randomUUID(),
          loanId,
          resourceId,
        }));
        await tx.insert(loanResources).values(loanResourcesValues);

        // Mark resources as 'prestado' immediately (prevents double-booking)
        await tx
          .update(resources)
          .set({ status: 'prestado' })
          .where(
            and(eq(resources.institutionId, institutionId), inArray(resources.id, data.resourceIds))
          );
      }
    });

    // Fetch created loan with relations
    const createdLoan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
      with: {
        staff: true,
        loanResources: {
          with: {
            resource: {
              with: { category: true },
            },
          },
        },
      },
    });

    return successResponse(createdLoan, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
