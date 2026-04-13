import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/atoms/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResourceChecklistItem } from './resource-checklist-item';
import { DamageReportForm } from './damage-report-form';
import { SuggestionForm } from './suggestion-form';
import type { Loan, Resource } from '../../types';
import { loanKeys } from '../../hooks/use-loans';
import { useApiClient } from '@/lib/api-client';
import { X, AlertTriangle, User, Calendar, BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReturnLoanModalProps {
    loan: Loan | null;
    open: boolean;
    onClose: () => void;
}

interface ReturnLoanData {
    loanId: string;
    resourcesReceived: string[];
    damageReports: Record<string, any>;
    suggestionReports: Record<string, any>;
    missingResources: any[];
    resourceStatusDecisions: Record<string, 'disponible' | 'mantenimiento' | 'baja'>;
}

export function ReturnLoanModal({ loan, open, onClose }: ReturnLoanModalProps) {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();
    const [resourcesReceived, setResourcesReceived] = useState<Record<string, boolean>>({});
    const [damageReports, setDamageReports] = useState<Record<string, any>>({});
    const [suggestionReports, setSuggestionReports] = useState<Record<string, any>>({});
    const [resourceStatusDecisions, setResourceStatusDecisions] = useState<Record<string, 'disponible' | 'mantenimiento' | 'baja'>>({});
    const [activeTab, setActiveTab] = useState('checklist');
    const [expandedDamageId, setExpandedDamageId] = useState<string | null>(null);
    const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null);

    const returnMutation = useMutation<Loan, Error, ReturnLoanData>({
        mutationFn: async (data: ReturnLoanData) => {
            const { loanId, ...body } = data;
            return apiClient.patch(`/loans/${loanId}/return`, body);
        },
        onSuccess: (updatedLoan) => {
            // Optimistic update
            queryClient.setQueryData(loanKeys.list(), (old: Loan[] | undefined) => {
                if (!old) return old;
                return old.map(l => l.id === updatedLoan.id ? updatedLoan : l);
            });
            // Re-fetch to ensure relations are perfectly synced
            queryClient.invalidateQueries({ queryKey: loanKeys.list() });
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            toast.success('Préstamo devuelto correctamente');
            onClose();
        },
        onError: (error) => {
            toast.error('Error al devolver el préstamo');
            console.error(error);
        }
    });

    const handleResourceReceivedChange = useCallback((resourceId: string, received: boolean) => {
        setResourcesReceived((prev) => ({ ...prev, [resourceId]: received }));
    }, []);

    const handleDamageReportChange = useCallback((resourceId: string, report: any) => {
        setDamageReports(prev => {
            if (report === null) {
                // Remove the key entirely when report is null
                const { [resourceId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [resourceId]: report };
        });
        if (report && (report.commonProblems?.length > 0 || report.otherNotes)) {
            setResourceStatusDecisions(prev => ({ ...prev, [resourceId]: 'mantenimiento' }));
        } else {
            // Remove status decision when report is cleared
            setResourceStatusDecisions(prev => {
                const { [resourceId]: _, ...rest } = prev;
                return rest;
            });
        }
    }, []);

    const handleSuggestionReportChange = useCallback((resourceId: string, report: any) => {
        setSuggestionReports(prev => {
            if (report === null) {
                // Remove the key entirely when report is null
                const { [resourceId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [resourceId]: report };
        });
    }, []);

    const handleConfirmReturn = () => {
        if (!loan) return;

        const missingResources = (loan.resources || [])
            .filter((resource) => !resourcesReceived[resource.id])
            .map((resource) => ({
                resourceId: resource.id,
                resourceName: resource.name,
                notes: 'No devuelto'
            }));

        const returnData: ReturnLoanData = {
            loanId: loan.id,
            resourcesReceived: Object.keys(resourcesReceived).filter((id) => resourcesReceived[id]),
            damageReports,
            suggestionReports,
            missingResources,
            resourceStatusDecisions,
        };

        returnMutation.mutate(returnData);
    };

    if (!loan) return null;

    const receivedCount = Object.values(resourcesReceived).filter(Boolean).length;
    const totalResources = loan.resources?.length || 0;
    const progressPercentage = totalResources > 0 ? (receivedCount / totalResources) * 100 : 0;
    const reportCount = Object.values(damageReports).filter(Boolean).length + Object.values(suggestionReports).filter(Boolean).length;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>            <DialogContent showCloseButton={false} className="sm:max-w-3xl h-[85vh] p-0 flex flex-col overflow-hidden gap-0 sm:rounded-lg border border-border bg-background shadow-none">
                
                {/* Header Navbar */}
                <div className="shrink-0 px-6 py-4 border-b border-border flex items-center justify-between bg-card">
                    <div>
                        <DialogTitle className="text-lg font-bold text-foreground">Recepción de Préstamo</DialogTitle>
                        <DialogDescription className="sr-only">Revisa y devuelve la información del préstamo</DialogDescription>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Cerrar</span>
                    </button>
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-card flex flex-col gap-6">

                    {/* HERO: Borrower Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border border-border bg-muted/20">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0 uppercase font-black text-xl tracking-tight">
                                {loan.staffName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || <User className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-foreground text-lg uppercase truncate tracking-tight">{loan.staffName}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold uppercase tracking-widest mt-1">
                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> {format(new Date(loan.loanDate), "dd MMM yyyy, h:mm a", { locale: es })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Additional Metadata */}
                        <div className="flex sm:flex-col gap-3 sm:gap-1.5 sm:items-end text-xs text-muted-foreground font-semibold uppercase tracking-widest px-2 sm:px-0">
                            {(loan.gradeName || loan.sectionName) && (
                                <span className="flex items-center gap-1.5 justify-end">
                                    <GraduationCap className="w-3.5 h-3.5" />
                                    {[loan.gradeName, loan.sectionName].filter(Boolean).join(' · ')}
                                </span>
                            )}
                            {loan.curricularAreaName && (
                                <span className="flex items-center gap-1.5 justify-end">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    {loan.curricularAreaName}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* TABS CONTENT */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-2">
                        <TabsList className="inline-flex h-auto w-full sm:w-fit items-center justify-start rounded-none bg-transparent p-0 border-b border-border">
                            <TabsTrigger value="checklist" className="flex-1 sm:flex-none inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent hover:text-foreground">
                                Verificación <Badge className="ml-2 h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-primary/20 rounded-sm">{receivedCount}/{totalResources}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="damage" className="flex-1 sm:flex-none inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent hover:text-foreground">Reportar Daños</TabsTrigger>
                            <TabsTrigger value="suggestions" className="flex-1 sm:flex-none inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent hover:text-foreground">Sugerencias</TabsTrigger>
                        </TabsList>

                        <div className="bg-background pt-2">
                            <TabsContent value="checklist" className="m-0 p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-tight text-foreground">Listado de ítems</h3>
                                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-0.5 block">Marca los ítems recibidos</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Progreso total</span>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <Progress value={progressPercentage} className="h-2 w-24" />
                                            <span className="text-xs font-black tabular-nums">{Math.round(progressPercentage)}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2.5 pt-2">
                                    {loan.resources?.map((resource: Resource) => (
                                        <ResourceChecklistItem
                                            key={resource.id}
                                            resource={resource}
                                            isReceived={resourcesReceived[resource.id] || false}
                                            onToggle={handleResourceReceivedChange}
                                        />
                                    )) ?? (
                                        <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                                            No hay recursos asociados
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="damage" className="m-0 p-5 space-y-4">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight text-foreground">Reporte de Daños</h3>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">Registra desperfectos en los equipos.</p>
                                </div>
                                <div className="space-y-3 pt-2">
                                    {loan.resources?.map((resource: Resource) => (
                                        <DamageReportForm
                                            key={resource.id}
                                            resource={resource}
                                            initialData={damageReports[resource.id]}
                                            isExpanded={expandedDamageId === resource.id}
                                            onToggleExpand={() => setExpandedDamageId(prev => prev === resource.id ? null : resource.id)}
                                            onReportChange={(report) => handleDamageReportChange(resource.id, report)}
                                        />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="suggestions" className="m-0 p-5 space-y-4">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight text-foreground">Sugerencias</h3>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">Comentarios de mejora de uso.</p>
                                </div>
                                <div className="space-y-3 pt-2">
                                    {loan.resources?.map((resource: Resource) => (
                                        <SuggestionForm
                                            key={resource.id}
                                            resource={resource}
                                            initialData={suggestionReports[resource.id]}
                                            isExpanded={expandedSuggestionId === resource.id}
                                            onToggleExpand={() => setExpandedSuggestionId(prev => prev === resource.id ? null : resource.id)}
                                            onReportChange={(report) => handleSuggestionReportChange(resource.id, report)}
                                        />
                                    ))}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                </div>

                {/* Footer Bar */}
                <div className="shrink-0 p-5 border-t border-border bg-muted/10 flex items-center justify-between z-10">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Alertas Logísticas</span>
                            <span className="text-sm font-black tabular-nums text-foreground flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {reportCount} reportes anexados</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={returnMutation.isPending}
                            className="font-bold px-6 text-muted-foreground uppercase tracking-wider text-xs"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="jira"
                            onClick={handleConfirmReturn}
                            disabled={receivedCount === 0 || returnMutation.isPending}
                            className="font-black h-10 text-xs px-8 tracking-widest uppercase shadow-none disabled:opacity-50"
                        >
                            {returnMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                    Confirmar Devolución
                                </>
                            )}
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
