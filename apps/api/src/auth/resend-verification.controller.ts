import { Body, Controller, Post, UnauthorizedException, Inject, BadRequestException } from '@nestjs/common';
import { auth } from './auth';
import { DRIZZLE } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';
import * as SibApiV3Sdk from '@getbrevo/brevo';
import { emailVerificationTemplate } from './email-templates';
import { randomBytes } from 'crypto';

// Configurar Brevo
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(
    SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY || ''
);

@Controller('auth')
export class ResendVerificationController {
    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    @Post('send-verification-email')
    async resendVerification(@Body() body: { email: string }) {
        const { email } = body;

        if (!email) {
            throw new BadRequestException('Email requerido');
        }

        try {
            // Buscar usuario
            const [user] = await this.db
                .select()
                .from(schema.users)
                .where(eq(schema.users.email, email))
                .limit(1);

            if (!user) {
                // Por seguridad, no revelar si el usuario existe
                return { message: 'Si el email existe, se enviará un link de verificación' };
            }

            // Si ya está verificado, no hacer nada
            if (user.emailVerified) {
                return { message: 'Email ya verificado' };
            }

            // Generar nuevo token
            const token = randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

            // Guardar/actualizar token
            await this.db
                .insert(schema.verification)
                .values({
                    id: randomBytes(16).toString('hex'), // Generate unique ID
                    identifier: email,
                    value: token,
                    expiresAt,
                })
                .onConflictDoUpdate({
                    target: [schema.verification.identifier],
                    set: {
                        value: token,
                        expiresAt,
                    },
                });

            // Construir URL de verificación
            const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

            // Enviar email
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
            sendSmtpEmail.sender = {
                name: process.env.EMAIL_FROM_NAME || 'Flip App',
                email: process.env.EMAIL_FROM || 'noreply@flipapp.com',
            };
            sendSmtpEmail.to = [{ email: user.email, name: user.name }];
            sendSmtpEmail.subject = 'Verifica tu cuenta - Flip';
            sendSmtpEmail.htmlContent = emailVerificationTemplate(user.name, verificationUrl);

            await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('✅ Verification email resent to:', user.email);

            return { message: 'Email de verificación enviado' };
        } catch (error) {
            console.error('Error reenviando email:', error);
            throw new UnauthorizedException('Error al enviar email de verificación');
        }
    }
}
