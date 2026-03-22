import { z } from 'zod';

// Loan status enum
export const loanStatusEnum = z.enum(['active', 'returned', 'overdue']);

// Loan approval status enum
export const loanApprovalStatusEnum = z.enum(['pending', 'approved', 'rejected']);

// Resource status decision for return
export const resourceStatusDecisionEnum = z.enum(['disponible', 'mantenimiento', 'baja']);

// Create loan
export const createLoanSchema = z.object({
  staffId: z.string().uuid().optional(),
  resourceIds: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos un recurso'),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  gradeId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  curricularAreaId: z.string().uuid().optional(),
  studentPickupNote: z.string().optional(),
});

// Return loan - Estructura compleja con JSON
export const returnLoanSchema = z.object({
  resourcesReceived: z.array(z.string().uuid()).min(0),
  
  // damageReports: { [resourceId]: { commonProblems: string[], otherNotes?: string } }
  damageReports: z
    .record(
      z.object({
        commonProblems: z.array(z.string()),
        otherNotes: z.string().optional(),
      })
    )
    .optional(),
  
  // suggestionReports: { [resourceId]: { commonSuggestions: string[], otherNotes?: string } }
  suggestionReports: z
    .record(
      z.object({
        commonSuggestions: z.array(z.string()),
        otherNotes: z.string().optional(),
      })
    )
    .optional(),
  
  // missingResources: [{ resourceId, resourceName, notes? }]
  missingResources: z
    .array(
      z.object({
        resourceId: z.string().uuid(),
        resourceName: z.string(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  
  // resourceStatusDecisions: { [resourceId]: 'disponible' | 'mantenimiento' | 'baja' }
  resourceStatusDecisions: z
    .record(resourceStatusDecisionEnum)
    .optional(),
});

// Query params for listing loans
export const loansQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(10),
});

// Infer types
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type ReturnLoanInput = z.infer<typeof returnLoanSchema>;
export type LoansQueryInput = z.infer<typeof loansQuerySchema>;
