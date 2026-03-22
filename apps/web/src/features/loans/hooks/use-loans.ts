import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoansApi, type Loan, type CreateLoanData } from '../api/loans.api';

export type { Loan, CreateLoanData };

export const loanKeys = {
    all: ['loans'] as const,
    list: () => [...loanKeys.all] as const,
    detail: (id: string) => [...loanKeys.all, id] as const,
};

export function useLoans() {
    return useQuery<Loan[]>({
        queryKey: loanKeys.list(),
        queryFn: () => LoansApi.getAll(),
        staleTime: 0,                         // always stale — any invalidation refetches immediately
        refetchInterval: 3 * 1000,            // poll every 3s for cross-session updates
        refetchIntervalInBackground: true,    // keep polling even when browser tab is inactive
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
        },
    });
}
