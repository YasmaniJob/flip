import { NextRequest } from 'next/server';
import { getCachedPeruGeography } from '@/features/institutions/lib/geography-cache';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * GET /api/institutions/geography/tree
 * 
 * Aggregated endpoint that returns the entire hierarchy (Dept > Prov > Dist)
 * This is the SMART, Scalable solution to eliminate waterfalls in Onboarding.
 */
export async function GET() {
  try {
    const tree = await getCachedPeruGeography();
    return successResponse(tree);
  } catch (error) {
    return errorResponse(error);
  }
}
