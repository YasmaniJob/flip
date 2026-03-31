/**
 * POST /api/institutions/[id]/diagnostic/approve/[sessionId]
 * 
 * Approve a diagnostic session and create/link staff account
 * Admin endpoint (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/features/diagnostic/lib/auth-middleware';
import { approveAndCreateStaff } from '@/features/diagnostic/lib/staff-integration';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  try {
    const { id: institutionId, sessionId } = params;
    
    // Verify admin access
    const authResult = await verifyAdminAccess(request, institutionId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'Not authenticated' ? 401 : 403 }
      );
    }
    
    // Approve and create/link staff
    const result = await approveAndCreateStaff(sessionId);
    
    return NextResponse.json({
      success: result.success,
      staffId: result.staffId,
      action: result.action,
      message: result.message,
    });
    
  } catch (error) {
    console.error('Error approving session:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === 'Session not found') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      if (error.message === 'Session must be completed before approval') {
        return NextResponse.json(
          { error: 'Session must be completed before approval' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
