"use client";

import { ReservationSlot } from "@/features/reservations/api/reservations.api";
import { X, User, BookOpen, Users as UsersIcon, Calendar, Check, RefreshCw, Trash2, Search, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { 
    useMarkAttendance, 
    useReservationAttendance, 
    useAddReservationAttendee, 
    useRemoveReservationAttendee,
    useReservationTasks,
    useUpdateReservationTask,
    useCreateReservationTask,
    ReservationAttendance,
    ReservationTask
} from "@/features/reservations/hooks/use-reservations";
import { useStaff } from "@/features/staff/hooks/use-staff";
import { useDebounce } from "@/hooks/use-debounce";

interface MobileReservationSheetProps {
  slot: ReservationSlot | null;
  open: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
  canManage?: boolean;
}

export function MobileReservationSheet({ 
  slot, 
  open, 
  onClose,
  onCancel,
  onReschedule,
  canManage = false,
}: MobileReservationSheetProps) {
  // Mobile UI States
  const [showSearch, setShowSearch] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const debouncedSearch = useDebounce(staffSearch, 500);
  
  const attendanceMutation = useMarkAttendance();
  
  // Workshop specific queries
  const isWorkshop = slot?.type === 'workshop';
  const reservationId = slot?.reservationMainId || "";

  const { data: attendance, isLoading: isLoadingAttendance } = useReservationAttendance(reservationId, {
      enabled: isWorkshop && open
  });
  
  const { data: tasks, isLoading: isLoadingTasks } = useReservationTasks(reservationId, {
      enabled: isWorkshop && open
  });

  const { staff = [], isLoading: isLoadingStaff } = useStaff({ 
      search: debouncedSearch, 
      limit: 20,
      includeAdmins: true,
      excludeReservationId: reservationId,
      enabled: showSearch && isWorkshop
  });

  const addAttendee = useAddReservationAttendee();
  const removeAttendee = useRemoveReservationAttendee();
  const updateTask = useUpdateReservationTask();
  const createTask = useCreateReservationTask();

  if (!slot) return null;

  const handleMarkAttendance = async () => {
    try {
      await attendanceMutation.mutateAsync({
        slotId: slot.id,
        attended: !slot.attended,
      });
      onClose();
    } catch (error) {}
  };

  const attendanceCount = (attendance as ReservationAttendance[])?.length || 0;
  const completedTasks = (tasks as ReservationTask[])?.filter(t => t.status === 'completed').length || 0;
  const totalTasks = (tasks as ReservationTask[])?.length || 0;

  return (
    <>
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 bg-background z-[70] transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) border-t border-border overflow-hidden flex flex-col shadow-none",
          isWorkshop ? "top-0 h-full" : "top-[25vh] h-[75vh] rounded-t-sm", 
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Header: Jira Flat Header Block */}
        <div className="px-6 py-6 border-b border-border bg-muted/10 sticky top-0 z-10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={cn("w-1.5 h-8 rounded-full shrink-0", isWorkshop ? "bg-primary" : "bg-blue-400")} />
                <div className="min-w-0 pr-4">
                    <span className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em] mb-1 block opacity-60",
                        isWorkshop ? "text-primary" : "text-blue-500"
                    )}>
                        {isWorkshop ? 'Gestión técnica pedagógica — AIP' : 'Programación regular'}
                    </span>
                    <h2 className="text-[14px] font-black text-foreground uppercase tracking-tight truncate leading-none">
                        {slot.title || slot.pedagogicalHour.name}
                    </h2>
                </div>
            </div>
            <button
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center bg-background border border-border text-muted-foreground rounded-sm hover:bg-muted active:scale-95 transition-all"
            >
                <X className="h-4 w-4" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-44 px-6 pt-8 space-y-10 custom-scrollbar">
          {isWorkshop ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Dashboard Stats GRID */}
                  <div className="grid grid-cols-2 gap-px bg-border border border-border rounded-sm overflow-hidden mb-10 shrink-0">
                      <div className="p-5 bg-card">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Participación</p>
                          <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter">{attendanceCount}</span>
                              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">Vinculados</span>
                          </div>
                      </div>
                      <div className="p-5 bg-card">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Acuerdos AIP</p>
                          <div className="flex items-baseline gap-2">
                              <span className={cn(
                                  "text-2xl font-black tabular-nums tracking-tighter",
                                  completedTasks === totalTasks && totalTasks > 0 ? "text-primary" : "text-amber-500"
                              )}>{completedTasks}</span>
                              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">de {totalTasks}</span>
                          </div>
                      </div>
                  </div>

                  <section className="space-y-4">
                      <h3 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Facilitador de sesión</h3>
                      <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-sm relative group overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20" />
                          <div className="h-10 w-10 bg-muted/50 border border-border rounded-sm flex items-center justify-center text-[11px] font-black text-foreground shrink-0">
                              {slot.staff?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-black text-foreground uppercase tracking-tight truncate">{slot.staff?.name || 'Error de registro'}</p>
                              <p className="text-[8px] text-muted-foreground/50 font-bold uppercase tracking-widest mt-1">Nivel AIP / PIP</p>
                          </div>
                      </div>
                  </section>

                  {/* Attendance Section */}
                  <section className="mt-12 space-y-6">
                      <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Listado de asistencia</h3>
                          <button 
                              onClick={() => setShowSearch(!showSearch)}
                              className={cn(
                                  "h-8 px-4 border text-[9px] font-black uppercase tracking-widest transition-all rounded-sm active:scale-95",
                                  showSearch 
                                    ? "bg-muted text-foreground border-border" 
                                    : "bg-primary text-primary-foreground border-primary"
                              )}
                          >
                              {showSearch ? 'Cancelar search' : 'Agregar participantes'}
                          </button>
                      </div>

                      {showSearch && (
                          <div className="p-6 bg-muted/10 border border-primary/20 rounded-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                             <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <input 
                                    type="text"
                                    placeholder="NOMBRE O DOCUMENTO..."
                                    value={staffSearch}
                                    onChange={(e) => setStaffSearch(e.target.value)}
                                    className="w-full bg-background border border-border rounded-sm h-11 pl-11 pr-4 text-[11px] font-black uppercase tracking-widest focus:ring-0 focus:border-primary placeholder:text-muted-foreground/20 transition-all text-foreground"
                                />
                             </div>
                             
                             <div className="max-h-[320px] overflow-y-auto space-y-1 border border-border bg-background rounded-sm custom-scrollbar p-1">
                                {isLoadingStaff ? (
                                    <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground/20" /></div>
                                ) : staff.length > 0 ? (
                                    staff.map(person => {
                                        const isSelected = selectedIds.has(person.id);
                                        return (
                                            <div 
                                                key={person.id}
                                                onClick={() => {
                                                    const next = new Set(selectedIds);
                                                    if (next.has(person.id)) next.delete(person.id);
                                                    else next.add(person.id);
                                                    setSelectedIds(next);
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between p-4 cursor-pointer transition-all rounded-sm border mb-1",
                                                    isSelected 
                                                      ? "bg-primary/[0.03] border-primary/40" 
                                                      : "bg-background border-transparent hover:border-border"
                                                )}
                                            >
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <p className={cn("text-[11px] font-black uppercase tracking-tight truncate", isSelected ? "text-primary" : "text-foreground")}>{person.name}</p>
                                                    <p className="text-[8px] text-muted-foreground/50 font-bold uppercase tracking-widest mt-0.5">{person.role || 'Docente de aula'}</p>
                                                </div>
                                                <div className={cn(
                                                    "h-5 w-5 rounded-sm border-2 flex items-center justify-center transition-all",
                                                    isSelected ? "bg-primary border-primary" : "border-border"
                                                )}>
                                                    {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground stroke-[4px]" />}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="py-12 text-center text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Sin coincidencias</p>
                                )}
                             </div>

                             {selectedIds.size > 0 && (
                                <button 
                                    onClick={async () => {
                                        await addAttendee.mutateAsync({ reservationId, staffIds: Array.from(selectedIds) });
                                        setSelectedIds(new Set());
                                        setShowSearch(false);
                                    }}
                                    disabled={addAttendee.isPending}
                                    className="w-full h-12 bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-[0.2em] rounded-sm active:bg-primary/90 transition-all border-none flex items-center justify-center"
                                >
                                    {addAttendee.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Vincular ${selectedIds.size} seleccionados`}
                                </button>
                             )}
                          </div>
                      )}

                      <div className="space-y-px bg-border border border-border rounded-sm overflow-hidden bg-muted/5">
                          {isLoadingAttendance ? (
                              Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-card/50 animate-pulse border-b border-border" />)
                          ) : attendanceCount > 0 ? (
                              (attendance as ReservationAttendance[]).map((record) => (
                                <div key={record.id} className="flex items-center justify-between p-4 bg-card group border-b border-border last:border-0">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="h-8 w-8 text-[10px] font-black flex items-center justify-center bg-muted/50 text-muted-foreground/60 border border-border rounded-sm shrink-0">
                                            {record.staffName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black text-foreground uppercase tracking-tight truncate">{record.staffName}</p>
                                            <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-0.5">{record.staffRole}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeAttendee.mutate(record.id)}
                                        className="w-10 h-10 flex items-center justify-center text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5 rounded-sm transition-all border border-transparent active:border-destructive/20"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                              ))
                          ) : (
                            <div className="py-20 flex flex-col items-center justify-center gap-4 select-none opacity-20">
                                <UsersIcon className="h-8 w-8" />
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-center">Listado de asistentes vacío</p>
                            </div>
                          )}
                      </div>
                  </section>

                  {/* Tasks Section */}
                  <section className="mt-12 space-y-6">
                      <div className="flex items-center justify-between border-b border-border pb-4">
                          <h3 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Compromisos y acuerdos</h3>
                          <BookOpen className="h-4 w-4 text-muted-foreground/20" />
                      </div>

                      <div className="flex gap-2 group">
                          <input 
                            type="text"
                            placeholder="REDACTA UN NUEVO ACUERDO..."
                            value={newTaskDesc}
                            onChange={(e) => setNewTaskDesc(e.target.value)}
                            className="flex-1 bg-card border border-border rounded-sm h-11 px-4 text-[10px] font-black uppercase tracking-widest focus:ring-0 focus:border-primary placeholder:text-muted-foreground/20 transition-all text-foreground"
                          />
                          <button 
                            onClick={() => {
                                if (newTaskDesc.trim()) {
                                    createTask.mutate({ reservationId, task: { description: newTaskDesc } });
                                    setNewTaskDesc('');
                                }
                            }}
                            disabled={!newTaskDesc.trim() || createTask.isPending}
                            className="bg-primary text-primary-foreground h-11 w-11 flex items-center justify-center rounded-sm active:bg-primary/90 transition-all disabled:opacity-50 border-none shrink-0"
                          >
                            {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 stroke-[3]" />}
                          </button>
                      </div>

                      <div className="space-y-1">
                        {isLoadingTasks ? (
                             Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-sm border border-border" />)
                        ) : totalTasks > 0 ? (
                            (tasks as ReservationTask[]).map((task) => (
                                <div 
                                    key={task.id}
                                    onClick={() => updateTask.mutate({ taskId: task.id, data: { status: task.status === 'completed' ? 'pending' : 'completed' } })}
                                    className={cn(
                                        "flex items-start gap-4 p-5 rounded-sm border transition-all cursor-pointer",
                                        task.status === 'completed' 
                                          ? "bg-muted/10 border-border opacity-60" 
                                          : "bg-card border-border hover:border-primary/30"
                                    )}
                                >
                                    <div className={cn(
                                        "h-5 w-5 mt-0.5 rounded-sm border-2 flex items-center justify-center transition-all shrink-0",
                                        task.status === 'completed' ? "bg-primary border-primary" : "bg-background border-border"
                                    )}>
                                        {task.status === 'completed' && <Check className="h-3 w-3 text-primary-foreground stroke-[4px]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-[11px] font-black uppercase tracking-tight leading-relaxed",
                                            task.status === 'completed' ? "line-through text-muted-foreground/50" : "text-foreground"
                                        )}>
                                            {task.description}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 bg-muted/5 border border-dashed border-border rounded-sm flex flex-col items-center justify-center gap-4 opacity-20 select-none">
                                <Check className="h-8 w-8" />
                                <p className="text-[9px] font-black uppercase tracking-[0.4em]">Sin acuerdos registrados</p>
                            </div>
                          )}
                      </div>
                  </section>
              </div>
          ) : (
              /* REGULAR CLASS VIEW: Simplified Jira Flat Layout */
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-6">
                  <div className="bg-card border border-border rounded-sm divide-y divide-border">
                    {slot.staff && (
                    <div className="flex items-center gap-5 p-6">
                        <User className="h-5 w-5 text-muted-foreground/30" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-1">Responsable</p>
                            <p className="text-sm font-black text-foreground uppercase tracking-tight truncate">{slot.staff.name}</p>
                        </div>
                    </div>
                    )}
                    
                    <div className="flex items-center gap-5 p-6">
                        <Calendar className="h-5 w-5 text-muted-foreground/30" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-1">Fecha programada</p>
                            <p className="text-sm font-black text-foreground uppercase tracking-tight">
                                {new Date(slot.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                    </div>
                  </div>
              </div>
          )}

          {/* Institutional Control Panel */}
          {canManage && (
            <section className="mt-16 pt-10 border-t border-border space-y-6 pb-12">
                <div className="flex items-center gap-3 px-1">
                    <div className="w-1 h-3 bg-destructive/40 rounded-full" />
                    <h3 className="text-[10px] font-black text-destructive/40 uppercase tracking-[0.3em]">Institutional Admin Panel</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                    <button 
                        onClick={onReschedule}
                        className="flex items-center justify-between p-5 bg-background border border-border rounded-sm hover:border-primary/20 hover:bg-primary/[0.01] transition-all group active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-4">
                            <RefreshCw className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            <span className="text-[11px] font-black text-foreground uppercase tracking-tight">Reprogramar reservación</span>
                        </div>
                        <X className="h-4 w-4 text-muted-foreground/20 rotate-45" />
                    </button>

                    <button 
                        onClick={onCancel}
                        className="flex items-center justify-between p-5 bg-background border border-destructive/20 rounded-sm hover:bg-destructive/[0.02] hover:border-destructive/40 transition-all group active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-4">
                            <Trash2 className="h-4 w-4 text-destructive/30 group-hover:text-destructive transition-colors" />
                            <span className="text-[11px] font-black text-destructive/70 uppercase tracking-tight">Cancelar definitivamente</span>
                        </div>
                    </button>
                </div>

                <p className="text-[8px] text-center font-bold text-muted-foreground/30 px-10 leading-relaxed uppercase tracking-widest">
                    Las acciones administrativas son permanentes y afectan la disponibilidad del aula vinculada.
                </p>
            </section>
          )}
        </div>

        {/* Floating Action Button: Jira Global Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-border z-[80] safe-area-bottom">
            <div className="flex gap-4">
                <button
                    onClick={handleMarkAttendance}
                    disabled={attendanceMutation.isPending}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-3 h-14 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] transition-all border shrink-0 active:scale-95",
                        slot.attended 
                          ? "bg-muted text-muted-foreground/40 border-border" 
                          : "bg-primary text-primary-foreground border-primary"
                    )}
                >
                    {attendanceMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : slot.attended ? (
                        <>
                          <Check className="h-4 w-4 stroke-[4px]" />
                          Sesión concluida
                        </>
                    ) : (
                        <>
                          <Check className="h-4 w-4 stroke-[4px]" />
                          {isWorkshop ? 'Finalizar sesión' : 'Registrar asistencia'}
                        </>
                    )}
                </button>
                
                {onReschedule && (
                    <button 
                        onClick={onReschedule}
                        className="h-14 w-14 bg-background text-muted-foreground/60 rounded-sm border border-border flex items-center justify-center active:bg-muted active:scale-95 transition-all"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
      </div>
    </>
  );
}

