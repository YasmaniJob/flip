import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const institutionId = request.user?.institutionId;

        if (!institutionId) {
            throw new UnauthorizedException('Tenant (Institution) ID is missing in request context');
        }

        return institutionId;
    },
);
