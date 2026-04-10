/**
 * GET/PATCH /api/institutions/[id]/diagnostic/config
 * 
 * Get or update diagnostic configuration for an institution
 * Admin endpoint (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { institutions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminAccess } from '@/features/diagnostic/lib/auth-middleware';
import { updateConfigRequestSchema } from '@/features/diagnostic/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check feature flag
    const diagnosticEnabled = process.env.FEATURE_DIAGNOSTIC_ADMIN_PANEL === 'true';
    if (!diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic admin panel is not enabled' },
        { status: 503 }
      );
    }
    
    const { id: institutionId } = await params;
    
    // Verify admin access
    const authResult = await verifyAdminAccess(request, institutionId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'Not authenticated' ? 401 : 403 }
      );
    }
    
    const institution = authResult.institution!;
    
    return NextResponse.json({
      diagnosticEnabled: institution.diagnosticEnabled ?? false,
      diagnosticRequiresApproval: institution.diagnosticRequiresApproval ?? true,
      diagnosticCustomMessage: institution.diagnosticCustomMessage,
      diagnosticActiveYear: institution.diagnosticActiveYear,
      publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://flip.org.pe'}/ie/${institution.slug}/diagnostic`,
    });
    
  } catch (error) {
    console.error('Error fetching diagnostic config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check feature flag
    const diagnosticEnabled = process.env.FEATURE_DIAGNOSTIC_ADMIN_PANEL === 'true';
    if (!diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic admin panel is not enabled' },
        { status: 503 }
      );
    }
    
    const { id: institutionId } = await params;
    
    // Verify admin access
    const authResult = await verifyAdminAccess(request, institutionId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'Not authenticated' ? 401 : 403 }
      );
    }
    
    // Parse and validate request
    const body = await request.json();
    const validation = updateConfigRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const updates = validation.data;
    
    // Update institution
    const [updated] = await db.update(institutions)
      .set({
        ...(updates.diagnosticEnabled !== undefined && { diagnosticEnabled: updates.diagnosticEnabled }),
        ...(updates.diagnosticRequiresApproval !== undefined && { diagnosticRequiresApproval: updates.diagnosticRequiresApproval }),
        ...(updates.diagnosticCustomMessage !== undefined && { diagnosticCustomMessage: updates.diagnosticCustomMessage }),
        ...(updates.diagnosticActiveYear !== undefined && { diagnosticActiveYear: updates.diagnosticActiveYear }),
      })
      .where(eq(institutions.id, institutionId))
      .returning();
    
    return NextResponse.json({
      success: true,
      diagnosticEnabled: updated.diagnosticEnabled,
      diagnosticRequiresApproval: updated.diagnosticRequiresApproval,
      diagnosticCustomMessage: updated.diagnosticCustomMessage,
      diagnosticActiveYear: updated.diagnosticActiveYear,
    });
    
  } catch (error) {
    console.error('Error updating diagnostic config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
