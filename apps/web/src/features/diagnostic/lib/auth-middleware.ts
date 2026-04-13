/**
 * Authentication Middleware for Admin Endpoints
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { institutions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface AuthResult {
  authorized: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    institutionId: string;
  };
  institution?: typeof institutions.$inferSelect;
  error?: string;
}

/**
 * Verify user is authenticated and has admin access to institution
 */
export async function verifyAdminAccess(
  request: NextRequest,
  institutionId: string
): Promise<AuthResult> {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    // DEBUG: Log session data
    console.log('[Auth Debug] Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userIsSuperAdmin: session?.user?.isSuperAdmin,
      userInstitutionId: session?.user?.institutionId,
    });
    
    if (!session?.user) {
      return {
        authorized: false,
        error: 'Not authenticated',
      };
    }
    
    const user = session.user;
    
    // Check if user belongs to the institution
    if (user.institutionId !== institutionId) {
      return {
        authorized: false,
        error: 'Access denied to this institution',
      };
    }
    
    // Check if user has admin role (director, coordinador, or super admin)
    const adminRoles = ['director', 'coordinador', 'admin'];
    const isAdmin = adminRoles.includes(user.role) || user.isSuperAdmin;
    
    // DEBUG: Log permission check
    console.log('[Auth Debug] Permission check:', {
      userRole: user.role,
      isInAdminRoles: adminRoles.includes(user.role),
      isSuperAdmin: user.isSuperAdmin,
      finalIsAdmin: isAdmin,
    });
    
    if (!isAdmin) {
      return {
        authorized: false,
        error: 'Insufficient permissions. Admin role required.',
      };
    }
    
    // Get institution details
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, institutionId),
    });
    
    if (!institution) {
      return {
        authorized: false,
        error: 'Institution not found',
      };
    }
    
    return {
      authorized: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
      },
      institution,
    };
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      authorized: false,
      error: 'Authentication error',
    };
  }
}
