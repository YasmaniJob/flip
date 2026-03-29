import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoansApi, type Loan, type CreateLoanData } from '../api/loans.api';
import { handleApiError, showSuccess } from '@/lib/error-handler';

export type { Loan, CreateLoanData };

export const loanKeys = {
    all: ['loans'] as const,
    list: () => [...loanKeys.all] as const,
    detail: (id: string) => [...loanKeys.all, id] as const,
};

export function useLoans(limit?: number) {
    return useQuery<Loan[]>({
        queryKey: [...loanKeys.all, limit],
        queryFn: () => LoansApi.getAll({ limit }),
        staleTime: 30 * 1000,                 // 30 segundos - datos frescos por 30s
        refetchInterval: 30 * 1000,           // poll every 30s (reducido de 3s)
        refetchIntervalInBackground: false,   // no polling cuando tab está inactivo
        refetchOnWindowFocus: true,
    });
}

export function useCreateLoan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: LoansApi.create,
        onSuccess: (newLoan) => {
            // Optimistic update
            queryClient.setQueryData(loanKeys.list(), (old: Loan[] | undefined) => {
                if (!old) return [newLoan];
                return [newLoan, ...old];
            });
            // Re-fetch to ensure relations (staffName, etc) are perfectly synced
            queryClient.invalidateQueries({ queryKey: loanKeys.list() });
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            queryClient.invalidateQueries({ queryKey: ['available-resources'] });
            showSuccess('Préstamo creado correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo crear el préstamo');
        },
    });
}

export function useApproveLoan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => LoansApi.approve(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: loanKeys.list() });
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            queryClient.invalidateQueries({ queryKey: ['available-resources'] });
            showSuccess('Préstamo aprobado correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo aprobar el préstamo');
        },
    });
}

export function useRejectLoan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => LoansApi.reject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: loanKeys.list() });
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            queryClient.invalidateQueries({ queryKey: ['available-resources'] });
            showSuccess('Préstamo rechazado');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo rechazar el préstamo');
        },
    });
}
