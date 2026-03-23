import { NextRequest } from 'next/server';
import { auth } from './index';
import { UnauthorizedError, ForbiddenError } from '@/lib/utils/errors';

type AuthResult = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string | null | undefined;
    institutionId?: string | null | undefined;
    isSuperAdmin?: boolean | null | undefined;
  };
  session: any;
};

/**
 * Requires authentication and returns user and session
 * @throws UnauthorizedError if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw new UnauthorizedError('No autenticado');
  }

  return { user: session.user, session };
}

/**
 * Requires specific roles
 * @throws UnauthorizedError if not authenticated
 * @throws ForbiddenError if user doesn't have required role
 */
export async function requireRole(request: NextRequest, allowedRoles: string[]): Promise<AuthResult['user']> {
  const { user } = await requireAuth(request);

  // Superadmin bypass: they have permission for everything
  if (user.role === 'superadmin' || user.isSuperAdmin) {
    return user;
  }

  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new ForbiddenError('No tienes permisos para esta acción');
  }

  return user;
}

/**
 * Gets institution ID from user object or authenticated request
 * @throws UnauthorizedError if no institution assigned
 */
export async function getInstitutionId(requestOrUserOrAuth: NextRequest | AuthResult['user'] | AuthResult): Promise<string> {
  let user: AuthResult['user'];
  
  // Si es NextRequest, obtener el usuario
  if (requestOrUserOrAuth && typeof requestOrUserOrAuth === 'object' && 'headers' in requestOrUserOrAuth) {
    const authResult = await requireAuth(requestOrUserOrAuth as NextRequest);
    user = authResult.user;
  }
  // Si es AuthResult, extraer el usuario
  else if ('user' in requestOrUserOrAuth) {
    user = (requestOrUserOrAuth as AuthResult).user;
  }
  // Si es el usuario directamente
  else {
    user = requestOrUserOrAuth as AuthResult['user'];
  }

  if (!user.institutionId) {
    throw new UnauthorizedError('Debes tener una institución asignada');
  }

  return user.institutionId;
}

/**
 * Requires SuperAdmin privileges
 * @throws UnauthorizedError if not authenticated
 * @throws ForbiddenError if not SuperAdmin
 */
export async function requireSuperAdmin(request: NextRequest) {
  const { user } = await requireAuth(request);

  if (!user.isSuperAdmin) {
    throw new ForbiddenError('Solo SuperAdmin puede realizar esta acción');
  }

  return user;
}
