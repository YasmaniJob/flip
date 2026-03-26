import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { turso } from '@/lib/db/turso';
import {
  institutions,
  users,
  sessions,
} from '@/lib/db/schema';
import { educationInstitutionsMinedu } from '@/lib/db/schema-turso';
import { requireAuth } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { onboardSchema } from '@/lib/validations/schemas/institutions';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { ValidationError } from '@/lib/utils/errors';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// POST /api/institutions/onboard - Complete user onboarding
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    const body = await request.json();
    const data = validateBody(onboardSchema, body);

    // Validate user doesn't already have an institution
    if (user.institutionId) {
      throw new ValidationError('El usuario ya tiene una institución asignada');
    }

    const { codigoModular, nivel, isManual } = data;

    // 1. Find existing institution by codigoModular
    let institution = await db.query.institutions.findFirst({
      where: eq(institutions.codigoModular, codigoModular),
    });

    // 2. If not exists, create it
    if (!institution) {
      let name = '';
      let location = {};

      if (isManual) {
        // Manual creation logic
        name = data.nombre || 'Institución sin nombre';
        location = {
          departamento: data.departamento,
          provincia: data.provincia,
          distrito: data.distrito,
        };
      } else {
        // MINEDU lookup logic
        const [minedu] = await turso
          .select()
          .from(educationInstitutionsMinedu)
          .where(eq(educationInstitutionsMinedu.codigoModular, codigoModular))
          .limit(1);

        if (!minedu) {
          throw new ValidationError('Institución no encontrada en registro MINEDU');
        }

        name = minedu.nombre;
        location = {
          departamento: minedu.departamento,
          provincia: minedu.provincia,
          distrito: minedu.distrito,
          direccion: minedu.direccion,
        };
      }

      // Generate unique slug
      const slug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') +
        '-' +
        Math.random().toString(36).substring(2, 7);

      // Calculate trial period
      const trialDays = 15;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

      // TRANSACTION: Create institution + Update user
      institution = await db.transaction(async (tx) => {
        // Insert institution
        const [newInst] = await tx
          .insert(institutions)
          .values({
            id: randomUUID(),
            codigoModular: codigoModular,
            name: name,
            slug: slug,
            nivel: nivel,
            subscriptionStatus: 'trial',
            trialEndsAt: trialEndsAt,
            settings: {
              location: location,
            },
          })
          .returning();

        // Count users in institution (should be 0 for new institution)
        const userCountResult = await tx
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(eq(users.institutionId, newInst.id));

        const isFirstUserInInstitution = Number(userCountResult[0].count) === 0;

        // Count total users in system (user already exists, so should be >= 1)
        const totalUsersResult = await tx
          .select({ count: sql<number>`count(*)` })
          .from(users);

        const isFirstUserInSystem = Number(totalUsersResult[0].count) === 1;

        // Get current user to preserve existing isSuperAdmin status
        const currentUser = await tx.query.users.findFirst({
          where: eq(users.id, user.id),
        });

        // Determine role and superadmin status
        const assignedRole = isFirstUserInInstitution ? 'superadmin' : 'admin';
        const shouldBeSuperAdmin =
          isFirstUserInSystem || currentUser?.isSuperAdmin === true;

        // Update user with institution, role, and isSuperAdmin
        await tx
          .update(users)
          .set({
            institutionId: newInst.id,
            role: assignedRole,
            isSuperAdmin: shouldBeSuperAdmin,
          })
          .where(eq(users.id, user.id));

        return newInst;
      });

      // NOTE: Categories are no longer auto-seeded during onboarding.
      // Users must manually import or create categories in Settings > Categorías
      console.log(`[Onboard] Institution created: ${institution.id}. Categories must be configured manually.`);
    } else {
      // Institution exists, just update user
      // Count users in institution
      const userCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.institutionId, institution.id));

      const isFirstUserInInstitution = Number(userCountResult[0].count) === 0;

      // Count total users in system
      const totalUsersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);

      const isFirstUserInSystem = Number(totalUsersResult[0].count) === 1;

      // Get current user to preserve existing isSuperAdmin status
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
      });

      // Determine role and superadmin status
      const assignedRole = isFirstUserInInstitution ? 'superadmin' : 'admin';
      const shouldBeSuperAdmin =
        isFirstUserInSystem || currentUser?.isSuperAdmin === true;

      // Update user
      await db
        .update(users)
        .set({
          institutionId: institution.id,
          role: assignedRole,
          isSuperAdmin: shouldBeSuperAdmin,
        })
        .where(eq(users.id, user.id));
    }


    // Invalidar sesión actual para forzar refresh
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionToken = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('better-auth.session_token=') || c.trim().startsWith('__Secure-better-auth.session_token='))
      ?.split('=')[1];

    if (sessionToken) {
      await db.update(sessions)
        .set({ 
          activeInstitutionId: institution.id,
          updatedAt: new Date()
        })
        .where(eq(sessions.token, decodeURIComponent(sessionToken)));
    }

    // Modificamos el response final para limpiar la caché de cookies de Better Auth
    const response = successResponse(institution, 201);
    response.cookies.delete('better-auth.session_data');
    response.cookies.delete('__Secure-better-auth.session_data');
    return response;
  } catch (error) {
    console.error('[Onboard] Error:', error);
    return errorResponse(error);
  }
}
