import { NextRequest } from 'next/server';
import { requireAuth, requireRole, getInstitutionId } from '@/lib/auth/helpers';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import { createResourceSchema, resourcesQuerySchema } from '@/lib/validations/schemas/resources';
import { rateLimit } from '@/lib/rate-limit';
import { TooManyRequestsError } from '@/lib/utils/errors';
import { ResourceService } from '@/lib/services/resource-service';

// GET /api/resources - List resources with filters
export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimit(`resources-search-${ip}`, 20, 60 * 1000)) {
       throw new TooManyRequestsError();
    }
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const { searchParams } = new URL(request.url);
    const query = validateQuery(resourcesQuerySchema, searchParams);

    const result = await ResourceService.list(institutionId, query);

    console.log(`[TIMING] resources GET: ${Date.now() - start}ms`);
    return successResponse(result);
  } catch (error) {
    console.log(`[TIMING] resources GET ERROR: ${Date.now() - start}ms`);
    return errorResponse(error);
  }
}

// POST /api/resources - Create single resource
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'pip']);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(createResourceSchema, body) as import('@/lib/validations/schemas/resources').CreateResourceInput;

    const resource = await ResourceService.create(institutionId, data);

    return successResponse(resource, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
