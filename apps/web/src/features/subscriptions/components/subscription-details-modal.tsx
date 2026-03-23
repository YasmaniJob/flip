import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSubscriptionDetail, type Subscription } from "@/hooks/use-subscriptions";
import { Badge } from "@/components/ui/badge";
import { History, Users, Building2, Calendar, Shield, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function SubscriptionDetailsModal({
  subscriptionId,
  open,
  onOpenChange
}: {
  subscriptionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: sub, isLoading, error } = useSubscriptionDetail(subscriptionId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-none bg-background rounded-xl">
        <DialogHeader className="p-0 border-b border-border">
          <div className="flex items-center justify-between p-6 bg-muted/20">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none text-foreground flex items-center gap-2">
                  {isLoading ? "Cargando..." : sub?.name}
                </DialogTitle>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 px-0.5">
                   <Shield className="h-3 w-3" />
                   Portal Administrativo • {sub?.codigoModular || "---"}
                </p>
              </div>
            </div>
            
            {sub && (
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                sub.subscriptionStatus === 'active' 
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              )}>
                {sub.subscriptionStatus}
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[85vh]">
          {isLoading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
               <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
                 Sincronizando información...
               </p>
            </div>
          ) : error ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4 text-center">
               <AlertCircle className="h-10 w-10 text-rose-500" />
               <p className="text-xs font-bold text-muted-foreground uppercase">Ocurrió un error al cargar los datos</p>
            </div>
          ) : sub ? (
            <div className="p-6 space-y-10">
              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Usuarios", value: sub.userCount, icon: Users, color: "text-blue-500" },
                  { label: "Plan Actual", value: sub.subscriptionPlan || "Bonificado", icon: Shield, color: "text-emerald-500" },
                  { label: "Expira en", value: sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString() : "Indefinido", icon: Clock, color: "text-amber-500" },
                ].map((stat, i) => (
                  <div key={i} className="bg-muted/10 border border-border/50 rounded-xl p-4 space-y-1.5 group hover:bg-muted/20 transition-all cursor-default">
                    <div className="flex items-center justify-between">
                      <stat.icon className={cn("h-4 w-4", stat.color)} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{stat.label}</span>
                    </div>
                    <p className="text-sm font-black text-foreground uppercase tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-8">
                {/* User List - Left Column */}
                <section className="col-span-3 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground flex items-center gap-2">
                       <Users className="h-4 w-4 text-primary" />
                       Directorio de Usuarios
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {sub.institutionalUsers?.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/5 transition-all">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-lg border border-border">
                            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black uppercase">
                              {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-[11px] font-bold text-foreground leading-none">{u.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[8px] font-black uppercase py-0 px-1.5 h-4 tracking-tighter border-primary/20 bg-primary/5 text-primary">
                                {u.role}
                              </Badge>
                              {u.lastAccess && (
                                <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  Visto {new Date(u.lastAccess).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="py-10 text-center border-2 border-dashed border-border rounded-xl">
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">Sin usuarios asociados</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* History Timeline - Right Column */}
                <section className="col-span-2 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground flex items-center gap-2">
                       <History className="h-4 w-4 text-primary" />
                       Cronología
                    </h3>
                  </div>

                  <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted-foreground/10">
                    {sub.subscriptionHistory?.map((h, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[23px] top-1 h-[10px] w-[10px] rounded-full border-2 border-primary bg-background z-10" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-tight text-foreground">{h.event.replace(/_/g, ' ')}</p>
                          <div className="flex items-center gap-3">
                             <p className="text-[9px] font-bold text-muted-foreground/60 flex items-center gap-1 capitalize">
                                <Calendar className="h-2.5 w-2.5" />
                                {new Date(h.date).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })}
                             </p>
                             {h.plan && <Badge className="text-[7px] h-3 bg-muted text-muted-foreground uppercase font-black">{h.plan}</Badge>}
                          </div>
                          {h.details && <p className="text-[9px] text-muted-foreground italic leading-relaxed mt-1">"{h.details}"</p>}
                        </div>
                      </div>
                    )) || (
                      <div className="py-10 text-center opacity-30">
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic leading-relaxed">Sin eventos registrados en la cronología</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
