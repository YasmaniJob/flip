import { Module } from '@nestjs/common';
import { LoansController } from '../infrastructure/http/controllers/loans.controller';
import { DatabaseModule } from '../database/database.module';
import { DrizzleLoanRepository } from '../infrastructure/persistence/drizzle/repositories/drizzle-loan.repository';
import { CreateLoanCommand } from '../application/use-cases/loans/commands/create-loan.command';
import { ApproveLoanCommand } from '../application/use-cases/loans/commands/approve-loan.command';
import { RejectLoanCommand } from '../application/use-cases/loans/commands/reject-loan.command';
import { FindLoansQuery } from '../application/use-cases/loans/queries/find-loans.query';
import { ResourceModule } from './resource.module';
import { ReturnLoanCommand } from '../application/use-cases/loans/commands/return-loan.command';

@Module({
    imports: [DatabaseModule, ResourceModule],
    controllers: [LoansController],
    providers: [
        {
            provide: 'ILoanRepository',
            useClass: DrizzleLoanRepository,
        },
        CreateLoanCommand,
        ApproveLoanCommand,
        RejectLoanCommand,
        ReturnLoanCommand,
        FindLoansQuery,
    ],
    exports: ['ILoanRepository'],
})
export class LoansModule { }


