import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { updateStaffSchema } from '@/lib/validations/schemas/staff';
import { NotFoundError, ForbiddenError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { staff, users, sessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// PATCH /api/staff/:id - Update staff member
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(updateStaffSchema, body);

    const { id } = params;

    // Only SuperAdmin can assign SuperAdmin or Admin role
    if ((data.role === 'superadmin' || data.role === 'admin') && !user.isSuperAdmin) {
      throw new ForbiddenError('Solo el SuperAdmin puede asignar los roles Admin o SuperAdmin');
    }

    // Verify ownership
    const existing = await db.query.staff.findFirst({
      where: and(eq(staff.id, id), eq(staff.institutionId, institutionId)),
    });

    if (!existing) {
      throw new NotFoundError('Personal no encontrado');
    }

    const [updatedStaff] = await db
      .update(staff)
      .set({
        name: data.name,
        dni: data.dni || null,
        email: data.email || null,
        phone: data.phone || null,
        area: data.area || null,
        role: data.role,
      })
      .where(eq(staff.id, id))
      .returning();

    // Si el staff tiene email, sincronizar rol en tabla users
    if (data.role && updatedStaff.email) {
      // Buscar el usuario con ese email
      const userToUpdate = await db.query.users.findFirst({
        where: eq(users.email, updatedStaff.email),
      });

      if (userToUpdate) {
        // Actualizar el rol en la tabla users
        await db
          .update(users)
          .set({ role: data.role })
          .where(eq(users.email, updatedStaff.email));

        // Invalidar todas las sesiones del usuario para forzar re-login
        // Esto asegura que el usuario vea su nuevo rol inmediatamente
        await db
          .delete(sessions)
          .where(eq(sessions.userId, userToUpdate.id));

        // Retornar información adicional sobre la sincronización
        return successResponse({
          ...updatedStaff,
          _meta: {
            userAccountUpdated: true,
            sessionsInvalidated: true,
            message: 'El rol se actualizó correctamente. El usuario deberá iniciar sesión nuevamente para ver los cambios.',
          },
        });
      }
    }

    return successResponse(updatedStaff);
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/staff/:id - Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const { id } = params;

    const [deleted] = await db
      .delete(staff)
      .where(and(eq(staff.id, id), eq(staff.institutionId, institutionId)))
      .returning();

    if (!deleted) {
      throw new NotFoundError('Personal no encontrado');
    }

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
