'use client';

import { lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight, Loader2 } from 'lucide-react';
import { LEVEL_LABELS, LEVEL_ICONS } from '../types';
import type { DiagnosticLevel } from '../types';

// Lazy load PDF generator (solo se carga al hacer clic en descargar)
const DiagnosticPDFGenerator = lazy(() => 
  import('./diagnostic-pdf-generator').then(mod => ({
    default: mod.DiagnosticPDFGenerator
  }))
);

// Dynamic import de Recharts (solo se carga en resultados)
const RadarChartComponent = dynamic(
  () => import('recharts').then(mod => {
    const { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } = mod;
    
    return {
      default: ({ data }: any) => (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <PolarAngleAxis 
              dataKey="category" 
              tick={(props: any) => {
                const { x, y, payload } = props;
                const textLines = payload.value.split(' ');
                return (
                  <g transform={`translate(${x},${y})`}>
                    {textLines.map((line: string, i: number) => (
                      <text
                        key={i}
                        x={0}
                        y={i * 12}
                        dy={0}
                        textAnchor="middle"
                        fill="#475569"
                        style={{ 
                          fontSize: '10px', 
                          fontWeight: 600,
                          fontFamily: 'inherit'
                        }}
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                );
              }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Resultados"
              dataKey="score"
              stroke="#2563eb"
              strokeWidth={3}
              fill="#3b82f6"
              fillOpacity={0.15}
            />
          </RadarChart>
        </ResponsiveContainer>
      )
    };
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[320px] md:h-[450px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
);

// Dynamic import de Framer Motion
const motion = dynamic(
  () => import('framer-motion').then(mod => mod.motion as any),
  { ssr: false }
);

interface ResultsScreenProps {
  userName: string;
  institutionName: string;
  institutionLogo?: string | null;
  educationalLevel?: string;
  province?: string;
  overallScore: number;
  level: DiagnosticLevel;
  categoryScores: Record<string, number>;
  categoryNames: Record<string, string>;
  year?: number;
  onContinue?: () => void;
}

export function ResultsScreen({
  userName,
  institutionName,
  institutionLogo,
  educationalLevel,
  province,
  overallScore,
  level,
  categoryScores,
  categoryNames,
  year,
  onContinue,
}: ResultsScreenProps) {
  const currentYear = year || new Date().getFullYear();
  
  // Prepare data for radar chart
  const radarData = Object.entries(categoryScores).map(([categoryId, score]) => ({
    category: categoryNames[categoryId] || 'Unknown',
    score,
    fullMark: 100,
  }));

  // Componente motion.div con fallback
  const MotionDiv = (motion as any)?.div || 'div';
  
  return (
    <div className="min-h-screen bg-slate-50 p-4 py-8 md:py-16">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6 md:space-y-10"
      >
        {/* Header Section */}
        <header className="text-center space-y-4">
          <MotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 text-amber-600 rounded-full shadow-inner"
          >
            <Trophy className="w-10 h-10" />
          </MotionDiv>
          
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              ¡Diagnóstico Completado!
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              Aquí están tus resultados de {currentYear}, <span className="text-blue-600">{userName}</span>
            </p>
          </div>
        </header>
        
        {/* Main Content Card */}
        <section className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="p-6 md:p-12 space-y-10">
            
            {/* Main Score & Level */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <span className="text-7xl md:text-8xl font-black text-blue-600">
                  {overallScore}%
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-700 font-bold text-lg md:text-xl border border-slate-200">
                <span>{LEVEL_ICONS[level]}</span>
                <span className="uppercase tracking-wider">{LEVEL_LABELS[level]}</span>
              </div>
            </div>
            
            {/* Visualization Section */}
            <div className="relative h-[320px] md:h-[450px] -mx-4 md:mx-0">
              <RadarChartComponent data={radarData} />
            </div>
            
            {/* Dimensions Grid */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-xl border-b pb-2 border-slate-100">
                Desglose por Dimensión
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(categoryScores).map(([categoryId, score]) => (
                  <div
                    key={categoryId}
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/50"
                  >
                    <span className="text-sm md:text-base font-semibold text-slate-600 max-w-[70%]">
                      {categoryNames[categoryId]}
                    </span>
                    <span className="text-lg font-black text-blue-600">
                      {score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Action Buttons */}
        <footer className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
          <div className="w-full sm:w-auto">
            <Suspense fallback={
              <Button size="lg" disabled className="w-full sm:w-auto h-[52px] rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Cargando...
              </Button>
            }>
              <DiagnosticPDFGenerator
                userName={userName}
                institutionName={institutionName}
                institutionLogo={institutionLogo}
                educationalLevel={educationalLevel}
                province={province}
                level={level}
                overallScore={overallScore}
                completedAt={new Date().toISOString()}
                categoryScores={categoryScores}
                categoryNames={categoryNames}
                year={currentYear}
              />
            </Suspense>
          </div>
          
          {onContinue && (
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-[52px] rounded-xl border-2 border-slate-300 font-bold text-slate-600 hover:bg-white hover:text-blue-600 hover:border-blue-600 transition-all gap-2"
              onClick={onContinue}
            >
              Continuar en Flip
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </footer>
        
        <p className="text-center text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
          Tus resultados han sido guardados. Recibirás recomendaciones personalizadas para tus habilidades digitales.
        </p>
      </MotionDiv>
    </div>
  );
}
