'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, XCircle, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';

interface ResultsData {
  totalSessions: number;
  averageScore: number;
  levelDistribution: Record<string, number>;
  categoryAverages: Record<string, { name: string; average: number }>;
  sessions: Array<{
    id: string;
    name: string;
    overallScore: number;
    level: string;
    completedAt: string;
    status: string;
  }>;
}

interface ResultsTabProps {
  institutionId: string;
}

export function DiagnosticResultsTab({ institutionId }: ResultsTabProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['diagnostic-results', institutionId],
    queryFn: async () => {
      const res = await fetch(`/api/institutions/${institutionId}/diagnostic/results`);
      if (!res.ok) throw new Error('Error al cargar resultados');
      return res.json() as Promise<ResultsData>;
    },
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

  if (!data || data.totalSessions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados y Estadísticas</CardTitle>
          <CardDescription>
            Visualiza los resultados del diagnóstico
          </CardDescription>
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
    );
  }

  // Prepare data for charts
  const radarData = Object.entries(data.categoryAverages).map(([id, cat]) => ({
    category: cat.name,
    score: cat.average,
  }));

  const levelData = Object.entries(data.levelDistribution).map(([level, count]) => ({
    level,
    count,
  }));

  const levelColors: Record<string, string> = {
    'Avanzado': '#10b981',
    'Intermedio': '#3b82f6',
    'Básico': '#eab308',
    'Inicial': '#f97316',
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Docentes</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSessions}</div>
            <p className="text-xs text-gray-600 mt-1">
              Diagnósticos completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntaje Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageScore}</div>
            <p className="text-xs text-gray-600 mt-1">
              De 100 puntos posibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nivel Predominante</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.entries(data.levelDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Nivel más común
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart - Category Averages */}
        <Card>
          <CardHeader>
            <CardTitle>Promedios por Dimensión</CardTitle>
            <CardDescription>
              Puntaje promedio en cada dimensión del diagnóstico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Puntaje"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Nivel</CardTitle>
            <CardDescription>
              Cantidad de docentes en cada nivel de competencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={levelData}>
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Docentes" radius={[8, 8, 0, 0]}>
                  {levelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={levelColors[entry.level] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Diagnósticos Completados</CardTitle>
          <CardDescription>
            Listado de los diagnósticos más recientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.sessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{session.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(session.completedAt).toLocaleDateString('es-PE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{session.overallScore}</p>
                    <p className="text-xs text-gray-500">puntos</p>
                  </div>
                  <Badge className={getLevelColor(session.level)}>
                    {session.level}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
