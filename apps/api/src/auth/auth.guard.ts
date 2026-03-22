import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { auth } from './auth';

@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const session = await auth.api.getSession({
            headers: new Headers(request.headers as any),
        });

        if (!session) {
            throw new UnauthorizedException('No autenticado');
        }

        // TODO: Reactivar cuando se habilite email verification
        // Verificar email (solo si está configurado)
        // if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !session.user.emailVerified) {
        //     throw new UnauthorizedException({
        //         statusCode: 403,
        //         message: 'Email no verificado',
        //         error: 'EmailNotVerified',
        //     });
        // }

        request['user'] = session.user;
        request['session'] = session;
        return true;
    }
}
