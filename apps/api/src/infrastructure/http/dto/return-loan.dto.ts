// Using a plain interface (not a class) so NestJS ValidationPipe
// cannot apply class-validator whitelist rules to this body.
// The return endpoint has complex nested types (Records, Arrays) that
// don't play well with class-validator's whitelist mode.
export interface ReturnLoanDto {
    resourcesReceived: string[];
    damageReports?: Record<string, unknown>;
    suggestionReports?: Record<string, unknown>;
    missingResources?: Array<{ resourceId: string; resourceName: string; notes?: string }>;
    resourceStatusDecisions?: Record<string, 'disponible' | 'mantenimiento' | 'baja'>;
}
