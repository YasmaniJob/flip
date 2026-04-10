/**
 * GET/POST /api/admin/config/trial
 * 
 * Manage global trial period configuration
 * Superadmin only endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CONFIG_FILE_PATH = join(process.cwd(), '.trial-config.json');

interface TrialConfig {
  trialDays: number;
  updatedAt: string;
  updatedBy: string;
}

function getDefaultConfig(): TrialConfig {
  return {
    trialDays: 15,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  };
}

function readConfig(): TrialConfig {
  try {
    if (existsSync(CONFIG_FILE_PATH)) {
      const data = readFileSync(CONFIG_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading trial config:', error);
  }
  return getDefaultConfig();
}

function writeConfig(config: TrialConfig): void {
  try {
    writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing trial config:', error);
    throw error;
  }
}

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

    const config = readConfig();
    
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

    // Save config
    const config: TrialConfig = {
      trialDays,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.email || session.user.id,
    };

    writeConfig(config);
    
    return NextResponse.json({
      success: true,
      trialDays: config.trialDays,
      updatedAt: config.updatedAt,
    });
    
  } catch (error) {
    console.error('Error updating trial config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
