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
import { getTrialDays } from '@/lib/trial-config';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// POST /api/institutions/onboard - Complete user onboarding
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    const body = await request.json();
    const data = validateBody(onboardSchema, body);

    if (user.institutionId) {
      throw new ValidationError('El usuario ya tiene una institución asignada');
    }

    const { codigoModular, nivel, isManual } = data;

    /**
     * 🧠 PERMANENT ARCHITECTURE: Reduced Round-Trip Logic
     * We determine system state BEFORE the transaction where possible.
     */
    const institutionExists = await db.query.institutions.findFirst({
      where: eq(institutions.codigoModular, codigoModular),
      columns: { id: true, name: true }
    });

    let institutionId = institutionExists?.id;

    if (!institutionId) {
      // 1. Resolve data from Turso or input
      let name = '';
      let location = {};

      if (isManual) {
        name = data.nombre || 'Institución sin nombre';
        location = { depto: data.departamento, prov: data.provincia, dist: data.distrito };
      } else {
        const [minedu] = await turso
          .select()
          .from(educationInstitutionsMinedu)
          .where(eq(educationInstitutionsMinedu.codigoModular, codigoModular))
          .limit(1);

        if (!minedu) throw new ValidationError('Institución no encontrada en registro MINEDU');
        name = minedu.nombre;
        location = {
          departamento: minedu.departamento,
          provincia: minedu.provincia,
          distrito: minedu.distrito,
          direccion: minedu.direccion,
        };
      }

      const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
      
      // Get dynamic trial days from configuration
      const trialDays = await getTrialDays();
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

      /**
       * ⚡ OPTIMIZED TRANSACTION
       * We consolidate logic to reduce Neon connection holding time.
       */
      const result = await db.transaction(async (tx) => {
        const [newInst] = await tx
          .insert(institutions)
          .values({
            id: randomUUID(),
            codigoModular,
            name,
            slug,
            nivel,
            subscriptionStatus: 'trial',
            trialEndsAt,
            settings: { location },
          })
          .returning();

        // Update user atomically - user creating institution becomes admin
        await tx
          .update(users)
          .set({
            institutionId: newInst.id,
            role: 'admin', // Admin of their own institution (not superadmin)
          })
          .where(eq(users.id, user.id));

        return newInst;
      });
      
      institutionId = result.id;
    } else {
      // Institution exists: Just join it as admin (since it already belongs to someone else)
      await db.update(users)
        .set({ institutionId: institutionId, role: 'admin' })
        .where(eq(users.id, user.id));
    }

    /**
     * 🔐 SESSION REFRESH (Multi-tenancy Sync)
     * CRITICAL: We need to invalidate the session after role change
     * so Better Auth creates a new session with the updated role
     */
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionToken = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('better-auth.session_token=') || c.trim().startsWith('__Secure-better-auth.session_token='))
      ?.split('=')[1];

    if (sessionToken) {
      // Delete old session to force re-authentication with new role
      await db.delete(sessions)
        .where(eq(sessions.token, decodeURIComponent(sessionToken)));
    }

    const response = successResponse({ 
      id: institutionId, 
      success: true,
      requiresReauth: true, // Signal frontend to re-authenticate
    }, 201);
    
    // Clear session cookies to force re-login
    response.cookies.delete('better-auth.session_token');
    response.cookies.delete('__Secure-better-auth.session_token');
    response.cookies.delete('better-auth.session_data');
    response.cookies.delete('__Secure-better-auth.session_data');
    
    return response;
  } catch (error) {
    console.error('[Onboard] Critical Error:', error);
    return errorResponse(error);
  }
}
