'use client';

import { useMyDiagnosticStatus } from '../hooks/use-my-diagnostic';
import { useMyInstitution } from '@/features/institutions/hooks/use-my-institution';
import { useSession } from '@/lib/auth-client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, FileText, Download, Briefcase, Award } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { LEVEL_LABELS, LEVEL_ICONS } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DigitalDiploma } from './digital-diploma';

export function PersonalDiagnosticResultsView() {
  const { data: status, isLoading, error } = useMyDiagnosticStatus();
  const { data: institution } = useMyInstitution();
  const { data: session } = useSession();

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

  if (!status.completed && status.history && status.history.length === 0) {
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
                    <a href={`/ie/${(institution as any)?.slug}/diagnostic`}>Comenzar Evaluación</a>
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
      
      {/* Printable Diploma (hidden by default) */}
      <DigitalDiploma 
        userName={session?.user?.name || 'Docente Flip'}
        institutionName={institution?.name || 'Flip Institution'}
        level={status.level!}
        overallScore={status.overallScore!}
        completedAt={status.completedAt || new Date().toISOString()}
        categoryScores={status.categoryScores!}
        categoryNames={status.categoryNames!}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Summary & Level */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="overflow-hidden border-primary/20 shadow-none">
                <div className="bg-primary p-8 text-center space-y-4">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20 backdrop-blur-sm shadow-inner group transition-all duration-500 hover:scale-105">
                        <span className="text-4xl drop-shadow-lg">{status.level ? LEVEL_ICONS[status.level] : '🎯'}</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Perfil Digital Alcanzado</p>
                        <h2 className="text-2xl font-black text-white tracking-tighter leading-none px-4 text-balance">
                            {status.level ? LEVEL_LABELS[status.level] : 'Completado'}
                        </h2>
                    </div>
                </div>
                <CardContent className="p-0 border-t border-primary/10">
                    <div className="px-6 space-y-2">
                        <div className="flex items-center justify-between py-4 border-b border-border/60">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted/60 rounded-lg"><Award className="h-4 w-4 text-primary/60" /></div>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nivel General</span>
                            </div>
                            <span className="text-2xl font-black text-foreground tracking-tighter">{status.overallScore}%</span>
                        </div>

                        <div className="flex items-center justify-between py-4 border-b border-border/60 text-right">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted/60 rounded-lg"><Briefcase className="h-4 w-4 text-muted-foreground" /></div>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-left">Fecha Sinc.</span>
                            </div>
                            <span className="text-sm font-bold text-foreground">
                                {status.completedAt ? format(new Date(status.completedAt), 'd MMM, yyyy', { locale: es }) : 'Reciente'}
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        <Button 
                            className="w-full font-black uppercase tracking-widest text-[10px] gap-2 py-7 border-2 group relative overflow-hidden" 
                            variant="outline"
                            onClick={() => window.print()}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                Descargar Diploma Digital
                            </span>
                            <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </Button>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight mt-3 text-center opacity-60">
                            Certificado válido para el periodo 2024
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-none border-emerald-500/10 bg-emerald-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <SparklesIcon className="w-12 h-12 text-emerald-500" />
                </div>
                <CardContent className="p-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-3 flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                        Recomendaciones
                    </h4>
                    <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                        Basado en tu perfil de <strong>{status.level ? LEVEL_LABELS[status.level] : 'Docente'}</strong>, te recomendamos fortalecer tu dominio en las áreas con puntaje menor al 60% para alcanzar el siguiente nivel de madurez digital.
                    </p>
                </CardContent>
            </Card>

            {/* Historical Evolution (SaaS Feature) */}
            {status.history && status.history.length > 1 && (
                <Card className="shadow-none border-border/60">
                    <div className="p-6 border-b border-border/40">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Evolución Histórica</h4>
                        <h3 className="text-lg font-black tracking-tight text-foreground">Tu Pasaporte Digital</h3>
                    </div>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/40">
                            {status.history.map((record, idx) => (
                                <div key={record.id} className="p-4 flex flex-col gap-2 hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-muted-foreground">
                                                {format(new Date(record.completedAt), 'MMM yyyy', { locale: es })}
                                            </span>
                                            {idx === 0 && (
                                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest">
                                                    Actual
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm font-black text-foreground">{record.overallScore}%</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                                        <span className="text-base leading-none">{LEVEL_ICONS[record.level]}</span>
                                        {LEVEL_LABELS[record.level]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Right Column: Radar Chart and Breakdown */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-none flex flex-col h-full border-border/60">
                <div className="p-8 border-b border-border/40">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Análisis de Competencia</h4>
                    <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">Desempeño por Dimensión</h3>
                </div>
                <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[450px] p-8">
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                                <PolarAngleAxis
                                    dataKey="category"
                                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                                />
                                <PolarRadiusAxis
                                    angle={90}
                                    domain={[0, 100]}
                                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                                    axisLine={false}
                                />
                                <Radar
                                    name="Mi Nivel"
                                    dataKey="score"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fill="url(#radarGradient)"
                                    fillOpacity={0.4}
                                />
                                <defs>
                                    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                    </linearGradient>
                                </defs>
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 mb-4">
                        {Object.entries(status.categoryScores || {}).map(([id, score]) => (
                            <div key={id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/40 hover:bg-muted/50 transition-colors">
                                <div className="space-y-1 pr-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-tight block">
                                        Dimensión Digital
                                    </span>
                                    <span className="text-xs font-bold text-foreground leading-tight line-clamp-1">
                                        {status.categoryNames?.[id] || 'Dimensión'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${score > 80 ? 'bg-emerald-500' : score > 50 ? 'bg-primary' : 'bg-orange-500'}`} 
                                            style={{ width: `${score}%` }} 
                                        />
                                    </div>
                                    <span className={`text-sm font-black w-10 text-right ${score > 80 ? 'text-emerald-600' : score > 50 ? 'text-primary' : 'text-orange-600'}`}>
                                        {score}%
                                    </span>
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

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063A2 2 0 0 0 14.063 15.5l-1.582 6.135a.5.5 0 0 1-.962 0z"/>
            <path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>
        </svg>
    );
}
