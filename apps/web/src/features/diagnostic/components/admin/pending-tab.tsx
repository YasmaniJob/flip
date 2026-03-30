'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, User, Mail, IdCard, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PendingSession {
  id: string;
  name: string;
  dni: string;
  email: string;
  overallScore: number;
  level: string;
  categoryScores: Record<string, number>;
  completedAt: string;
  createdAt: string;
}

interface PendingTabProps {
  institutionId: string;
}

export function DiagnosticPendingTab({ institutionId }: PendingTabProps) {
  const queryClient = useQueryClient();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Fetch pending sessions
  const { data, isLoading, error } = useQuery({
    queryKey: ['diagnostic-pending', institutionId],
    queryFn: async () => {
      const res = await fetch(`/api/institutions/${institutionId}/diagnostic/pending`);
      if (!res.ok) throw new Error('Error al cargar docentes pendientes');
      return res.json() as Promise<{ sessions: PendingSession[]; total: number }>;
    },
    refetchInterval: 30000, // Refetch every 30s
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(
        `/api/institutions/${institutionId}/diagnostic/approve/${sessionId}`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al aprobar docente');
      }
      return res.json();
    },
    onSuccess: (data, sessionId) => {
      toast.success(data.message || 'Docente aprobado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['diagnostic-pending', institutionId] });
      queryClient.invalidateQueries({ queryKey: ['diagnostic-results', institutionId] });
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

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Avanzado': return 'bg-green-100 text-green-800';
      case 'Intermedio': return 'bg-blue-100 text-blue-800';
      case 'Básico': return 'bg-yellow-100 text-yellow-800';
      case 'Inicial': return 'bg-orange-100 text-orange-800';
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
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{session.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <IdCard className="h-3.5 w-3.5" />
                            DNI: {session.dni}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {session.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Puntaje:</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {session.overallScore}
                        </span>
                        <span className="text-sm text-gray-500">/100</span>
                      </div>
                      <Badge className={getLevelColor(session.level)}>
                        {session.level}
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
                    className="ml-4"
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
