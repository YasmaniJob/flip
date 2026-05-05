"use client";

import { PageHeader } from "@/components/layout/page-header";
import { CreateIncidentForm } from "@/features/incidents/components/create-incident-form";

export default function NuevaIncidenciaPage() {
  return (
    <div className="p-8 max-w-[900px] mx-auto min-h-screen space-y-6">
      <PageHeader
        title="Nueva Incidencia"
        description="Reporta un problema o incidente que requiera atención"
      />

      <div className="bg-card border border-border p-6">
        <CreateIncidentForm />
      </div>
    </div>
  );
}
