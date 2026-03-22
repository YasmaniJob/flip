import { Injectable, Inject } from "@nestjs/common";
import { DRIZZLE } from "../database/database.module";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { educationInstitutionsMinedu } from "../database/schema";
import { ilike, eq, and, or, sql } from "drizzle-orm";
import * as schema from "../database/schema";
import * as crypto from "crypto";
// SeedDefaultCategoriesUseCase import removed
import { CreateCategoryCommand } from "../application/use-cases/categories/commands/create-category.command";
import { InstitutionId } from "@flip/shared";
import { ResourceTemplatesService } from "../resource-templates/resource-templates.service";

interface SearchParams {
  query?: string;
  nivel?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  limit: number;
  offset?: number;
}

@Injectable()
export class InstitutionsService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly createCategoryCommand: CreateCategoryCommand,
    private readonly resourceTemplatesService: ResourceTemplatesService,
  ) {}

  // [service] Updated search method with pagination and sorting
  async search(params: SearchParams) {
    const { query, nivel, departamento, limit, offset = 0 } = params;

    const conditions = [];

    if (query && query.trim()) {
      const q = query.trim();
      const terms = q.split(/\s+/).filter((t) => t.length > 0);

      // For each word, it must match either name or code
      terms.forEach((term) => {
        conditions.push(
          or(
            ilike(educationInstitutionsMinedu.nombre, `%${term}%`),
            ilike(educationInstitutionsMinedu.codigoModular, `%${term}%`),
          ),
        );
      });
    }

    if (nivel && nivel.trim()) {
      conditions.push(ilike(educationInstitutionsMinedu.nivel, nivel.trim()));
    }

    if (departamento && departamento.trim()) {
      conditions.push(
        ilike(educationInstitutionsMinedu.departamento, departamento.trim()),
      );
    }

    if (params.provincia && params.provincia.trim()) {
      conditions.push(
        ilike(educationInstitutionsMinedu.provincia, params.provincia.trim()),
      );
    }

    if (params.distrito && params.distrito.trim()) {
      conditions.push(
        ilike(educationInstitutionsMinedu.distrito, params.distrito.trim()),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(educationInstitutionsMinedu)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    const items = await this.db
      .select({
        codigoModular: educationInstitutionsMinedu.codigoModular,
        nombre: educationInstitutionsMinedu.nombre,
        nivel: educationInstitutionsMinedu.nivel,
        tipoGestion: educationInstitutionsMinedu.tipoGestion,
        departamento: educationInstitutionsMinedu.departamento,
        provincia: educationInstitutionsMinedu.provincia,
        distrito: educationInstitutionsMinedu.distrito,
        direccion: educationInstitutionsMinedu.direccion,
      })
      .from(educationInstitutionsMinedu)
      .where(whereClause)
      .orderBy(educationInstitutionsMinedu.nombre) // Alphabetical sorting
      .limit(limit)
      .offset(offset);

    return { items, total };
  }

  async getDepartamentos() {
    const results = await this.db
      .selectDistinct({
        departamento: educationInstitutionsMinedu.departamento,
      })
      .from(educationInstitutionsMinedu)
      .where(sql`${educationInstitutionsMinedu.departamento} IS NOT NULL`)
      .orderBy(educationInstitutionsMinedu.departamento);

    return results.map((r) => r.departamento).filter(Boolean);
  }

  async getProvincias(departamento: string) {
    const results = await this.db
      .selectDistinct({ provincia: educationInstitutionsMinedu.provincia })
      .from(educationInstitutionsMinedu)
      .where(
        and(
          sql`${educationInstitutionsMinedu.provincia} IS NOT NULL`,
          ilike(educationInstitutionsMinedu.departamento, departamento.trim()),
        ),
      )
      .orderBy(educationInstitutionsMinedu.provincia);

    return results.map((r) => r.provincia).filter(Boolean);
  }

  async getDistritos(departamento: string, provincia: string) {
    const results = await this.db
      .selectDistinct({ distrito: educationInstitutionsMinedu.distrito })
      .from(educationInstitutionsMinedu)
      .where(
        and(
          sql`${educationInstitutionsMinedu.distrito} IS NOT NULL`,
          ilike(educationInstitutionsMinedu.departamento, departamento.trim()),
          ilike(educationInstitutionsMinedu.provincia, provincia.trim()),
        ),
      )
      .orderBy(educationInstitutionsMinedu.distrito);

    return results.map((r) => r.distrito).filter(Boolean);
  }

  async onboardUser(
    userId: string,
    data: {
      codigoModular: string;
      nivel: string;
      nombre?: string;
      departamento?: string;
      provincia?: string;
      distrito?: string;
      isManual?: boolean;
    },
  ) {
    const { codigoModular, nivel, isManual } = data;

    // 1. Find existing institution by codigoModular
    let institution = await this.db.query.institutions.findFirst({
      where: eq(schema.institutions.codigoModular, codigoModular),
    });

    // 2. If not exists, create it
    if (!institution) {
      let name = "";
      let location = {};

      if (isManual) {
        // Manual creation logic
        name = data.nombre || "Institución sin nombre";
        location = {
          departamento: data.departamento,
          provincia: data.provincia,
          distrito: data.distrito,
        };
      } else {
        // MINEDU lookup logic
        const minedu =
          await this.db.query.educationInstitutionsMinedu.findFirst({
            where: eq(
              schema.educationInstitutionsMinedu.codigoModular,
              codigoModular,
            ),
          });

        if (!minedu) {
          throw new Error("Institución no encontrada en registro MINEDU");
        }
        name = minedu.nombre;
        location = {
          departamento: minedu.departamento,
          provincia: minedu.provincia,
          distrito: minedu.distrito,
          direccion: minedu.direccion,
        };
      }

      const slug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") +
        "-" +
        Math.random().toString(36).substring(2, 7);

      const trialDays = 15;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

      const [newInst] = await this.db
        .insert(schema.institutions)
        .values({
          id: crypto.randomUUID(),
          codigoModular: codigoModular, // Use provided code (official or manual-generated)
          name: name,
          slug: slug,
          nivel: nivel,
          subscriptionStatus: "trial",
          trialEndsAt: trialEndsAt,
          settings: {
            location: location,
          },
        })
        .returning();

      institution = newInst;

      // AUTO-SEED DEFAULT CATEGORIES for new institution
      try {
        // Import DEFAULT_CATEGORIES and loop
        const { DEFAULT_CATEGORIES } =
          await import("../categories/constants/default-categories.const");
        const { DEFAULT_TEMPLATES } =
          await import("../resource-templates/constants/default-templates.const");

        let seededCount = 0;
        for (const cat of DEFAULT_CATEGORIES) {
          const newCat = await this.createCategoryCommand.execute({
            institutionId: institution.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
          });

          const defaultTemplatesForCat = DEFAULT_TEMPLATES[cat.name];
          if (defaultTemplatesForCat) {
            for (const temp of defaultTemplatesForCat) {
              await this.resourceTemplatesService.create(institution.id, {
                categoryId: newCat.id,
                name: temp.name,
                icon: temp.icon,
                isDefault: true,
                sortOrder: 0,
              });
            }
          }
          seededCount++;
        }
      } catch (seedError) {
        console.error(
          `[InstitutionsService] Failed to seed categories for institution ${institution.id}:`,
          seedError,
        );
      }
    }

    // 3. Update User and assign role
    const userCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users)
      .where(eq(schema.users.institutionId, institution.id));

    const totalUsersResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users);

    const isFirstUserInInstitution = Number(userCountResult[0].count) === 0;
    const isFirstUserInSystem = Number(totalUsersResult[0].count) === 1;

    // Get current user to preserve existing isSuperAdmin status
    const currentUser = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    const assignedRole = isFirstUserInInstitution ? "superadmin" : "admin";
    // Only grant superadmin if it's the very first user OR if user already has it
    const shouldBeSuperAdmin =
      isFirstUserInSystem || currentUser?.isSuperAdmin === true;

    await this.db
      .update(schema.users)
      .set({
        institutionId: institution.id,
        role: assignedRole,
        isSuperAdmin: shouldBeSuperAdmin,
      })
      .where(eq(schema.users.id, userId));

    return institution;
  }

  async getById(id: string) {
    return this.db.query.institutions.findFirst({
      where: eq(schema.institutions.id, id),
    });
  }

  async updateBrand(
    institutionId: string,
    brandColor?: string,
    logoUrl?: string,
  ) {
    const institution = await this.db.query.institutions.findFirst({
      where: eq(schema.institutions.id, institutionId),
    });

    if (!institution) {
      throw new Error("Institution not found");
    }

    const currentSettings = (institution.settings as any) || {};
    const newSettings = {
      ...currentSettings,
      ...(brandColor !== undefined && { brandColor: brandColor || null }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
    };

    await this.db
      .update(schema.institutions)
      .set({ settings: newSettings })
      .where(eq(schema.institutions.id, institutionId));
  }
}
