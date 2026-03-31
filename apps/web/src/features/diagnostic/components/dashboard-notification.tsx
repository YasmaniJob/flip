'use client';

import { useMyDiagnosticStatus } from '../hooks/use-my-diagnostic';
import { useMyInstitution } from '@/features/institutions/hooks/use-my-institution';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, CheckCircle2, BarChart } from 'lucide-react';
import Link from 'next/link';
import { LEVEL_LABELS, LEVEL_ICONS } from '../types';

export function DashboardDiagnosticNotification() {
  const { data: status, isLoading: isLoadingStatus } = useMyDiagnosticStatus();
  const { data: institution, isLoading: isLoadingInstitution } = useMyInstitution();

  if (isLoadingStatus || isLoadingInstitution) return null;
  if (!status?.enabled) return null;

  // Case 1: Not started or In progress
  if (!status.completed) {
    return (
      <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden group">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row items-center gap-6 p-6">
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform duration-500">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-black tracking-tighter text-foreground uppercase">
                Diagnóstico de Habilidades Digitales
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl font-medium">
                Tu institución ha habilitado la evaluación diagnóstica. Completa tu perfil de competencias para recibir recomendaciones personalizadas y potenciar tu práctica docente.
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
                <Button asChild size="lg" className="w-full md:w-auto font-black uppercase tracking-widest text-xs gap-2 py-6 px-10">
                    <Link href={`/ie/${(institution as any)?.slug}/diagnostic`}>
                        {status.status === 'in_progress' ? 'Continuar Evaluación' : 'Iniciar Diagnóstico'}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </Button>
            </div>
          </div>
          
          {/* Progress hint if in progress */}
          {status.status === 'in_progress' && (
             <div className="px-6 py-2 bg-primary/10 border-t border-primary/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                    Sincronizado via {status.sessionId?.substring(0, 8)}... · Tienes un diagnóstico pendiente
                </p>
             </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Case 2: Completed (Show summary and link to results)
  return (
    <Card className="border-emerald-500/10 bg-emerald-500/5 shadow-none overflow-hidden group">
      <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <span className="text-2xl">{status.level ? LEVEL_ICONS[status.level] : '📊'}</span>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
            <h3 className="text-sm font-black tracking-tight text-foreground uppercase">
                Perfil Digital: <span className="text-emerald-600 font-black">{status.level ? LEVEL_LABELS[status.level] : 'Procesado'}</span>
            </h3>
            <div className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Válido para {new Date().getFullYear()}
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Has completado exitosamente la evaluación. Tus resultados han sido sincronizados y ya puedes revisar tu reporte detallado de competencias.
          </p>
        </div>

        <div className="shrink-0 w-full md:w-auto">
            <Button asChild variant="outline" size="sm" className="w-full md:w-auto font-black uppercase tracking-widest text-[10px] gap-2 border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-700 hover:text-emerald-800 transition-all px-6">
                <Link href="/diagnostico/resultados">
                    Ver Reporte Detallado
                    <BarChart className="w-3.5 h-3.5" />
                </Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
