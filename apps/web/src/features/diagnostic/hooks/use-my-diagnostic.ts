import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import type { DiagnosticLevel } from '../types';

export interface DiagnosticStatusResponse {
  enabled: boolean;
  completed: boolean;
  status?: 'not_started' | 'in_progress' | 'completed' | 'approved';
  overallScore?: number;
  level?: DiagnosticLevel;
  categoryScores?: Record<string, number>;
  categoryNames?: Record<string, string>;
  history?: Array<{
    id: string;
    overallScore: number;
    level: DiagnosticLevel;
    completedAt: string;
    status: string;
  }>;
  completedAt?: string;
  sessionId?: string;
  message?: string;
}

export const useMyDiagnosticStatus = () => {
    const api = useApiClient();

    return useQuery({
        queryKey: ['staff', 'me', 'diagnostic-status'],
        queryFn: () => api.get<DiagnosticStatusResponse>('/staff/me/diagnostic/status'),
        staleTime: 5 * 60 * 1000, // 5 min - diagnostic status doesn't change every second
    });
};
