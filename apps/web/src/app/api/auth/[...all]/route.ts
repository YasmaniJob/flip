import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { TooManyRequestsError } from '@/lib/utils/errors';
import { errorResponse } from '@/lib/utils/response';

const handler = toNextJsHandler(auth);

export const GET = async (request: NextRequest) => {
    return handler.GET(request);
};

export const POST = async (request: NextRequest) => {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimit(`auth-all-${ip}`, 10, 60 * 1000)) {
       return errorResponse(new TooManyRequestsError());
    }
    return handler.POST(request);
};
