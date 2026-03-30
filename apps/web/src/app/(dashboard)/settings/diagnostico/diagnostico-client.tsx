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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Diagnóstico de Habilidades Digitales
        </h1>
        <p className="text-gray-600 mt-1">
          Configura y gestiona el módulo de diagnóstico para tu institución
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config" className="gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configuración</span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <FileQuestion className="w-4 h-4" />
            <span className="hidden sm:inline">Cuestionario</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Pendientes</span>
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Resultados</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="config">
          <DiagnosticConfigTab />
        </TabsContent>
        
        <TabsContent value="questions">
          <DiagnosticQuestionsTab institutionId={institution.id} />
        </TabsContent>
        
        <TabsContent value="pending">
          <DiagnosticPendingTab institutionId={institution.id} />
        </TabsContent>
        
        <TabsContent value="results">
          <DiagnosticResultsTab institutionId={institution.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
