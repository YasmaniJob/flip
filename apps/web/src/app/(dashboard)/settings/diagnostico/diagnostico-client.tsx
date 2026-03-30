'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, FileQuestion, Users, BarChart3 } from 'lucide-react';
import { useMyInstitution } from '@/features/institutions/hooks/use-my-institution';
import { DiagnosticConfigTab } from '@/features/diagnostic/components/admin/config-tab';
import { DiagnosticQuestionsTab } from '@/features/diagnostic/components/admin/questions-tab';
import { DiagnosticPendingTab } from '@/features/diagnostic/components/admin/pending-tab';
import { DiagnosticResultsTab } from '@/features/diagnostic/components/admin/results-tab';
import { Loader2 } from 'lucide-react';

export function DiagnosticSettingsClient() {
  const [activeTab, setActiveTab] = useState('config');
  const { data: institution, isLoading } = useMyInstitution();
  
  // Check feature flag
  const diagnosticAdminEnabled = process.env.NEXT_PUBLIC_FEATURE_DIAGNOSTIC_ADMIN_PANEL === 'true';
  
  if (!diagnosticAdminEnabled) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">
          El panel de diagnóstico no está disponible actualmente.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">
          No se pudo cargar la información de la institución.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-foreground font-sans">
          Diagnóstico de Habilidades Digitales
        </h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-transparent border-b border-border w-full flex justify-start rounded-none h-12 p-0">
          <TabsTrigger 
            value="config" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-black uppercase tracking-widest text-[11px] h-full data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-all gap-2"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Configuración</span>
          </TabsTrigger>
          <TabsTrigger 
            value="questions" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-black uppercase tracking-widest text-[11px] h-full data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-all gap-2"
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cuestionario</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-black uppercase tracking-widest text-[11px] h-full data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-all gap-2"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pendientes</span>
          </TabsTrigger>
          <TabsTrigger 
            value="results" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-black uppercase tracking-widest text-[11px] h-full data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-all gap-2"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Resultados</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="config">
          <DiagnosticConfigTab />
        </TabsContent>
        
        <TabsContent value="questions">
          <DiagnosticQuestionsTab institutionId={institution!.id} />
        </TabsContent>
        
        <TabsContent value="pending">
          <DiagnosticPendingTab />
        </TabsContent>
        
        <TabsContent value="results">
          <DiagnosticResultsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
