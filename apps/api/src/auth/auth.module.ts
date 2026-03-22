import { Module, Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { auth } from './auth';
import { UsersService } from '../users/users.service';
import { ResendVerificationController } from './resend-verification.controller';
import { toNodeHandler } from 'better-auth/node';

@Controller('api/auth')
export class AuthController {
    constructor() { }

    @All('*')
    async handleAuth(@Req() req: Request, @Res() res: Response) {
        try {
            // Use the official Node handler from Better Auth
            const handler = toNodeHandler(auth);
            await handler(req, res);
        } catch (error: any) {
            console.error('Auth error detailed:', error);
            // Emergency log to file to debug
            const fs = require('fs');
            const logPath = require('path').join(process.cwd(), 'auth-error.log');
            fs.writeFileSync(logPath, JSON.stringify({
                message: error?.message,
                stack: error?.stack,
                details: String(error)
            }, null, 2));

            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Internal auth error',
                    details: error?.message || String(error),
                    stack: error?.stack
                });
            }
        }
    }
}

@Module({
    imports: [],
    controllers: [AuthController, ResendVerificationController],
    providers: [UsersService],
    exports: [UsersService],
})
export class AuthModule { }
