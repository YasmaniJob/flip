import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { LoanRepository } from '@/lib/repositories/loan-repository';
import type { CreateLoanInput, ReturnLoanInput, LoansQueryInput } from '@/lib/validations/schemas/loans';

// ─── Errors ──────────────────────────────────────────────────────────────────

export class LoanNotFoundError extends NotFoundError {
  constructor() { super('Préstamo no encontrado'); }
}

export class LoanAlreadyProcessedError extends ValidationError {
  constructor(currentStatus: string) {
    super(`El préstamo ya está ${currentStatus === 'approved' ? 'aprobado' : 'rechazado'}`);
  }
}

export class LoanAlreadyReturnedError extends ValidationError {
  constructor() { super('El préstamo ya ha sido devuelto'); }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const LoanService = {
  /** List loans for an institution with role-based filtering. */
  async list(
    institutionId: string,
    query: LoansQueryInput,
    userId: string,
    isDocente: boolean,
  ) {
    return LoanRepository.findMany(institutionId, query, userId, isDocente);
  },

  /**
   * Create a new Loan.
   * Validates resource availability, then persists atomically.
   * Returns the created loan with full relations.
   */
  async create(
    institutionId: string,
    input: CreateLoanInput,
    userId: string,
    isDocente: boolean,
  ) {
    await LoanRepository.validateResourcesAvailable(institutionId, input.resourceIds);
    const loanId = await LoanRepository.create(institutionId, input, userId, isDocente);
    return LoanRepository.findByIdWithRelations(loanId);
  },

  /**
   * Approve a pending Loan.
   * Only loans in 'pending' approvalStatus can be approved.
   */
  async approve(id: string, institutionId: string) {
    const loan = await LoanRepository.findById(id, institutionId);
    if (!loan) throw new LoanNotFoundError();
    if (loan.approvalStatus !== 'pending') throw new LoanAlreadyProcessedError(loan.approvalStatus!);
    return LoanRepository.approve(id, institutionId);
  },

  /**
   * Reject a pending Loan.
   * Releases all associated resources back to 'disponible'.
   */
  async reject(id: string, institutionId: string) {
    const loan = await LoanRepository.findById(id, institutionId, true) as any;
    if (!loan) throw new LoanNotFoundError();
    if (loan.approvalStatus !== 'pending') throw new LoanAlreadyProcessedError(loan.approvalStatus!);

    const resourceIds = (loan.loanResources ?? []).map((lr: any) => lr.resourceId);
    await LoanRepository.reject(id, institutionId, resourceIds);
    return LoanRepository.findById(id, institutionId);
  },

  /**
   * Return an active Loan.
   * Validates the loan is still active, then persists status decisions
   * (disponible / mantenimiento / baja) per resource.
   * Returns the updated loan with full relations.
   */
  async return(id: string, institutionId: string, input: ReturnLoanInput) {
    const loan = await LoanRepository.findById(id, institutionId);
    if (!loan) throw new LoanNotFoundError();
    if (loan.status !== 'active') throw new LoanAlreadyReturnedError();

    await LoanRepository.return(id, institutionId, input);
    return LoanRepository.findByIdWithRelations(id);
  },
};
