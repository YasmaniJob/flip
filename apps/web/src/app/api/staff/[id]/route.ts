import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody } from '@/lib/validations/helpers';
import { updateStaffSchema } from '@/lib/validations/schemas/staff';
import { NotFoundError, ForbiddenError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { staff, users, sessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

// PATCH /api/staff/:id - Update staff member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(updateStaffSchema, body);



    // Only SuperAdmin can assign SuperAdmin or Admin role
    if ((data.role === 'superadmin' || data.role === 'admin') && !user.isSuperAdmin) {
      throw new ForbiddenError('Solo el SuperAdmin puede asignar los roles Admin o SuperAdmin');
    }

    // Verify ownership - Check staff table first
    const existingStaff = await db.query.staff.findFirst({
      where: and(eq(staff.id, id), eq(staff.institutionId, institutionId)),
    });

    if (existingStaff) {
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

      revalidateTag('staff');

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
          await db
            .delete(sessions)
            .where(eq(sessions.userId, userToUpdate.id));

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
    }

    // If not found in staff, check users table (for administrators)
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.id, id), eq(users.institutionId, institutionId)),
    });

    if (existingUser) {
      // Validate that it's an administrator (consistent with GET /api/staff)
      const isAdmin = 
        existingUser.isSuperAdmin || 
        ['admin', 'superadmin', 'pip'].includes(existingUser.role || '');

      if (!isAdmin) {
        throw new NotFoundError('Personal no encontrado');
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          name: data.name,
          dni: data.dni || existingUser.dni,
          email: data.email || existingUser.email,
          role: data.role || existingUser.role,
        })
        .where(eq(users.id, id))
        .returning();

      revalidateTag('staff');

      // If role changed, invalidate sessions
      if (data.role && data.role !== existingUser.role) {
        await db
          .delete(sessions)
          .where(eq(sessions.userId, id));

        return successResponse({
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          _meta: {
            userAccountUpdated: true,
            sessionsInvalidated: true,
            message: 'El rol del administrador se actualizó. Deberá iniciar sesión nuevamente.',
          },
        });
      }

      return successResponse({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    }

    throw new NotFoundError('Personal no encontrado');
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/staff/:id - Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);



    // Try deleting from staff table first
    const [deletedStaff] = await db
      .delete(staff)
      .where(and(eq(staff.id, id), eq(staff.institutionId, institutionId)))
      .returning();

    if (deletedStaff) {
      revalidateTag('staff');
      return successResponse({ success: true });
    }

    // If not in staff, check users table (only if they are admins)
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.id, id), eq(users.institutionId, institutionId)),
    });

    if (existingUser) {
      const isAdmin = 
        existingUser.isSuperAdmin || 
        ['admin', 'superadmin', 'pip'].includes(existingUser.role || '');

      if (!isAdmin) {
        throw new NotFoundError('Personal no encontrado');
      }

      // Instead of deleting the whole user account (which could be dangerous),
      // we might want to just remove their institutionId or role?
      // But in this app, "deleting personal" usually means removing access.
      // If they are only in users table, deleting them from here means deleting their account.
      await db
        .delete(users)
        .where(eq(users.id, id));

      revalidateTag('staff');
      return successResponse({ success: true });
    }

    throw new NotFoundError('Personal no encontrado');
  } catch (error) {
    return errorResponse(error);
  }
}
