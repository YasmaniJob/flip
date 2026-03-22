import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Patch,
    Param,
    Query,
    Req,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { AuthGuard } from '../../../auth/auth.guard';
import { CreateLoanCommand } from '../../../application/use-cases/loans/commands/create-loan.command';
import { ApproveLoanCommand } from '../../../application/use-cases/loans/commands/approve-loan.command';
import { RejectLoanCommand } from '../../../application/use-cases/loans/commands/reject-loan.command';
import { FindLoansQuery } from '../../../application/use-cases/loans/queries/find-loans.query';
import { ReturnLoanCommand } from '../../../application/use-cases/loans/commands/return-loan.command';
import { CurrentInstitution } from '../../../common/decorators/current-institution.decorator';
import { LoanPaginationDto } from '../dto/loan-pagination.dto';
import { CreateLoanDto } from '../dto/create-loan.dto';
import { ReturnLoanDto } from '../dto/return-loan.dto';

@Controller('loans')
@UseGuards(AuthGuard)
export class LoansController {
    private readonly logger = new Logger(LoansController.name);
    constructor(
        private readonly createLoan: CreateLoanCommand,
        private readonly findLoans: FindLoansQuery,
        private readonly returnLoan: ReturnLoanCommand,
        private readonly approveLoan: ApproveLoanCommand,
        private readonly rejectLoan: RejectLoanCommand,
    ) { }

    @Get()
    findAll(
        @CurrentInstitution() institutionId: string,
        @Query() pagination: LoanPaginationDto,
        @Req() req: any,
    ) {
        const user = req.user;
        return this.findLoans.execute(institutionId, pagination, {
            userRole: user?.role,
            requestedByUserId: user?.id,
        });
    }

    @Post()
    async create(
        @CurrentInstitution() institutionId: string,
        @Body() body: CreateLoanDto,
        @Req() req: any,
    ) {
        try {
            const user = req.user;
            const isDocente = user?.role === 'docente';

            return await this.createLoan.execute({
                institutionId,
                staffId: body.staffId,
                requestedByUserId: user?.id,
                resourceIds: body.resourceIds,
                purpose: body.purpose,
                notes: body.notes,
                studentPickupNote: body.studentPickupNote,
                isDocente,
                purposeDetails: {
                    gradeId: body.gradeId,
                    sectionId: body.sectionId,
                    curricularAreaId: body.curricularAreaId,
                },
            });
        } catch (error: any) {
            this.logger.error('Error creating loan', error?.message, error?.stack);
            throw error;
        }
    }

    @Patch(':id/approve')
    approve(
        @CurrentInstitution() institutionId: string,
        @Param('id') id: string,
        @Req() req: any,
    ) {
        const user = req.user;
        if (user?.role === 'docente') {
            throw new ForbiddenException('Solo los administradores pueden aprobar préstamos');
        }

        return this.approveLoan.execute({ institutionId, loanId: id });
    }

    @Patch(':id/reject')
    reject(
        @CurrentInstitution() institutionId: string,
        @Param('id') id: string,
        @Req() req: any,
    ) {
        const user = req.user;
        if (user?.role === 'docente') {
            throw new ForbiddenException('Solo los administradores pueden rechazar préstamos');
        }

        return this.rejectLoan.execute({ institutionId, loanId: id });
    }

    @Patch(':id/return')
    returnLoanEndpoint(
        @CurrentInstitution() institutionId: string,
        @Param('id') id: string,
        @Body() body: ReturnLoanDto,
    ) {
        return this.returnLoan.execute({
            institutionId,
            loanId: id,
            ...body,
        });
    }
}
