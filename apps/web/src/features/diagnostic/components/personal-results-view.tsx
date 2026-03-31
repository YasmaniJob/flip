'use client';

import { useMyDiagnosticStatus } from '../hooks/use-my-diagnostic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle, FileText, Download, Briefcase, Award } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { LEVEL_LABELS, LEVEL_ICONS } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function PersonalDiagnosticResultsView() {
  const { data: status, isLoading, error } = useMyDiagnosticStatus();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Analizando tus competencias...</p>
      </div>
    );
  }

  if (error || !status?.enabled) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 shadow-none">
        <CardContent className="py-12 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tighter text-foreground uppercase">Algo salió mal</h3>
            <p className="text-sm text-muted-foreground">No pudimos cargar tus resultados de diagnóstico o el módulo no está activo.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status.completed) {
      return (
        <Card className="shadow-none border-dashed border-2">
            <CardContent className="py-20 text-center space-y-6">
                <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-10 w-10 text-muted-foreground opacity-30" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-black tracking-tighter text-foreground uppercase">Diagnóstico Pendiente</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Aún no has completado la evaluación de habilidades digitales para este periodo.
                    </p>
                </div>
                <Button asChild size="lg" className="font-black uppercase tracking-widest text-xs px-10">
                    <a href={`/ie/IE_SLUG/diagnostic`}>Comenzar Evaluación</a>
                </Button>
            </CardContent>
        </Card>
      );
  }

  // Data for Radar Chart
  const radarData = status.categoryScores ? Object.entries(status.categoryScores).map(([id, score]) => ({
    category: status.categoryNames?.[id] || 'Dimensión',
    score: score,
    fullMark: 100,
  })) : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Summary & Level */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="overflow-hidden border-primary/20 shadow-none">
                <div className="bg-primary p-8 text-center space-y-4">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20 backdrop-blur-sm">
                        <span className="text-4xl">{status.level ? LEVEL_ICONS[status.level] : '🎯'}</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Perfil Digital Alcanzado</p>
                        <h2 className="text-2xl font-black text-white tracking-tighter leading-none">
                            {status.level ? LEVEL_LABELS[status.level] : 'Completado'}
                        </h2>
                    </div>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg"><Award className="h-4 w-4 text-muted-foreground" /></div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nivel General</span>
                        </div>
                        <span className="text-xl font-black text-foreground">{status.overallScore}%</span>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg"><Briefcase className="h-4 w-4 text-muted-foreground" /></div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Fecha Sinc.</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">
                            {status.completedAt ? format(new Date(status.completedAt), 'd MMM, yyyy', { locale: es }) : 'Reciente'}
                        </span>
                    </div>

                    <Button variant="outline" className="w-full font-black uppercase tracking-widest text-[10px] gap-2 py-6 border-2" onClick={() => window.print()}>
                        <Download className="w-4 h-4" />
                        Descargar Reporte PDF
                    </Button>
                </CardContent>
            </Card>

            <Card className="shadow-none border-emerald-500/10 bg-emerald-500/5">
                <CardContent className="p-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-3">Recomendaciones</h4>
                    <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                        Basado en tu perfil de <strong>{status.level ? LEVEL_LABELS[status.level] : 'Docente'}</strong>, te recomendamos fortalecer tu dominio en las áreas con puntaje menor al 60% para alcanzar el siguiente nivel de madurez digital.
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* Right Column: Radar Chart and Breakdown */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-none flex flex-col h-full border-border/60">
                <CardHeader>
                    <CardTitle className="text-lg font-black tracking-tighter uppercase">Análisis de Dimensiones</CardTitle>
                    <CardDescription className="text-xs font-medium">Comparativa de puntajes por áreas de competencia digital MINEDU.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center min-h-[400px]">
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis
                                    dataKey="category"
                                    tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                                />
                                <PolarRadiusAxis
                                    angle={90}
                                    domain={[0, 100]}
                                    tick={{ fill: '#6b7280', fontSize: 10 }}
                                />
                                <Radar
                                    name="Mi Nivel"
                                    dataKey="score"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.6}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                        {Object.entries(status.categoryScores || {}).map(([id, score]) => (
                            <div key={id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/40">
                                <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground leading-tight max-w-[180px]">
                                    {status.categoryNames?.[id] || 'Dimensión'}
                                </span>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                                        <div className="h-full bg-primary" style={{ width: `${score}%` }} />
                                    </div>
                                    <span className="text-sm font-black text-foreground w-10 text-right">{score}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
