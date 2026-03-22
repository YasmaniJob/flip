import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { auth } from './auth';

@Injectable()
export class EmailVerificationGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Obtener sesión from Better Auth
        const session = await auth.api.getSession({
            headers: new Headers(request.headers as any),
        });

        if (!session) {
            throw new UnauthorizedException('No autenticado');
        }

        // Verificar que el email esté verificado
        if (!session.user.emailVerified) {
            throw new UnauthorizedException({
                statusCode: 403,
                message: 'Email no verificado',
                error: 'EmailNotVerified',
            });
        }

        // Adjuntar user y session al request
        request['user'] = session.user;
        request['session'] = session;

        return true;
    }
}
