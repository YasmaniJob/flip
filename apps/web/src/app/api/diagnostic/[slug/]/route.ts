/**
 * GET /api/diagnostic/[slug]
 * 
 * Returns diagnostic configuration and active questions for an institution
 * Public endpoint (no authentication required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/features/diagnostic/lib/rate-limit';
import { getCachedDiagnosticConfig } from '@/features/diagnostic/lib/diagnostic-config';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(ip, 20, 3600000); // 20 requests per hour
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          },
        }
      );
    }
    
    // Check feature flag
    const diagnosticEnabled = process.env.FEATURE_DIAGNOSTIC_ENABLED === 'true';
    if (!diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic module is not enabled' },
        { status: 503 }
      );
    }
    
    const { slug } = params;
    
    const config = await getCachedDiagnosticConfig(slug);
    
    if (!config) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }
    
    if (config.disabled) {
      return NextResponse.json({ error: 'Diagnostic is not enabled for this institution' }, { status: 403 });
    }
    
    return NextResponse.json(config);
    
  } catch (error) {
    console.error('Error fetching diagnostic config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
