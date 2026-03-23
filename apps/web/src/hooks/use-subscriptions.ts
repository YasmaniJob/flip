import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";

export interface Subscription {
  id: string;
  name: string;
  codigoModular: string | null;
  subscriptionStatus: 'trial' | 'active' | 'inactive';
  trialEndsAt: string | null;
  createdAt: string;
  userCount: number;
  subscriptionPlan?: 'trial' | 'mensual' | 'bimestral' | 'trimestral' | 'anual';
  subscriptionStartDate?: string | null;
  nivel?: 'primaria' | 'secundaria' | 'ambos';
  subscriptionHistory?: {
    event: string;
    details?: string | null;
    plan?: string | null;
    date: string;
  }[];
  institutionalUsers?: {
    id: string;
    name: string;
    role: string;
    lastAccess: string | null;
  }[];
}

export interface UpdateSubscriptionInput {
  action: 'extend_trial' | 'activate' | 'deactivate' | 'reset_to_trial';
  days?: number;
  expiresAt?: string;
  plan?: 'mensual' | 'bimestral' | 'trimestral' | 'anual';
}

export function useSubscriptions() {
  const api = useApiClient();

  return useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => api.get<Subscription[]>('/admin/subscriptions'),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  const api = useApiClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubscriptionInput }) =>
      api.patch(`/admin/subscriptions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
  });
}

export function useSubscriptionDetail(id: string | null) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['admin', 'subscriptions', 'detail', id],
    queryFn: () => id ? api.get<Subscription>(`/admin/subscriptions/${id}`) : null,
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}
