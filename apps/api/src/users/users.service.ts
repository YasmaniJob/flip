import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { DRIZZLE } from "../database/database.module";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../database/schema";
import { eq, sql, asc } from "drizzle-orm";
import { PaginationDto } from "../common/dto/pagination.dto";
import { PaginatedResult } from "../common/interfaces/paginated-result.interface";

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Check if this is the first user in the system
   * NOTE: This is called AFTER the user is created, so we check if count === 1
   */
  async isFirstUser(): Promise<boolean> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users);

    return Number(result[0]?.count || 0) === 1; // Changed from === 0 to === 1
  }

  /**
   * Count total users in system
   */
  async countUsers(): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users);

    return Number(result[0]?.count || 0);
  }

  /**
   * Toggle SuperAdmin status for a user
   * Should only be called by another SuperAdmin
   */
  async toggleSuperAdmin(userId: string, enabled: boolean): Promise<void> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.db
      .update(schema.users)
      .set({ isSuperAdmin: enabled })
      .where(eq(schema.users.id, userId));
  }

  /**
   * Update user settings
   */
  async updateSettings(userId: string, settings: any): Promise<void> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Merge existing settings if they exist
    const currentSettings = (user.settings as any) || {};
    const newSettings = { ...currentSettings, ...settings };

    await this.db
      .update(schema.users)
      .set({ settings: newSettings })
      .where(eq(schema.users.id, userId));
  }

  /**
   * Update user by ID
   */
  async getById(userId: string) {
    return this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
  }

  /**
   * Update user name
   */
  async updateName(userId: string, name: string): Promise<void> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.db
      .update(schema.users)
      .set({ name })
      .where(eq(schema.users.id, userId));
  }

  async findAll(
    institutionId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<typeof schema.users.$inferSelect>> {
    const { limit = 10, page = 1 } = pagination;
    const offset = (page - 1) * limit;

    const whereCondition = eq(schema.users.institutionId, institutionId);

    const [results, totalResult] = await Promise.all([
      this.db
        .select()
        .from(schema.users)
        .where(whereCondition)
        .limit(limit)
        .offset(offset)
        .orderBy(asc(schema.users.name)),

      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.users)
        .where(whereCondition),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: results,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}
