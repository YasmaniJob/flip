import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentInstitution = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.institutionId) {
            throw new UnauthorizedException('Debes tener una institución asignada para acceder a este recurso');
        }

        return user.institutionId;
    },
);
