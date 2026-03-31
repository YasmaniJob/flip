'use client';

import { useQuery } from '@tanstack/react-query';
import { useMyInstitution } from '@/features/institutions/hooks/use-my-institution';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMyDiagnosticStatus } from '../../hooks/use-my-diagnostic';
import { Loader2, XCircle, Users, TrendingUp, BarChart3, ArrowRight, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { LEVEL_LABELS, LEVEL_ICONS } from '../../types';
import type { DiagnosticLevel } from '../../types';

interface ResultsData {
  totalSessions: number;
  averageScore: number;
  levelDistribution: Record<DiagnosticLevel, number>;
  categoryAverages: Record<string, { name: string; average: number }>;
  sessions: Array<{
    id: string;
    name: string;
    overallScore: number;
    level: DiagnosticLevel;
    completedAt: string;
    status: string;
  }>;
}

export function DiagnosticResultsTab() {
  const { data: institution } = useMyInstitution();
  const { data: myStatus } = useMyDiagnosticStatus();

  const { data, isLoading, error } = useQuery({
    queryKey: ['diagnostic-results', institution?.id],
    queryFn: async () => {
      if (!institution) throw new Error('No institution');
      const res = await fetch(`/api/institutions/${institution.id}/diagnostic/results`);
      if (!res.ok) throw new Error('Error al cargar resultados');
      return res.json() as Promise<ResultsData>;
    },
    enabled: !!institution,
  });

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
            <p className="text-gray-600">Error al cargar resultados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Navigation Header (Visible for all admins)
  const navigationHeader = (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 p-6 rounded-xl border border-primary/10 mb-8">
      <div>
        <h3 className="text-lg font-black tracking-tighter text-foreground uppercase">Evaluación Institucional</h3>
        <p className="text-xs font-medium text-muted-foreground text-balance">Monitorea el progreso y nivel digital de toda tu plana docente.</p>
      </div>
      <Button asChild variant={myStatus?.completed ? "outline" : "default"} className={myStatus?.completed ? "font-black uppercase tracking-widest text-[10px] gap-2 border-primary/20 hover:bg-primary/10 text-primary bg-white" : "font-black uppercase tracking-widest text-[10px] gap-2 shadow-none"}>
        <Link href={myStatus?.completed ? "/diagnostico/resultados" : `/ie/${(institution as any)?.slug}/diagnostic`}>
          {myStatus?.completed ? 'Ver mis resultados personales' : 'Realizar mi diagnóstico'}
          {myStatus?.completed ? <ArrowRight className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
        </Link>
      </Button>
    </div>
  );

  if (!data || data.totalSessions === 0) {
    return (
      <div className="space-y-6">
        {navigationHeader}
        <Card>
          <CardHeader>
            <CardTitle>Resultados y Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay resultados disponibles aún</p>
              <p className="text-sm text-gray-500 mt-2">
                Los resultados aparecerán cuando los docentes completen el diagnóstico
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare data for charts
  const radarData = Object.entries(data.categoryAverages).map(([_, cat]) => ({
    category: cat.name,
    average: cat.average,
  }));

  const levelData = Object.entries(data.levelDistribution).map(([level, count]) => ({
    level: LEVEL_LABELS[level as DiagnosticLevel],
    count,
    icon: LEVEL_ICONS[level as DiagnosticLevel],
  }));

  return (
    <div className="space-y-6">
      {navigationHeader}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Docentes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              Han completado el diagnóstico
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Promedio General
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              Puntaje promedio institucional
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nivel Predominante
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {levelData.reduce((prev, curr) => 
                curr.count > prev.count ? curr : prev
              ).level}
            </div>
            <p className="text-xs text-muted-foreground">
              Nivel más común
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Promedio por Dimensión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Radar
                    name="Promedio"
                    dataKey="average"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Nivel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={levelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="level"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#6b7280' }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    name="Docentes"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.categoryAverages).map(([id, cat]) => (
              <div
                key={id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-700">
                  {cat.name}
                </span>
                <span className={`text-lg font-bold ${cat.average < 60 ? 'text-orange-600' : 'text-blue-600'}`}>
                  {cat.average}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Hub Context (SaaS Feature) */}
      <Card className="border-orange-500/20 bg-orange-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <XCircle className="h-5 w-5" />
            Análisis de Brechas Críticas
          </CardTitle>
          <CardDescription className="text-orange-900/70 text-xs font-medium">
            Dimensiones que requieren atención prioritaria a nivel institucional (Promedio &lt; 60%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data.categoryAverages)
              .filter(([_, cat]) => cat.average < 60)
              .map(([id, cat]) => (
                <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/50 rounded-md border border-orange-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-sm font-bold text-orange-900">{cat.name}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <span className="text-sm font-black text-orange-700">{cat.average}%</span>
                      <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-800 hover:bg-orange-500/10 text-[10px] uppercase tracking-wider font-bold h-7">
                        Recomendar Capacitación
                      </Button>
                    </div>
                </div>
              ))}
            {Object.values(data.categoryAverages).every(cat => cat.average >= 60) && (
              <div className="text-sm text-emerald-700 font-medium py-2 rounded-md bg-emerald-500/10 px-4 flex items-center gap-2 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                No se han detectado brechas críticas institucionales en esta evaluación.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
