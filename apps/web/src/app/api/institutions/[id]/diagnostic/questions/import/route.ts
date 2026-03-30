import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { institutions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminAccess } from '@/features/diagnostic/lib/auth-middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const diagnosticEnabled = process.env.FEATURE_DIAGNOSTIC_ADMIN_PANEL === 'true';
    if (!diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic admin panel is not enabled' },
        { status: 503 }
      );
    }
    
    const { id: institutionId } = params;
    
    // Verify admin access
    const authResult = await verifyAdminAccess(request, institutionId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'Not authenticated' ? 401 : 403 }
      );
    }
    
    const body = await request.json();
    const { questionIds } = body;
    
    if (!Array.isArray(questionIds)) {
      return NextResponse.json(
        { error: 'questionIds array is required' },
        { status: 400 }
      );
    }
    
    // Fetch current institution
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, institutionId)
    });
    
    if (!institution) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      );
    }
    
    // Update settings
    const currentSettings = (institution.settings as any) || {};
    const currentImported = currentSettings.diagnostic?.importedBaseQuestions || [];
    
    // Add new ones without duplicates
    const newImported = Array.from(new Set([...currentImported, ...questionIds]));
    
    const newSettings = {
      ...currentSettings,
      diagnostic: {
        ...(currentSettings.diagnostic || {}),
        importedBaseQuestions: newImported
      }
    };
    
    await db.update(institutions)
      .set({ settings: newSettings })
      .where(eq(institutions.id, institutionId));
      
    return NextResponse.json({
      success: true,
      importedCount: questionIds.length,
      totalImported: newImported.length
    });
    
  } catch (error) {
    console.error('Error importing base questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
