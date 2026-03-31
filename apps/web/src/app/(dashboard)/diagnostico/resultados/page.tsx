import { PersonalDiagnosticResultsView } from '@/features/diagnostic/components/personal-results-view';
import { BarChart3 } from 'lucide-react';

export const metadata = {
  title: 'Resultados del Diagnóstico Digital | Flip',
};

export default function DiagnosticResultsPage() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 bg-background">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Reporte Individual</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-4">
          Mis Competencias Digitales
        </h1>
        <p className="text-sm text-muted-foreground font-medium max-w-2xl">
          Visualiza tu perfil diagnóstico basado en el Marco de Competencia Digital de MINEDU y los estándares institucionales.
        </p>
      </div>

      <PersonalDiagnosticResultsView />
    </div>
  );
}
