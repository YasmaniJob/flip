/**
 * GET/POST /api/admin/config/trial
 * 
 * Manage global trial period configuration
 * Superadmin only endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getTrialConfig, setTrialDays } from '@/lib/trial-config';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify superadmin
    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Superadmin only' },
        { status: 403 }
      );
    }

    const config = await getTrialConfig();
    
    return NextResponse.json({
      trialDays: config.trialDays,
      updatedAt: config.updatedAt,
      updatedBy: config.updatedBy,
    });
    
  } catch (error) {
    console.error('Error fetching trial config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify superadmin
    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Superadmin only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { trialDays } = body;

    // Validate
    if (typeof trialDays !== 'number' || trialDays < 1 || trialDays > 365) {
      return NextResponse.json(
        { error: 'Trial days must be between 1 and 365' },
        { status: 400 }
      );
    }

    // Save config to database
    const updatedBy = session.user.email || session.user.id;
    await setTrialDays(trialDays, updatedBy);
    
    return NextResponse.json({
      success: true,
      trialDays,
      updatedAt: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error updating trial config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
