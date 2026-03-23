"use client";

import { useState } from "react";
import { useSubscriptions, useUpdateSubscription, type Subscription } from "@/hooks/use-subscriptions";
import { SubscriptionDetailsModal } from "@/features/subscriptions/components/subscription-details-modal";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  MoreHorizontal, 
  Plus, 
  Power, 
  Eye, 
  Ban, 
  AlertCircle
} from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TH = "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60";

// --- Sub-components ---

function StatusBadge({ sub }: { sub: Subscription }) {
  const status = sub.subscriptionStatus;
  const plan = sub.subscriptionPlan || 'trial';

  if (status === "inactive") {
    return (
      <div className="inline-flex items-center px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 border-rose-500/20">
        VENCIDO
      </div>
    );
  }

  const isAnual = plan === 'anual';
  const isTrial = plan === 'trial' || status === 'trial';

  const styles = isTrial 
    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
    : isAnual
      ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
      : "bg-blue-500/10 text-blue-600 border-blue-500/20";

  return (
    <div className={cn("inline-flex items-center px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider", styles)}>
      {plan === 'trial' ? 'TRIAL' : plan}
    </div>
  );
}

function ExpirationDisplay({ sub }: { sub: Subscription }) {
  if (sub.subscriptionStatus === "inactive") {
    return <span className="text-xs font-bold text-rose-600">Vencido</span>;
  }

  if (sub.subscriptionStatus === "trial" && sub.trialEndsAt) {
    const now = new Date();
    const endDate = new Date(sub.trialEndsAt);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isUrgent = diffDays < 5;
    
    return (
      <span className={cn("text-xs font-bold", isUrgent ? "text-orange-500" : "text-foreground")}>
        {diffDays < 0 ? "Vencido" : `${diffDays} días restantes`}
      </span>
    );
  }

  if (sub.subscriptionStatus === "active" && sub.trialEndsAt) {
    return (
      <span className="text-xs text-muted-foreground">
        {new Date(sub.trialEndsAt).toLocaleDateString("es-PE", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </span>
    );
  }

  return <span className="text-xs text-muted-foreground">—</span>;
}

function ActivationPopover({ id, text = "Activar" }: { id: string, text?: string }) {
  const [selectedPlan, setSelectedPlan] = useState<'mensual' | 'bimestral' | 'trimestral' | 'anual' | null>(null);
  const updateMutation = useUpdateSubscription();

  const plans = [
    { id: 'mensual', label: 'Mensual', price: 'S/.6', duration: '30 días' },
    { id: 'bimestral', label: 'Bimestral', price: 'S/.11', duration: '60 días' },
    { id: 'trimestral', label: 'Trimestral', price: 'S/.15', duration: '90 días' },
    { id: 'anual', label: 'Anual', price: 'S/.49', duration: '365 días ⭐' },
  ] as const;

  const handleActivate = async () => {
    if (!selectedPlan) {
      toast.error("Selecciona un plan");
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, data: { action: 'activate', plan: selectedPlan } });
      toast.success(`Plan ${selectedPlan} activado exitosamente`);
    } catch (e) {
      toast.error("Error al activar");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-wider text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/5">
          <Power className="h-3 w-3 mr-1" />
          {text}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden border-border shadow-none">
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seleccionar Plan</p>
        </div>
        <div className="p-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/10 border-b border-border">
                <th className="px-4 py-2 font-black uppercase tracking-tighter text-muted-foreground/60 w-1/3">Plan</th>
                <th className="px-4 py-2 font-black uppercase tracking-tighter text-muted-foreground/60 w-1/4">Precio</th>
                <th className="px-4 py-2 font-black uppercase tracking-tighter text-muted-foreground/60">Duración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {plans.map((p) => (
                <tr 
                  key={p.id} 
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/20",
                    selectedPlan === p.id ? "bg-primary/5 text-primary" : "text-muted-foreground"
                  )}
                  onClick={() => setSelectedPlan(p.id)}
                >
                  <td className="px-4 py-2.5 font-bold uppercase tracking-tight">{p.label}</td>
                  <td className="px-4 py-2.5 font-black">{p.price}</td>
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">{p.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-muted/10 border-t border-border">
          <Button 
            onClick={handleActivate} 
            className="w-full h-9 text-xs font-bold uppercase tracking-wider" 
            disabled={updateMutation.isPending || !selectedPlan}
          >
            {updateMutation.isPending ? "Activando..." : "Activar Ahora"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MoreActionsMenu({ 
  sub, 
  onViewDetails 
}: { 
  sub: Subscription, 
  onViewDetails: (s: Subscription) => void 
}) {
  const updateMutation = useUpdateSubscription();

  const handleDeactivate = async () => {
    try {
      await updateMutation.mutateAsync({ id: sub.id, data: { action: 'deactivate' } });
      toast.success("Institución desactivada");
    } catch (e) {
      toast.error("Error al desactivar");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1.5 space-y-0.5 shadow-none">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-xs font-bold uppercase tracking-tight h-9"
          onClick={() => onViewDetails(sub)}
        >
          <Eye className="h-3.5 w-3.5 mr-2" />
          Ver detalles
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-xs font-bold uppercase tracking-tight h-9 text-rose-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Ban className="h-3.5 w-3.5 mr-2" />
              Desactivar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="shadow-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-black uppercase tracking-tight">¿Confirmar Desactivación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción desactivará la institución "{sub.name}". Los usuarios perderán acceso al sistema inmediatamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs font-bold uppercase">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeactivate} className="bg-rose-600 hover:bg-rose-700 text-xs font-bold uppercase">
                Confirmar Desactivación
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {sub.subscriptionStatus !== 'trial' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-xs font-bold uppercase tracking-tight h-9 text-amber-600 hover:text-amber-600 hover:bg-amber-50"
              >
                <Plus className="h-3.5 w-3.5 mr-2 rotate-45" />
                Volver a Trial
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="shadow-none">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black uppercase tracking-tight">¿Revertir a Trial?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará el plan actual de "{sub.name}" y se le otorgarán 30 días de prueba gratuita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs font-bold uppercase">Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={async () => {
                    try {
                      await updateMutation.mutateAsync({ id: sub.id, data: { action: 'reset_to_trial' } });
                      toast.success("Institución revertida a trial");
                    } catch (e) {
                      toast.error("Error al revertir");
                    }
                  }} 
                  className="bg-amber-600 hover:bg-amber-700 text-xs font-bold uppercase"
                >
                  Confirmar Reversión
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </PopoverContent>
    </Popover>
  );
}

// --- Main Page Component ---

export default function SuscripcionesPage() {
  const { data: subscriptions = [], isLoading, error } = useSubscriptions();
  const updateMutation = useUpdateSubscription();
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExtendTrial = async (id: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { action: 'extend_trial', days: 30 } });
      toast.success("Trial extendido 30 días");
    } catch (e) {
      toast.error("Error al extender trial");
    }
  };

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground mr-2">Error al cargar suscripciones</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
      <PageHeader title="Suscripciones" subtitle="Gestión administrativa de instituciones y accesos" />

      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className={TH}>Institución</th>
                <th className={TH}>Estado</th>
                <th className={TH}>Vencimiento</th>
                <th className={TH}>Usuarios</th>
                <th className={cn(TH, "text-right")}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 animate-pulse">
                      Sincronizando suscripciones...
                    </span>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <p className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">
                      No hay instituciones registradas
                    </p>
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="group hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-black text-foreground uppercase tracking-tight">{sub.name}</p>
                        <p className="text-[10px] text-muted-foreground/40 uppercase font-medium">{sub.codigoModular}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge sub={sub} />
                    </td>
                    <td className="px-6 py-4">
                      <ExpirationDisplay sub={sub} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-foreground">{sub.userCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {sub.subscriptionStatus === 'trial' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 text-[10px] font-bold uppercase tracking-wider text-amber-600 border-amber-500/20 hover:bg-amber-500/5 transition-all"
                            onClick={() => handleExtendTrial(sub.id)}
                            disabled={updateMutation.isPending}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            +30 Días
                          </Button>
                        )}

                        {(sub.subscriptionStatus === 'trial' || sub.subscriptionStatus === 'inactive' || sub.subscriptionStatus === 'active') && (
                          <ActivationPopover 
                            id={sub.id} 
                            text={
                              sub.subscriptionStatus === 'trial' ? "Actualizar" : 
                              sub.subscriptionStatus === 'active' ? "Cambiar" : "Activar"
                            } 
                          />
                        )}

                        <MoreActionsMenu 
                          sub={sub} 
                          onViewDetails={(s) => {
                            setSelectedSubscription(s);
                            setIsModalOpen(true);
                          }} 
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SubscriptionDetailsModal 
        subscriptionId={selectedSubscription?.id || null}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
