"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncidentList } from "@/features/incidents/components/incident-list";
import { IncidentFilters } from "@/features/incidents/components/incident-filters";
import { useSession } from "@/lib/auth-client";
import type { IncidentPriority, IncidentStatus, IncidentType } from "@/features/incidents/types";

export function IncidenciasClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"all" | "mine" | "assigned">("all");
  const [filters, setFilters] = useState<{
    search?: string;
    status?: IncidentStatus;
    priority?: IncidentPriority;
    type?: IncidentType;
  }>({});

  const handleIncidentClick = (incidentId: string) => {
    router.push(`/incidencias/${incidentId}`);
  };

  const handleCreateClick = () => {
    router.push("/incidencias/nueva");
  };

  // Build filters based on active tab
  const getFilters = () => {
    const baseFilters = { ...filters };

    if (activeTab === "mine") {
      return { ...baseFilters, reporterId: session?.user?.id };
    }

    if (activeTab === "assigned") {
      return { ...baseFilters, assigneeId: session?.user?.id };
    }

    return baseFilters;
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
      <PageHeader
        title="Incidencias"
        description="Gestiona y da seguimiento a las incidencias reportadas"
        primaryAction={{
          label: "Nueva Incidencia",
          onClick: handleCreateClick,
          icon: Plus,
        }}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-3 rounded-none border border-border h-9">
          <TabsTrigger 
            value="all" 
            className="rounded-none text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Todas
          </TabsTrigger>
          <TabsTrigger 
            value="mine"
            className="rounded-none text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Mis Incidencias
          </TabsTrigger>
          <TabsTrigger 
            value="assigned"
            className="rounded-none text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Asignadas a mí
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="mt-6">
          <IncidentFilters onFiltersChange={setFilters} />
        </div>

        {/* All Incidents */}
        <TabsContent value="all" className="mt-6">
          <IncidentList
            filters={getFilters()}
            onIncidentClick={handleIncidentClick}
            onCreateClick={handleCreateClick}
          />
        </TabsContent>

        {/* My Incidents */}
        <TabsContent value="mine" className="mt-6">
          <IncidentList
            filters={getFilters()}
            onIncidentClick={handleIncidentClick}
            onCreateClick={handleCreateClick}
          />
        </TabsContent>

        {/* Assigned to Me */}
        <TabsContent value="assigned" className="mt-6">
          <IncidentList
            filters={getFilters()}
            onIncidentClick={handleIncidentClick}
            onCreateClick={handleCreateClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
