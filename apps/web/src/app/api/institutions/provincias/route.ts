import { NextRequest } from 'next/server';
import { getCachedProvincias } from '@/features/institutions/lib/geography-cache';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/institutions/provincias - Get unique provinces for a department
export async function GET(request: NextRequest) {
  try {
    const departamento = request.nextUrl.searchParams.get('departamento');
    if (!departamento) return successResponse([]);
    
    const provincias = await getCachedProvincias(departamento);
    return successResponse(provincias);
  } catch (error) {
    return errorResponse(error);
  }
}