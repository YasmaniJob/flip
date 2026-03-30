'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyInstitution } from '@/features/institutions/hooks/use-my-institution';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, User, Mail, CreditCard, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LEVEL_LABELS, LEVEL_ICONS } from '../../types';
import type { DiagnosticLevel } from '../../types';

interface PendingSession {
  id: string;
  name: string;
  dni?: string;
  email?: string;
  overallScore: number;
  level: DiagnosticLevel;
  categoryScores: Record<string, number>;
  completedAt: string;
  createdAt: string;
}

export function DiagnosticPendingTab() {
  const { data: institution } = useMyInstitution();
  const queryClient = useQueryClient();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Fetch pending sessions
  const { data, isLoading, error } = useQuery({
    queryKey: ['diagnostic-pending', institution?.id],
    queryFn: async () => {
      if (!institution) throw new Error('No institution');
      const res = await fetch(`/api/institutions/${institution.id}/diagnostic/pending`);
      if (!res.ok) throw new Error('Error al cargar docentes pendientes');
      return res.json() as Promise<{ sessions: PendingSession[]; total: number }>;
    },
    enabled: !!institution,
    refetchInterval: 30000, // Refetch every 30s
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!institution) throw new Error('No institution');
      const res = await fetch(
        `/api/institutions/${institution.id}/diagnostic/approve/${sessionId}`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al aprobar docente');
      }
      return res.json();
    },
    onSuccess: (data) => {
      const message = data.action === 'created' 
        ? 'Docente creado y aprobado exitosamente'
        : 'Docente vinculado exitosamente';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['diagnostic-pending', institution?.id] });
      queryClient.invalidateQueries({ queryKey: ['diagnostic-results', institution?.id] });
      setApprovingId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setApprovingId(null);
    },
  });

  const handleApprove = (sessionId: string) => {
    setApprovingId(sessionId);
    approveMutation.mutate(sessionId);
  };

  const getLevelColor = (level: DiagnosticLevel) => {
    switch (level) {
      case 'mentor': return 'bg-green-100 text-green-800';
      case 'competente': return 'bg-blue-100 text-blue-800';
      case 'en_desarrollo': return 'bg-yellow-100 text-yellow-800';
      case 'explorador': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">Error al cargar docentes pendientes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sessions = data?.sessions || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Docentes Pendientes de Aprobación</CardTitle>
        <CardDescription>
          Revisa y aprueba docentes que completaron el diagnóstico ({sessions.length} pendientes)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay docentes pendientes de aprobación</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {session.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900">{session.name}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
                          {session.dni && (
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3.5 w-3.5" />
                              {session.dni}
                            </span>
                          )}
                          {session.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3.5 w-3.5" />
                              {session.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Puntaje:</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {session.overallScore}%
                        </span>
                      </div>
                      <Badge className={getLevelColor(session.level)}>
                        <span className="mr-1">{LEVEL_ICONS[session.level]}</span>
                        {LEVEL_LABELS[session.level]}
                      </Badge>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      Completado el {format(new Date(session.completedAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </div>
                  </div>

                  {/* Action */}
                  <Button
                    onClick={() => handleApprove(session.id)}
                    disabled={approvingId === session.id}
                    className="flex-shrink-0"
                  >
                    {approvingId === session.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Aprobando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprobar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
