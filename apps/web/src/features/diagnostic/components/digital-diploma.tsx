'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { LEVEL_LABELS, LEVEL_ICONS } from '../types';
import type { DiagnosticLevel } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DigitalDiplomaProps {
  userName: string;
  institutionName: string;
  level: DiagnosticLevel;
  overallScore: number;
  completedAt: string;
  categoryScores: Record<string, number>;
  categoryNames: Record<string, string>;
}

export function DigitalDiploma({
  userName,
  institutionName,
  level,
  overallScore,
  completedAt,
  categoryScores,
  categoryNames,
}: DigitalDiplomaProps) {
  const radarData = Object.entries(categoryScores).map(([id, score]) => ({
    category: categoryNames[id] || 'Dimensión',
    score,
    fullMark: 100,
  }));

  return (
    <div id="digital-diploma" className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[9999]">
      <div className="w-full h-full p-8 flex items-center justify-center bg-white aspect-[1.414/1]">
        {/* Certificate Frame/Border */}
        <div className="w-full h-full border-[12px] border-double border-primary/30 p-4 relative rounded-sm">
          {/* Ornamental Corners */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-primary rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-8 border-r-8 border-primary rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-8 border-l-8 border-primary rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-primary rounded-br-lg" />

          {/* Certificate Content */}
          <div className="h-full flex flex-col items-center justify-between py-12 text-center">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                 <div className="h-px w-24 bg-primary/30" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Reconocimiento Institucional</span>
                 <div className="h-px w-24 bg-primary/30" />
              </div>
              <h1 className="text-4xl font-serif font-black tracking-tight text-foreground uppercase">
                Certificado de Competencia Digital
              </h1>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                OTORGADO POR FLIP Y {institutionName.toUpperCase()}
              </p>
            </div>

            {/* Recipient */}
            <div className="space-y-4">
              <p className="text-lg font-medium italic text-muted-foreground">Se otorga el presente reconocimiento a:</p>
              <h2 className="text-5xl font-serif font-bold text-primary border-b-2 border-primary/20 pb-2 px-12 inline-block">
                {userName.toUpperCase()}
              </h2>
            </div>

            {/* Achievement */}
            <div className="max-w-2xl text-center space-y-4 px-8">
              <p className="text-md leading-relaxed text-balance font-medium text-foreground/80">
                Por haber completado satisfactoriamente la evaluación diagnóstica de habilidades digitales, 
                demostrando un nivel de desempeño de:
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">{LEVEL_ICONS[level]}</span>
                <span className="text-3xl font-black uppercase tracking-tighter text-foreground">
                  {LEVEL_LABELS[level]}
                </span>
                <span className="bg-primary px-3 py-1 rounded-full text-white text-lg font-black">
                  {overallScore}%
                </span>
              </div>
            </div>

            {/* Evidence Chart (Mini Radar) */}
            <div className="w-full flex justify-center items-center gap-10">
               <div className="w-48 h-48 opacity-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 6, fontWeight: 700 }} />
                      <Radar name="Nivel" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
               </div>
               <div className="text-left space-y-1">
                 <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-2">Resumen de Dimensiones:</p>
                 {radarData.slice(0, 5).map((d) => (
                   <div key={d.category} className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                     <span className="text-[9px] font-bold text-foreground truncate w-32">{d.category}</span>
                     <span className="text-[9px] font-black text-primary">{d.score}%</span>
                   </div>
                 ))}
               </div>
            </div>

            {/* Footer / Validity */}
            <div className="w-full max-w-4xl border-t border-primary/10 pt-8 flex items-center justify-between px-12">
               <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Código de Validación</p>
                  <p className="text-[9px] font-mono font-bold text-foreground">FLIP-DIAG-{completedAt.substring(0, 10).replace(/-/g, '')}-{(Math.random() * 10000).toFixed(0)}</p>
               </div>

               <div className="text-center">
                  <div className="h-14 w-14 bg-primary/5 rounded-full border border-primary/10 border-dashed flex items-center justify-center mx-auto mb-1">
                    <span className="text-xs font-black text-primary/40 uppercase -rotate-12">Sello Digital</span>
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">Emitido por Flip Analytics</p>
               </div>

               <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha de Emisión</p>
                  <p className="text-[10px] font-bold text-foreground">
                    {format(new Date(completedAt), "d 'de' MMMM 'del' yyyy", { locale: es })}
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #digital-diploma, #digital-diploma * {
            visibility: visible;
          }
          #digital-diploma {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white !important;
            -webkit-print-color-adjust: exact;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
