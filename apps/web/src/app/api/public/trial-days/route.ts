/**
 * GET /api/public/trial-days
 * 
 * Public endpoint to get the configured trial days
 * Used by landing page to display dynamic trial period
 */

import { NextResponse } from 'next/server';
import { getTrialDays } from '@/lib/trial-config';

export async function GET() {
  try {
    const trialDays = await getTrialDays();
    
    return NextResponse.json({
      trialDays,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
    
  } catch (error) {
    console.error('Error fetching trial days:', error);
    // Return default value on error
    return NextResponse.json({
      trialDays: 15,
    });
  }
}
