/**
 * GET /api/institutions/[id]/diagnostic/pending
 * 
 * Get list of completed diagnostic sessions pending approval
 * Admin endpoint (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/features/diagnostic/lib/auth-middleware';
import { getPendingSessions } from '@/features/diagnostic/lib/staff-integration';

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
    
    // Get pending sessions
    const sessions = await getPendingSessions(institutionId);
    
    return NextResponse.json({
      sessions: sessions.map(s => ({
        id: s.id,
        name: s.name,
        dni: s.dni,
        email: s.email,
        overallScore: s.overallScore,
        level: s.level,
        categoryScores: s.categoryScores,
        completedAt: s.completedAt,
        createdAt: s.createdAt,
      })),
      total: sessions.length,
    });
    
  } catch (error) {
    console.error('Error fetching pending sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
