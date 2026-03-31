'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { LEVEL_LABELS, LEVEL_ICONS } from '../types';
import type { DiagnosticLevel } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DigitalDiplomaProps {
  userName: string;
  institutionName: string;
  institutionLogo?: string | null;
  level: DiagnosticLevel;
  overallScore: number;
  completedAt: string;
  categoryScores: Record<string, number>;
  categoryNames: Record<string, string>;
}

export function DigitalDiploma({
  userName,
  institutionName,
  institutionLogo,
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

  // Technological "cyber" grid pattern in SVG
  const gridPattern = (
    <svg width="100%" height="100%" className="absolute inset-0 opacity-[0.03] pointer-events-none">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );

  return (
    <div id="digital-diploma" className="hidden print:block print:fixed print:inset-0 print:bg-[#020617] print:z-[9999999] print:m-0 print:p-0 print:overflow-hidden">
      {/* Physical A4 Container (Landscape) */}
      <div className="print:w-[297mm] print:h-[210mm] bg-[#020617] relative overflow-hidden flex items-center justify-center p-0 m-0 box-border text-slate-100">
        
        {gridPattern}
        
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />

        {/* Techno-Borders / Brackets */}
        <div className="absolute inset-6 border border-slate-800/50 pointer-events-none" />
        
        {/* Cyber Corners */}
        {[
          "top-8 left-8 border-t-2 border-l-2",
          "top-8 right-8 border-t-2 border-r-2",
          "bottom-8 left-8 border-b-2 border-l-2",
          "bottom-8 right-8 border-b-2 border-r-2"
        ].map((pos, i) => (
          <div key={i} className={`absolute w-16 h-16 border-blue-500/50 ${pos}`}>
            <div className={`absolute w-2 h-2 bg-blue-400 ${pos.includes('top') ? '-top-1' : '-bottom-1'} ${pos.includes('left') ? '-left-1' : '-right-1'}`} />
          </div>
        ))}

        {/* Content Container */}
        <div className="w-full h-full p-12 flex flex-col items-center justify-between z-10 relative">
          
          {/* Header */}
          <div className="w-full flex justify-between items-start px-4">
             <div className="flex items-center gap-4 bg-slate-900/40 p-3 rounded-lg border border-slate-800/50">
               {institutionLogo ? (
                 <img src={institutionLogo} alt="Logo" className="w-10 h-10 object-contain brightness-110" />
               ) : (
                 <div className="w-10 h-10 bg-blue-500/20 rounded-md border border-blue-500/30 flex items-center justify-center text-blue-400">IE</div>
               )}
               <div className="text-left">
                 <p className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-400/60 leading-none mb-1">Entidad Educativa Sugerida</p>
                 <p className="text-[11px] font-black text-white/90 uppercase tracking-wider leading-none">{institutionName}</p>
               </div>
             </div>

             <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-blue-400">Digital Certificate v2.0</p>
                <p className="text-[7px] font-mono text-slate-500">System ID: DIAG-FLOW-{completedAt.substring(0, 10).replace(/-/g, '')}</p>
             </div>
          </div>

          {/* Titles */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              CONOCIMIENTO <span className="text-blue-500 font-serif">TRANSFORMADO</span><br />
              <span className="text-xl tracking-[0.8em] font-normal text-slate-400 opacity-80 pl-2">COMPETENCIA DIGITAL</span>
            </h1>
            
            <div className="flex items-center justify-center gap-4 opacity-40">
              <div className="h-[1px] w-12 bg-blue-500" />
              <div className="w-1.5 h-1.5 bg-blue-500 rotate-45" />
              <div className="h-[1px] w-12 bg-blue-500" />
            </div>
          </div>

          {/* Recipient */}
          <div className="text-center w-full">
            <p className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Otorgado a la excelencia de:</p>
            <div className="relative inline-block">
               <h2 className="text-6xl font-black text-white tracking-tight relative z-10 px-8">
                 {userName.toUpperCase()}
               </h2>
               <div className="absolute -bottom-2 left-0 w-full h-4 bg-blue-600/10 -rotate-1 skew-x-12 -z-1" />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="w-full max-w-5xl grid grid-cols-12 gap-8 items-center bg-slate-900/30 p-6 rounded-2xl border border-slate-800/40 backdrop-blur-sm">
             <div className="col-span-3 flex flex-col items-center justify-center text-center space-y-1">
                <div className="text-4xl filter saturate-150 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">{LEVEL_ICONS[level]}</div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">{LEVEL_LABELS[level]}</p>
             </div>

             <div className="col-span-6 px-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Precisión del Diagnóstico</p>
                    <p className="text-2xl font-black text-white">{overallScore}%</p>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-[2px]">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000" 
                      style={{ width: `${overallScore}%` }}
                    />
                  </div>
                </div>
             </div>

             <div className="col-span-3 flex justify-center">
                <div className="w-28 h-28 opacity-90 filter hue-rotate-15">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="70%">
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 6, fontWeight: 800 }} />
                      <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

          {/* Description Footer */}
          <div className="w-full flex justify-between items-end px-4">
             <div className="text-left space-y-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Validación de Sistema</p>
                  <p className="text-[10px] font-mono text-blue-400 bg-blue-400/5 px-2 py-1 rounded border border-blue-400/10">
                    SESS_{completedAt.substring(0, 10).replace(/-/g, '')}_{overallScore}_{Math.random().toString(36).substring(7).toUpperCase()}
                  </p>
                </div>
                <div className="h-6 w-32 border-l border-blue-500/30 pl-3">
                  <p className="text-[7px] text-slate-500 italic leading-tight">
                    Certificado digital generado por<br />FLIP ANALYTICS ENGINE
                  </p>
                </div>
             </div>

             <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-lg border border-slate-700 bg-slate-900/50 flex items-center justify-center relative shadow-inner overflow-hidden">
                   <div className="absolute inset-0 bg-blue-500/5 transition-colors group-hover:bg-blue-500/10" />
                   <span className="text-[8px] font-black text-blue-500 leading-none text-center transform -rotate-45">FLIP<br/>SIG</span>
                </div>
                <p className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">Sello Electrónico</p>
             </div>

             <div className="text-right space-y-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Emission Data</p>
                  <p className="text-[11px] font-black text-slate-200">
                    {format(new Date(completedAt), "d 'de' MMMM 'del' yyyy", { locale: es }).toUpperCase()}
                  </p>
                </div>
                <div className="space-y-1 pt-2">
                   <div className="w-full h-[1px] bg-blue-500/50 mb-1" />
                   <p className="text-[9px] font-black uppercase text-white tracking-widest leading-none">{institutionName}</p>
                   <p className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter leading-none italic">Verified Authority</p>
                </div>
             </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @media print {
          /* Force physical A4 landscape dimensions */
          @page {
            size: A4 landscape !important;
            margin: 0 !important;
          }

          /* Extreme reset for multi-page prevention */
          header, 
          nav, 
          footer, 
          aside,
          button,
          [role="banner"],
          [role="navigation"],
          [role="contentinfo"] {
            display: none !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 210mm !important;
            width: 297mm !important;
            overflow: hidden !important;
            background: #020617 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* General hide using visibility to avoid parent layout issues */
          body * {
            visibility: hidden !important;
          }

          /* Definitive show for the certificate container and all its content */
          #digital-diploma, 
          #digital-diploma * {
            visibility: visible !important;
          }

          #digital-diploma {
            display: block !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            background: #020617 !important;
            z-index: 99999999 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          
          /* Ensure the inner content doesn't break the layout */
          #digital-diploma > div {
            width: 297mm !important;
            height: 210mm !important;
            position: relative !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}
