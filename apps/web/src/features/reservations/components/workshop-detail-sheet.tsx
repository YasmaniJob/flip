'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/atoms/button';
import {
    useReservationAttendance,
    useAddReservationAttendee,
    useBulkUpdateReservationAttendance,
    useRemoveReservationAttendee,
    useReservationTasks,
    useCreateReservationTask,
    useUpdateReservationTask,
    useCancelReservation,
    useCheckInReservation,
    ReservationAttendance,
    ReservationTask,
} from '../hooks/use-reservations';
import { useStaff } from '@/features/staff/hooks/use-staff';
import { useDebounce } from '@/hooks/use-debounce';
import { Users, ListChecks, Check, Trash2, Search, Plus, Loader2, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface WorkshopDetailSheetProps {
    reservationId: string;
    title?: string;
    onClose?: () => void;
    onReschedule?: () => void;
}

export function WorkshopDetailSheet({ reservationId, title, onClose, onReschedule }: WorkshopDetailSheetProps) {
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
    const cancelMutation = useCancelReservation();
    const checkInMutation = useCheckInReservation();
    
    const handleCancel = async () => {
        try {
            await cancelMutation.mutateAsync(reservationId);
            setConfirmCancelOpen(false);
            onClose?.();
        } catch (error) {}
    };

    const handleFinalize = async () => {
        try {
            await checkInMutation.mutateAsync(reservationId);
            onClose?.();
        } catch (error) {}
    };

    return (
        <div className="flex flex-col h-full bg-background font-sans overflow-hidden">
            {/* Header: Jira Flat Context Marker */}
            <div className="px-8 py-6 bg-muted/10 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <div className="space-y-1">
                        <h2 className="text-[13px] font-black text-foreground uppercase tracking-tight leading-none tabular-nums">
                            {title || 'Detalle del taller'}
                        </h2>
                    </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-sm hover:bg-muted transition-all text-muted-foreground/40 hover:text-foreground active:scale-95 border border-transparent hover:border-border/30"
                  aria-label="Cerrar panel"
                >
                  <X className="h-4 w-4" />
                </button>
            </div>

            {/* Tabs: Jira Flat Underline Style */}
            <Tabs defaultValue="attendance" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-8 bg-background shrink-0">
                  <TabsList className="flex bg-transparent h-12 p-0 rounded-none gap-10 border-b border-border w-full justify-start items-end">
                      <TabsTrigger 
                          value="attendance" 
                          className="h-full rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 data-[state=active]:text-primary transition-all shadow-none mt-0 mb-[-1px]"
                      >
                          <Users className="h-3.5 w-3.5" />
                          Asistencia
                      </TabsTrigger>
                      <TabsTrigger 
                          value="tasks" 
                          className="h-full rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 data-[state=active]:text-primary transition-all shadow-none mt-0 mb-[-1px]"
                      >
                          <ListChecks className="h-3.5 w-3.5" />
                          Acuerdos
                      </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="attendance" className="flex-1 mt-0 overflow-hidden outline-none bg-card/10">
                    <AttendanceTab reservationId={reservationId} />
                </TabsContent>
                <TabsContent value="tasks" className="flex-1 mt-0 overflow-hidden outline-none bg-card/10">
                    <TasksTab reservationId={reservationId} />
                </TabsContent>
            </Tabs>

            {/* Footer Actions: Jira Flat Solid Blocks */}
            <div className="p-8 bg-muted/20 border-t border-border shrink-0">
                <div className="flex gap-4">
                    <Button
                        onClick={handleFinalize}
                        disabled={checkInMutation.isPending}
                        variant="jira"
                        className="flex-1 h-12 font-black text-[10px] uppercase tracking-[0.2em] rounded-sm gap-3 active:scale-[0.98] transition-all"
                    >
                        {checkInMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Check className="h-4 w-4" />
                        )}
                        Finalizar y registrar sesión
                    </Button>
                    
                    <button 
                        onClick={onReschedule}
                        className="h-12 w-12 flex items-center justify-center border border-border bg-background text-muted-foreground hover:text-primary hover:border-primary/40 rounded-sm transition-all active:scale-[0.98]"
                        title="Reprogramar"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    
                    <button 
                        onClick={() => setConfirmCancelOpen(true)}
                        className="h-12 w-12 flex items-center justify-center border border-border bg-background text-destructive/40 hover:text-destructive hover:bg-destructive/5 hover:border-destructive/40 rounded-sm transition-all active:scale-[0.98]"
                        title="Cancelar taller"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Cancel Dialog: Minimalist Box */}
            <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
                <AlertDialogContent className="rounded-sm border border-border shadow-none max-w-md bg-background p-10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[14px] font-black uppercase tracking-tight text-foreground">¿CONFIRMAR CANCELACIÓN?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-relaxed pt-2">
                            ESTA ACCIÓN ELIMINARÁ LA RESERVA PERMANENTEMENTE. LOS DATOS DE ASISTENCIA Y ACUERDOS SE PERDERÁN DE FORMA IRRECUPERABLE.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-4">
                        <AlertDialogCancel className="h-11 rounded-sm border-border text-[9px] font-black uppercase tracking-widest hover:bg-muted">VOLVER</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            className="h-11 rounded-sm bg-destructive text-destructive-foreground text-[9px] font-black uppercase tracking-widest hover:bg-destructive/90 shadow-none"
                            disabled={cancelMutation.isPending}
                        >
                            {cancelMutation.isPending ? 'CANCELANDO...' : 'CONFIRMAR ELIMINACIÓN'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ============================================
// ATTENDANCE TAB
// ============================================

function AttendanceTab({ reservationId }: { reservationId: string }) {
    const { data: attendance, isLoading } = useReservationAttendance(reservationId);
    const addAttendee = useAddReservationAttendee();
    const bulkUpdate = useBulkUpdateReservationAttendance();
    const removeAttendee = useRemoveReservationAttendee();

    const [showSearch, setShowSearch] = useState(false);
    const [staffSearch, setStaffSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const debouncedSearch = useDebounce(staffSearch, 500);
    
    const { staff = [], isLoading: isLoadingStaff } = useStaff({ 
        search: debouncedSearch, 
        limit: 20,
        includeAdmins: true,
        excludeReservationId: reservationId,
        enabled: showSearch 
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-4">Sincronizando...</p>
            </div>
        );
    }

    const records = (attendance as ReservationAttendance[]) || [];

    const handleAddStaffIds = async (ids: string[]) => {
        await addAttendee.mutateAsync({ reservationId, staffIds: ids });
        setShowSearch(false);
        setStaffSearch('');
        setSelectedIds(new Set());
    };

    const handleToggleStatus = (record: ReservationAttendance) => {
        const nextStatus = record.status === 'presente' ? 'ausente' : 'presente';
        bulkUpdate.mutate({ reservationId, updates: [{ attendanceId: record.id, status: nextStatus }] });
    };

    const existingStaffIds = new Set(records.map(r => r.staffId));
    const filteredStaff = staff?.filter(s => !existingStaffIds.has(s.id));

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {/* Stats Header: Minimalist Density */}
            <div className="px-8 py-5 border-b border-border bg-muted/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">
                        Asistentes ({records.length})
                    </span>
                </div>
                <Button
                    onClick={() => setShowSearch(!showSearch)}
                    variant="outline"
                    className="h-10 px-6 gap-3 border-border bg-background hover:bg-muted font-black text-[9px] uppercase tracking-widest transition-all rounded-sm"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Vincular personal
                </Button>
            </div>

            {/* Attendance List: Squared Grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                {records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-30 select-none">
                        <Users className="h-10 w-10 mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Listado de asistentes vacío</p>
                    </div>
                ) : (
                    records.map((record) => (
                        <div
                            key={record.id}
                            className="flex items-center gap-4 p-4 bg-card border border-border group hover:border-primary/20 hover:bg-primary/[0.01] transition-all rounded-sm relative"
                        >
                            <button
                                onClick={() => handleToggleStatus(record)}
                                className={cn(
                                    "h-6 w-6 rounded-sm border-2 flex items-center justify-center transition-all shrink-0",
                                    record.status === 'presente' 
                                        ? "bg-primary border-primary" 
                                        : "border-border bg-background hover:border-primary/40"
                                )}
                            >
                                {record.status === 'presente' && <Check className="h-3.5 w-3.5 text-primary-foreground stroke-[3px]" />}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-[11px] font-black uppercase tracking-tight truncate",
                                  record.status === 'presente' ? "text-foreground" : "text-muted-foreground"
                                )}>
                                  {record.staffName}
                                </p>
                                <p className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-0.5">{record.staffRole}</p>
                            </div>

                            <button 
                                onClick={() => removeAttendee.mutate(record.id)} 
                                className="w-8 h-8 flex items-center justify-center text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 rounded-sm transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-destructive/20"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
            
            {/* Search Overlay: High Density Discovery */}
            {showSearch && (
                <div className="absolute inset-0 bg-background z-30 p-10 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-10 shrink-0">
                      <div className="space-y-1">
                          <h3 className="text-[14px] font-black uppercase tracking-tight text-foreground">Discovery Mode</h3>
                          <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.3em]">Buscador universal de personal docente</p>
                      </div>
                      <button 
                          onClick={() => {
                              setShowSearch(false);
                              setSelectedIds(new Set());
                          }} 
                          className="w-10 h-10 flex items-center justify-center rounded-sm text-muted-foreground hover:bg-muted border border-border transition-colors"
                      >
                          <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-6 min-h-0">
                        <div className="relative shrink-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <input 
                                className="w-full h-12 bg-card border border-border rounded-sm pl-12 pr-6 text-[11px] font-black uppercase tracking-widest focus:border-primary focus:ring-0 outline-none placeholder:text-muted-foreground/20 transition-all shadow-none"
                                placeholder="NOMBRE DEL DOCENTE O DNI..."
                                value={staffSearch}
                                onChange={(e) => setStaffSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                            {isLoadingStaff ? (
                                <div className="py-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground/20" />
                                </div>
                            ) : filteredStaff?.length === 0 ? (
                                <div className="py-24 text-center flex flex-col items-center justify-center opacity-30 select-none">
                                    <Search className="h-8 w-8 mb-4 lg:scale-150 mb-10" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sin coincidencias registradas</p>
                                </div>
                            ) : (
                                filteredStaff?.map(p => {
                                    const isSelected = selectedIds.has(p.id);
                                    return (
                                        <button 
                                            key={p.id} 
                                            onClick={() => {
                                                const next = new Set(selectedIds);
                                                if (next.has(p.id)) next.delete(p.id);
                                                else next.add(p.id);
                                                setSelectedIds(next);
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-sm border transition-all text-left",
                                                isSelected 
                                                  ? "bg-primary/[0.03] border-primary/40" 
                                                  : "bg-card border-border hover:border-primary/20 hover:bg-primary/[0.01]"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-sm flex items-center justify-center text-[11px] font-black transition-all border shrink-0",
                                                    isSelected 
                                                      ? "bg-primary text-primary-foreground border-primary" 
                                                      : "bg-muted/50 text-muted-foreground border-border"
                                                )}>
                                                    {p.name[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black uppercase tracking-tight text-foreground truncate">{p.name}</p>
                                                    <p className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-0.5">{p.role}</p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "h-5 w-5 rounded-sm border-2 flex items-center justify-center transition-all",
                                                isSelected ? "bg-primary border-primary" : "border-border"
                                            )}>
                                                {isSelected && <Check className="h-3 w-3 text-primary-foreground stroke-[3px]" />}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {selectedIds.size > 0 && (
                            <Button 
                                onClick={() => handleAddStaffIds(Array.from(selectedIds))}
                                variant="jira"
                                className="w-full h-12 font-black text-[10px] uppercase tracking-[0.2em] rounded-sm shrink-0"
                            >
                                Vincular {selectedIds.size} {selectedIds.size === 1 ? 'docente' : 'docentes'} seleccionados
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// TASKS TAB
// ============================================

function TasksTab({ reservationId }: { reservationId: string }) {
    const { data: tasks, isLoading } = useReservationTasks(reservationId);
    const createTask = useCreateReservationTask();
    const updateTask = useUpdateReservationTask();
    
    const [newTask, setNewTask] = useState('');

    const handleCreateTask = async () => {
        if (!newTask.trim()) return;
        await createTask.mutateAsync({ reservationId, task: { description: newTask } });
        setNewTask('');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
            </div>
        );
    }

    const taskList = (tasks as ReservationTask[]) || [];

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden font-sans">
            {/* Input Header: High Density Form */}
            <div className="px-8 py-5 border-b border-border bg-muted/5 space-y-4">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Compromisos AIP</span>
                    <div className="flex-1 h-px bg-border/50" />
                </div>
                <div className="flex gap-2">
                    <input
                        className="flex-1 h-11 bg-card border border-border rounded-sm px-5 text-[11px] font-black uppercase tracking-widest focus:border-primary focus:ring-0 outline-none placeholder:text-muted-foreground/20 transition-all shadow-none"
                        placeholder="REDACTA UN ACUERDO TÉCNICO..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateTask()}
                    />
                    <button
                        onClick={handleCreateTask}
                        disabled={!newTask.trim() || createTask.isPending}
                        className="h-11 px-6 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center font-black text-[9px] uppercase tracking-[0.2em] shadow-none active:scale-95"
                    >
                        {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vincular"}
                    </button>
                    
                    {newTask && (
                      <button
                          onClick={() => setNewTask('')}
                          className="h-11 w-11 rounded-sm border border-border bg-card text-muted-foreground hover:bg-muted transition-all flex items-center justify-center active:scale-95"
                      >
                          <X className="h-4 w-4" />
                      </button>
                    )}
                </div>
            </div>

            {/* Tasks List: Actionable Grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                {taskList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-30 select-none">
                        <ListChecks className="h-10 w-10 mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Sin acuerdos registrados aún</p>
                    </div>
                ) : (
                    taskList.map((task) => (
                        <div
                            key={task.id}
                            onClick={() => updateTask.mutate({ taskId: task.id, data: { status: task.status === 'completed' ? 'pending' : 'completed' } })}
                            className={cn(
                                "flex items-start gap-4 p-4 rounded-sm border cursor-pointer transition-all",
                                task.status === 'completed' 
                                    ? "bg-muted/30 border-border opacity-60" 
                                    : "bg-card border-border hover:border-primary/40 hover:bg-primary/[0.01]"
                            )}
                        >
                            <div className={cn(
                                "h-5 w-5 mt-0.5 rounded-sm border-2 flex items-center justify-center transition-all shrink-0",
                                task.status === 'completed' 
                                    ? "bg-primary border-primary" 
                                    : "border-border bg-background"
                            )}>
                                {task.status === 'completed' && <Check className="h-3.5 w-3.5 text-primary-foreground stroke-[3px]" />}
                            </div>
                            <p className={cn(
                                "text-[11px] font-black uppercase tracking-tight leading-relaxed",
                                task.status === 'completed' 
                                    ? "line-through text-muted-foreground/50" 
                                    : "text-foreground"
                            )}>
                                {task.description}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

