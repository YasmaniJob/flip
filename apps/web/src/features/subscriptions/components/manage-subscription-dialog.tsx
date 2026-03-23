"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateSubscription, type Subscription } from "@/hooks/use-subscriptions";
import { toast } from "sonner";
import { Calendar, Clock, XCircle } from "lucide-react";

interface ManageSubscriptionDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageSubscriptionDialog({
  subscription,
  open,
  onOpenChange,
}: ManageSubscriptionDialogProps) {
  const [days, setDays] = useState("30");
  const [expiresAt, setExpiresAt] = useState("");
  const updateMutation = useUpdateSubscription();

  if (!subscription) return null;

  const handleExtendTrial = async () => {
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1) {
      toast.error("Ingresa un número válido de días");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: subscription.id,
        data: { action: "extend_trial", days: daysNum },
      });
      toast.success(`Trial extendido por ${daysNum} días`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al extender trial");
    }
  };

  const handleActivate = async () => {
    if (!expiresAt) {
      toast.error("Selecciona una fecha de vencimiento");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: subscription.id,
        data: { action: "activate", expiresAt },
      });
      toast.success("Suscripción activada");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al activar suscripción");
    }
  };

  const handleDeactivate = async () => {
    if (!confirm(`¿Desactivar la institución "${subscription.name}"?`)) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: subscription.id,
        data: { action: "deactivate" },
      });
      toast.success("Institución desactivada");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al desactivar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-black uppercase tracking-tight">
            Gestionar Suscripción
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Institution Info */}
          <div className="p-4 border border-border bg-muted/20">
            <p className="text-sm font-black uppercase tracking-tight text-foreground">
              {subscription.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Código Modular: {subscription.codigoModular || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">
              Usuarios activos: {subscription.userCount}
            </p>
          </div>

          <Tabs defaultValue="extend" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="extend" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Extender Trial
              </TabsTrigger>
              <TabsTrigger value="activate" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Activar
              </TabsTrigger>
              <TabsTrigger value="deactivate" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                Desactivar
              </TabsTrigger>
            </TabsList>

            {/* Extend Trial */}
            <TabsContent value="extend" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="days" className="text-xs font-bold uppercase">
                  Días a extender
                </Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button
                onClick={handleExtendTrial}
                disabled={updateMutation.isPending}
                className="w-full"
              >
                {updateMutation.isPending ? "Extendiendo..." : "Extender Trial"}
              </Button>
            </TabsContent>

            {/* Activate */}
            <TabsContent value="activate" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="expiresAt" className="text-xs font-bold uppercase">
                  Fecha de vencimiento
                </Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button
                onClick={handleActivate}
                disabled={updateMutation.isPending}
                className="w-full"
              >
                {updateMutation.isPending ? "Activando..." : "Activar Suscripción"}
              </Button>
            </TabsContent>

            {/* Deactivate */}
            <TabsContent value="deactivate" className="space-y-4 mt-4">
              <p className="text-xs text-muted-foreground">
                Esta acción desactivará la institución y los usuarios no podrán acceder al
                sistema.
              </p>
              <Button
                onClick={handleDeactivate}
                disabled={updateMutation.isPending}
                variant="destructive"
                className="w-full"
              >
                {updateMutation.isPending ? "Desactivando..." : "Desactivar Institución"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
