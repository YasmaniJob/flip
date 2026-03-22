import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql, like, or } from 'drizzle-orm';
import * as schema from '../../../../database/schema';
import { IResourceRepository } from '../../../../core/ports/outbound/resource.repository';
import { Resource } from '../../../../core/domain/entities/resource.entity';
import { ResourceStatus, ResourceCondition } from '@flip/shared';
import { DRIZZLE } from '../../../../database/database.module';

@Injectable()
export class DrizzleResourceRepository implements IResourceRepository {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    // ── Mappers ────────────────────────────────────────────────────────────────

    /** Convierte una fila de DB al dominio Resource. */
    private toDomain(row: typeof schema.resources.$inferSelect): Resource {
        return Resource.reconstitute({
            id: row.id,
            institutionId: row.institutionId,
            internalId: row.internalId ?? '',
            name: row.name,
            categoryId: row.categoryId ?? undefined,
            templateId: row.templateId ?? undefined,
            brand: row.brand ?? undefined,
            model: row.model ?? undefined,
            serialNumber: row.serialNumber ?? undefined,
            status: (row.status ?? 'disponible') as ResourceStatus,
            condition: (row.condition ?? 'bueno') as ResourceCondition,
            stock: row.stock ?? 0,
            notes: row.notes ?? undefined,
            attributes: (row.attributes ?? {}) as Record<string, any>,
            maintenanceProgress: row.maintenanceProgress ?? 0,
            maintenanceState: row.maintenanceState ?? null,
            createdAt: row.createdAt ?? new Date(),
            // @ts-ignore - updatedAt no está en el schema todavía
            updatedAt: row.createdAt ?? new Date(),
        });
    }

    /**
     * Construye el objeto de patch para Drizzle a partir de un Partial<Resource>.
     *
     * Solo incluye las claves que están DEFINIDAS (≠ undefined), lo que garantiza
     * que un PATCH parcial nunca sobreescribe datos existentes con undefined.
     *
     * ⚠️ Regla: cada nuevo campo del schema `resources` DEBE agregarse aquí
     *    para que los updates futuros lo persistan correctamente.
     */
    private toDbPatch(
        data: Partial<Resource>,
    ): Partial<typeof schema.resources.$inferInsert> {
        const patch: Partial<typeof schema.resources.$inferInsert> = {};

        // ── Campos base ───────────────────────────────────────────────────────
        if (data.name         !== undefined) patch.name         = data.name;
        if (data.categoryId   !== undefined) patch.categoryId   = data.categoryId;
        if (data.templateId   !== undefined) patch.templateId   = data.templateId;
        if (data.internalId   !== undefined) patch.internalId   = data.internalId;
        if (data.brand        !== undefined) patch.brand        = data.brand;
        if (data.model        !== undefined) patch.model        = data.model;
        if (data.serialNumber !== undefined) patch.serialNumber = data.serialNumber;
        if (data.status       !== undefined) patch.status       = data.status;
        if (data.condition    !== undefined) patch.condition    = data.condition;
        if (data.stock        !== undefined) patch.stock        = data.stock;
        if (data.notes        !== undefined) patch.notes        = data.notes;
        if (data.attributes   !== undefined) patch.attributes   = data.attributes;

        // ── Campos de mantenimiento ───────────────────────────────────────────
        // Nota: null es un valor válido para maintenanceState (limpia el estado
        // al finalizar el mantenimiento), por eso se usa !== undefined en vez de
        // un check de truthiness.
        if (data.maintenanceProgress !== undefined) patch.maintenanceProgress = data.maintenanceProgress;
        if (data.maintenanceState    !== undefined) patch.maintenanceState    = data.maintenanceState;

        return patch;
    }

    // ── Escritura ──────────────────────────────────────────────────────────────

    async save(resource: Resource): Promise<Resource> {
        await this.db
            .insert(schema.resources)
            .values({
                id: resource.id,
                institutionId: resource.institutionId,
                internalId: resource.internalId,
                categoryId: resource.categoryId,
                templateId: resource.templateId,
                name: resource.name,
                brand: resource.brand,
                model: resource.model,
                serialNumber: resource.serialNumber,
                status: resource.status,
                condition: resource.condition,
                stock: resource.stock,
                notes: resource.notes,
                attributes: resource.attributes,
                maintenanceProgress: resource.maintenanceProgress ?? 0,
                maintenanceState: resource.maintenanceState ?? null,
                createdAt: resource.createdAt,
            })
            .onConflictDoUpdate({
                target: schema.resources.id,
                set: {
                    name: resource.name,
                    categoryId: resource.categoryId,
                    templateId: resource.templateId,
                    brand: resource.brand,
                    model: resource.model,
                    serialNumber: resource.serialNumber,
                    status: resource.status,
                    condition: resource.condition,
                    stock: resource.stock,
                    notes: resource.notes,
                    attributes: resource.attributes,
                    maintenanceProgress: resource.maintenanceProgress ?? 0,
                    maintenanceState: resource.maintenanceState ?? null,
                },
            });

        return resource;
    }

    async update(
        institutionId: string,
        id: string,
        data: Partial<Resource>,
    ): Promise<Resource> {
        const patch = this.toDbPatch(data);

        // Si no hay nada que cambiar, evitamos el round-trip innecesario a la DB
        if (Object.keys(patch).length === 0) {
            const existing = await this.findById(id, institutionId);
            if (!existing) {
                throw new Error(`Resource with id ${id} not found for institution ${institutionId}`);
            }
            return existing;
        }

        const [updated] = await this.db
            .update(schema.resources)
            .set(patch)
            .where(
                and(
                    eq(schema.resources.id, id),
                    eq(schema.resources.institutionId, institutionId),
                ),
            )
            .returning();

        if (!updated) {
            throw new Error(`Resource with id ${id} not found for institution ${institutionId}`);
        }

        return this.toDomain(updated);
    }

    // ── Lectura ────────────────────────────────────────────────────────────────

    async findById(id: string, institutionId: string): Promise<Resource | null> {
        const result = await this.db.query.resources.findFirst({
            where: and(
                eq(schema.resources.id, id),
                eq(schema.resources.institutionId, institutionId),
            ),
        });
        return result ? this.toDomain(result) : null;
    }

    async findManyByIds(institutionId: string, ids: string[]): Promise<Resource[]> {
        if (ids.length === 0) return [];
        const results = await this.db.query.resources.findMany({
            where: and(
                eq(schema.resources.institutionId, institutionId),
                sql`${schema.resources.id} IN ${ids}`,
            ),
        });
        return results.map(row => this.toDomain(row));
    }

    async findAll(
        institutionId: string,
        filters?: {
            search?: string;
            categoryId?: string;
            status?: string;
            condition?: string;
        },
    ): Promise<Resource[]> {
        const conditions = [eq(schema.resources.institutionId, institutionId)];

        if (filters?.categoryId) conditions.push(eq(schema.resources.categoryId, filters.categoryId));
        if (filters?.status)     conditions.push(eq(schema.resources.status, filters.status));
        if (filters?.condition)  conditions.push(eq(schema.resources.condition, filters.condition));

        if (filters?.search) {
            const term = `%${filters.search}%`;
            conditions.push(
                or(
                    like(schema.resources.name, term),
                    like(schema.resources.brand, term),
                    like(schema.resources.model, term),
                    like(schema.resources.serialNumber, term),
                    like(schema.resources.internalId, term),
                )!,
            );
        }

        const results = await this.db.query.resources.findMany({
            where: and(...conditions),
            orderBy: (r, { asc }) => [asc(r.internalId), asc(r.createdAt)],
        });

        return results.map(row => this.toDomain(row));
    }

    async delete(id: string, institutionId: string): Promise<void> {
        await this.db
            .delete(schema.resources)
            .where(
                and(
                    eq(schema.resources.id, id),
                    eq(schema.resources.institutionId, institutionId),
                ),
            );
    }

    // ── Operaciones masivas ────────────────────────────────────────────────────

    async updateManyStatus(institutionId: string, ids: string[], status: string): Promise<void> {
        if (ids.length === 0) return;
        await this.db
            .update(schema.resources)
            .set({ status: status as any })
            .where(
                and(
                    eq(schema.resources.institutionId, institutionId),
                    sql`${schema.resources.id} IN ${ids}`,
                ),
            );
    }

    // ── Secuencias ─────────────────────────────────────────────────────────────

    async getNextSequence(institutionId: string, prefix: string): Promise<number> {
        const result = await this.db
            .insert(schema.categorySequences)
            .values({
                id: crypto.randomUUID(),
                institutionId,
                categoryPrefix: prefix,
                lastNumber: 1,
            })
            .onConflictDoUpdate({
                target: [
                    schema.categorySequences.institutionId,
                    schema.categorySequences.categoryPrefix,
                ],
                set: { lastNumber: sql`${schema.categorySequences.lastNumber} + 1` },
            })
            .returning({ nextNumber: schema.categorySequences.lastNumber });

        return result[0].nextNumber;
    }

    // ── Estadísticas ───────────────────────────────────────────────────────────

    async getStats(institutionId: string): Promise<{
        total: number;
        disponible: number;
        prestado: number;
        mantenimiento: number;
        baja: number;
    }> {
        const where = (extraStatus?: string) =>
            extraStatus
                ? and(
                      eq(schema.resources.institutionId, institutionId),
                      eq(schema.resources.status, extraStatus),
                  )
                : eq(schema.resources.institutionId, institutionId);

        const [total, disponible, prestado, mantenimiento, baja] = await Promise.all([
            this.db.select({ count: sql<number>`count(*)` }).from(schema.resources).where(where()),
            this.db.select({ count: sql<number>`count(*)` }).from(schema.resources).where(where('disponible')),
            this.db.select({ count: sql<number>`count(*)` }).from(schema.resources).where(where('prestado')),
            this.db.select({ count: sql<number>`count(*)` }).from(schema.resources).where(where('mantenimiento')),
            this.db.select({ count: sql<number>`count(*)` }).from(schema.resources).where(where('baja')),
        ]);

        return {
            total:         Number(total[0]?.count        || 0),
            disponible:    Number(disponible[0]?.count   || 0),
            prestado:      Number(prestado[0]?.count     || 0),
            mantenimiento: Number(mantenimiento[0]?.count || 0),
            baja:          Number(baja[0]?.count         || 0),
        };
    }
}
