import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { eq, and, ilike, or, sql, desc, count, inArray } from 'drizzle-orm';
import { CreateStaffInput } from '@flip/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class StaffService {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    async findByEmail(institutionId: string, email: string) {
        return this.db.query.staff.findFirst({
            where: (staff, { eq, and }) =>
                and(
                    eq(staff.institutionId, institutionId),
                    eq(staff.email, email)
                )
        });
    }

    async create(institutionId: string, input: CreateStaffInput) {
        const staffId = randomUUID();

        // Check if email exists if provided
        if (input.email) {
            const existing = await this.db.query.staff.findFirst({
                where: (staff, { eq, and }) =>
                    and(
                        eq(staff.institutionId, institutionId),
                        eq(staff.email, input.email!)
                    )
            });

            if (existing) {
                throw new BadRequestException('El email ya está registrado en esta institución');
            }
        }

        // Check if DNI exists if provided
        if (input.dni) {
            const existingDni = await this.db.query.staff.findFirst({
                where: (staff, { eq, and }) =>
                    and(
                        eq(staff.institutionId, institutionId),
                        eq(staff.dni, input.dni!)
                    )
            });

            if (existingDni) {
                throw new BadRequestException('El DNI ya está registrado en esta institución');
            }
        }

        const [newStaff] = await this.db.insert(schema.staff).values({
            id: staffId,
            institutionId,
            name: input.name,
            dni: input.dni || null,
            email: input.email || null,
            phone: input.phone || null,
            area: input.area || null,
            role: input.role,
            status: 'active',
        }).returning();

        return newStaff;
    }

    async bulkCreate(institutionId: string, inputs: CreateStaffInput[]) {
        if (inputs.length === 0) return [];

        // Validate duplicates within the batch? 
        // For now, let's assume the client handles some validation or we let DB throw errors?
        // Better to process them and filter out bad ones or fail usage.
        // Simple approach: batch insert, if generic error, throw.
        // ideally we map them to insert objects.

        const values = inputs.map(input => ({
            id: randomUUID(),
            institutionId,
            name: input.name,
            dni: input.dni || null,
            email: input.email || null,
            phone: input.phone || null,
            area: input.area || null,
            role: input.role,
            status: 'active',
        }));

        // Use onConflictDoNothing or allow failure?
        // If we want to return results, we might need chunking or transaction.
        // For simplicity in a "bulk import", usually we want to know what failed.
        // But for MVP, let's just insert all and assume the frontend validated pre-duplicates.

        // We can optimize by checking existing emails/dnis in one query if needed.

        return await this.db.insert(schema.staff).values(values).returning();
    }

    async findAll(
        institutionId: string,
        params: {
            page: number;
            limit: number;
            search?: string;
            role?: string;
            status?: string;
            includeAdmins?: boolean;
        }
    ) {
        const { page = 1, limit = 10, search, role, status, includeAdmins } = params;
        const offset = (page - 1) * limit;

        // Build where conditions
        const conditions = [eq(schema.staff.institutionId, institutionId)];

        if (search) {
            const searchLower = `%${search.toLowerCase()}%`;
            conditions.push(
                or(
                    ilike(schema.staff.name, searchLower),
                    ilike(schema.staff.dni, searchLower),
                    ilike(schema.staff.email, searchLower),
                    ilike(schema.staff.area, searchLower)
                )!
            );
        }

        if (role) {
            conditions.push(eq(schema.staff.role, role));
        }

        if (status) {
            conditions.push(eq(schema.staff.status, status));
        }

        const whereClause = and(...conditions);

        // Get total count (only staff for now, strictly speaking pagination with mixed sources is hard)
        // We will just fetch admins and prepend/append them if it's the first page or search
        const [{ value: totalStaff }] = await this.db
            .select({ value: count() })
            .from(schema.staff)
            .where(whereClause);

        // Get paginated staff data
        const staffData = await this.db.query.staff.findMany({
            where: whereClause,
            limit: limit,
            offset: offset,
            orderBy: (staff, { desc }) => [desc(staff.createdAt)], // Show newest first
        });

        let mixedData: any[] = staffData;
        let total = totalStaff;

        // If includeAdmins is true, fetch relevant users
        // Strategy: We'll fetch them all (admins are few) and filter by search if needed.
        // We add them to the result list.
        // Ideally we should do a UNION query but with different table structures it's cleaner to do 2 queries 
        // since admins are expected to be very few (<10).
        if (includeAdmins) {
            const adminConditions: any[] = [
                eq(schema.users.institutionId, institutionId),
                or(eq(schema.users.role, 'admin'), eq(schema.users.isSuperAdmin, true))
            ];

            if (search) {
                const searchLower = `%${search.toLowerCase()}%`;
                adminConditions.push(
                    or(
                        ilike(schema.users.name, searchLower),
                        ilike(schema.users.email, searchLower)
                    )
                );
            }

            const admins = await this.db.query.users.findMany({
                where: and(...adminConditions),
            });

            // Map users to Staff-like structure
            const mappedAdmins = admins.map(u => ({
                id: u.id, // User ID used as Staff ID reference contextually
                institutionId: u.institutionId,
                name: u.name,
                dni: u.dni,
                email: u.email,
                phone: null,
                area: 'Dirección', // Default area for admins
                role: u.isSuperAdmin ? 'SuperAdmin' : 'Admin',
                status: 'active',
                createdAt: u.createdAt,
            }));

            // Merge logic:
            // Since we are doing simple pagination, adding items from another source breaks strict offset calculation.
            // Compromise: We always return all matching admins at the top of the list on the first page.

            // Deduplicate to prevent React duplicate key errors if an admin is also in the staff table
            // with the exact same ID.
            const staffIds = new Set(staffData.map(s => s.id));
            const uniqueAdmins = mappedAdmins.filter(a => !staffIds.has(a.id));

            if (page === 1) {
                mixedData = [...uniqueAdmins, ...staffData];
                total += uniqueAdmins.length;
            } else {
                // For subsequent pages, we effectively largely ignore them unless we want complex valid pagination
                // But since the use case is a dropdown selector that usually searches or shows the first page...
                // This is acceptable for the user requirement.
                total += uniqueAdmins.length;
            }
        }

        const totalPages = Math.ceil(total / limit);

        return {
            data: mixedData,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    async findRecurrent(institutionId: string, limit: number = 6) {
        const recurrentStaff = await this.db
            .select({
                staff: schema.staff,
                loanCount: sql<number>`count(${schema.loans.id})`.mapWith(Number),
            })
            .from(schema.staff)
            .leftJoin(schema.loans, eq(schema.loans.staffId, schema.staff.id))
            .where(
                and(
                    eq(schema.staff.institutionId, institutionId),
                    eq(schema.staff.status, 'active')
                )
            )
            .groupBy(schema.staff.id)
            .orderBy(desc(sql`count(${schema.loans.id})`))
            .limit(limit);

        return recurrentStaff.map(r => r.staff);
    }

    async update(institutionId: string, id: string, input: Partial<CreateStaffInput>) {
        // Verify ownership
        const existing = await this.db.query.staff.findFirst({
            where: (staff, { eq, and }) =>
                and(
                    eq(staff.id, id),
                    eq(staff.institutionId, institutionId)
                )
        });

        if (!existing) {
            throw new BadRequestException('Personal no encontrado');
        }

        // Check duplicates if email/dni changed? 
        // For MVP assuming frontend validation or catching db error, but let's be safe later.

        const [updatedStaff] = await this.db.update(schema.staff)
            .set({
                name: input.name,
                dni: input.dni || null,
                email: input.email || null,
                phone: input.phone || null,
                area: input.area || null,
                role: input.role,
                // updatedAt: new Date(), // If we had this column
            })
            .where(eq(schema.staff.id, id))
            .returning();

        return updatedStaff;
    }

    async findByCriteria(institutionId: string, criteria: { roles?: string[], areas?: string[] }) {
        const { roles = [], areas = [] } = criteria;
        if (roles.length === 0 && areas.length === 0) return [];

        const conditions = [eq(schema.staff.institutionId, institutionId)];
        const criteriaConditions = [];

        if (roles.length > 0) {
            criteriaConditions.push(inArray(schema.staff.role, roles));
        }

        if (areas.length > 0) {
            criteriaConditions.push(inArray(schema.staff.area, areas));
        }

        if (criteriaConditions.length > 0) {
            conditions.push(or(...criteriaConditions)!);
        }

        return await this.db.query.staff.findMany({
            where: and(...conditions),
        });
    }

    async remove(institutionId: string, id: string) {
        const [deleted] = await this.db.delete(schema.staff)
            .where(
                // Ensure we delete only if it belongs to the institution
                // Drizzle verify logic:
                // We can use a subquery or just AND condition if DELETE supports it directly or verify first.
                // delete().where(and(eq(id, id), eq(inst, inst)))

                // Let's rely on standard where composition
                and(
                    eq(schema.staff.id, id),
                    eq(schema.staff.institutionId, institutionId)
                )
            )
            .returning();

        if (!deleted) {
            throw new BadRequestException('Personal no encontrado o no se pudo eliminar');
        }

        return deleted;
    }
}
