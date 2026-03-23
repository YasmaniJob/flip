import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { db } from '@/lib/db';
import { institutions, subscriptionHistory, users as usersTable } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    // Get institution
    const institutionsResult = await db
      .select()
      .from(institutions)
      .where(eq(institutions.id, id))
      .limit(1);

    const institution = institutionsResult[0];

    if (!institution) {
      throw new NotFoundError('Institución no encontrada');
    }

    // Get history - safe: return empty if table doesn't exist or query fails
    let history: any[] = [];
    try {
      history = await db
        .select()
        .from(subscriptionHistory)
        .where(eq(subscriptionHistory.institutionId, id))
        .orderBy(desc(subscriptionHistory.date));
    } catch (histErr: any) {
      console.warn('subscriptionHistory query failed (table may not exist yet):', histErr.message);
    }

    // Get users - safe: return empty if query fails
    let institutionalUsers: any[] = [];
    try {
      institutionalUsers = await db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          role: usersTable.role,
          email: usersTable.email,
          createdAt: usersTable.createdAt,
        })
        .from(usersTable)
        .where(eq(usersTable.institutionId, id))
        .orderBy(desc(usersTable.createdAt));
    } catch (usersErr: any) {
      console.warn('users query failed:', usersErr.message);
    }

    return successResponse({
      ...institution,
      subscriptionHistory: history,
      institutionalUsers,
    });
  } catch (error: any) {
    console.error('[SUBSCRIPTION_GET_ERROR]', error.message, error.stack);
    return NextResponse.json({ 
      error: error.message || 'Error desconocido',
      stack: error.stack,
    }, { status: 500 });
  }
}

const updateSubscriptionSchema = z.object({
  action: z.enum(['extend_trial', 'activate', 'deactivate', 'reset_to_trial']),
  days: z.number().min(1).optional(),
  expiresAt: z.string().optional(),
  plan: z.enum(['mensual', 'bimestral', 'trimestral', 'anual']).optional(),
});

// PATCH /api/admin/subscriptions/[id] - Update institution subscription
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const data = validateBody(updateSubscriptionSchema, body);

    // Verify institution exists
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, id),
    });

    if (!institution) {
      throw new NotFoundError('Institución no encontrada');
    }

    let updateData: any = {};
    let historyEvent: any = null;

    switch (data.action) {
      case 'extend_trial':
        if (!data.days) {
          throw new ValidationError('Se requiere el número de días para extender el trial');
        }
        
        const currentTrialEnd = institution.trialEndsAt || new Date();
        const newTrialEnd = new Date(currentTrialEnd);
        newTrialEnd.setDate(newTrialEnd.getDate() + data.days);

        updateData = {
          subscriptionStatus: 'trial',
          trialEndsAt: newTrialEnd,
        };
        historyEvent = {
          event: 'trial_extended',
          details: `Extendida por ${data.days} días`,
        };
        break;

      case 'activate':
        if (!data.plan && !data.expiresAt) {
          throw new ValidationError('Se requiere un plan o una fecha de vencimiento para activar');
        }

        let calculatedExpiresAt: Date;
        if (data.plan) {
          const daysMap = {
            mensual: 30,
            bimestral: 60,
            trimestral: 90,
            anual: 365,
          };
          const days = daysMap[data.plan];
          calculatedExpiresAt = new Date();
          calculatedExpiresAt.setDate(calculatedExpiresAt.getDate() + days);
        } else {
          calculatedExpiresAt = new Date(data.expiresAt!);
        }

        updateData = {
          subscriptionStatus: 'active',
          subscriptionPlan: data.plan || 'mensual',
          subscriptionStartDate: new Date(),
          trialEndsAt: calculatedExpiresAt, 
          subscriptionEndsAt: calculatedExpiresAt,
        };
        historyEvent = {
          event: 'activated',
          plan: data.plan || 'personalizado',
          details: `Activado hasta ${calculatedExpiresAt.toLocaleDateString()}`,
        };
        break;

      case 'deactivate':
        updateData = {
          subscriptionStatus: 'inactive',
        };
        historyEvent = {
          event: 'deactivated',
          details: 'Suscripción desactivada manualmente',
        };
        break;

      case 'reset_to_trial':
        updateData = {
          subscriptionStatus: 'trial',
          subscriptionPlan: 'trial',
          subscriptionStartDate: null,
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
        historyEvent = {
          event: 'reverted_to_trial',
          details: 'Revertido a estado de prueba (30 días)',
        };
        break;
    }

    const [updated] = await db.transaction(async (tx) => {
      const [res] = await tx
        .update(institutions)
        .set(updateData)
        .where(eq(institutions.id, id))
        .returning();

      if (historyEvent) {
        await tx.insert(subscriptionHistory).values({
          id: crypto.randomUUID(),
          institutionId: id,
          ...historyEvent,
        });
      }
      return [res];
    });

    return successResponse(updated, 'Suscripción actualizada exitosamente');
  } catch (error) {
    return errorResponse(error);
  }
}
