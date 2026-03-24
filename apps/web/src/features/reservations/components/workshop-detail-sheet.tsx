'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    useReservationAttendance,
    useAddReservationAttendee,
    useBulkUpdateReservationAttendance,
    useRemoveReservationAttendee,
    useReservationTasks,
    useCreateReservationTask,
    useUpdateReservationTask,
    useDeleteReservationTask,
} from '../hooks/use-reservations';
import { useStaff } from '@/features/staff/hooks/use-staff';
import { useDebounce } from '@/hooks/use-debounce';
import {
    CheckCircle2, Circle, Trash2, Plus, User, Loader2,
    Search, X, Users, ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkshopDetailSheetProps {
    reservationId: string;
    title?: string;
}

export function WorkshopDetailSheet({ reservationId, title }: WorkshopDetailSheetProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 pb-4 border-b bg-card">
                <h2 className="text-xl font-black text-foreground">{title || 'Detalle del Taller'}</h2>
                <p className="text-xs text-muted-foreground mt-1">Gestiona la asistencia y acuerdos de este taller</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="attendance" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 bg-muted/30 rounded-none h-12 p-0 border-b">
                    <TabsTrigger value="attendance" className="h-full rounded-none data-[state=active]:bg-card data-[state=active]:shadow-none gap-2 font-bold">
                        <Users className="h-4 w-4" />
                        Asistencia
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="h-full rounded-none data-[state=active]:bg-card data-[state=active]:shadow-none gap-2 font-bold">
                        <ListChecks className="h-4 w-4" />
                        Acuerdos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="attendance" className="flex-1 mt-0 overflow-hidden">
                    <AttendanceTab reservationId={reservationId} />
                </TabsContent>
                <TabsContent value="tasks" className="flex-1 mt-0 overflow-hidden">
                    <TasksTab reservationId={reservationId} />
                </TabsContent>
            </Tabs>
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
    const debouncedSearch = useDebounce(staffSearch, 500);
    const { staff, isLoading: isLoadingStaff } = useStaff({ search: debouncedSearch, limit: 20 });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">Cargando asistencia...</p>
            </div>
        );
    }

    const records = attendance || [];
    const presentCount = records.filter(r => r.status === 'presente').length;

    const handleAddStaff = async (staffId: string) => {
        await addAttendee.mutateAsync({ reservationId, staffId });
        setShowSearch(false);
        setStaffSearch('');
    };

    const handleToggleStatus = (record: typeof records[0]) => {
        const nextStatus = record.status === 'presente' ? 'ausente' : 'presente';
        bulkUpdate.mutate({ reservationId, updates: [{ attendanceId: record.id, status: nextStatus }] });
    };

    // Filter out already-added staff
    const existingStaffIds = new Set(records.map(r => r.staffId));
    const filteredStaff = staff?.filter(s => !existingStaffIds.has(s.id));

    return (
        <div className="flex flex-col h-full bg-muted/10">
            {/* Stats Header */}
            <div className="p-6 bg-card border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            {presentCount} Presentes
                        </span>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <span className="text-sm font-bold text-muted-foreground">
                            {records.length} Total
                        </span>
                    </div>
                    <Button
                        onClick={() => setShowSearch(!showSearch)}
                        size="sm"
                        className="rounded-full gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Agregar
                    </Button>
                </div>
            </div>

            {/* Search Panel */}
            {showSearch && (
                <div className="p-4 bg-card border-b animate-in slide-in-from-top-2">
                    <div className="bg-muted/30 p-2 rounded-2xl">
                        <div className="flex items-center px-3 pt-1 pb-1 mb-2 gap-2">
                            <Search className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                            <Input
                                placeholder="Buscar personal..."
                                value={staffSearch}
                                onChange={(e) => setStaffSearch(e.target.value)}
                                className="flex-1 h-auto py-1.5 border-none focus-visible:ring-0 px-0 text-sm bg-transparent placeholder:text-muted-foreground/70 font-medium text-foreground"
                                autoFocus
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setShowSearch(false); setStaffSearch(''); }}
                                className="h-7 px-2 text-xs text-muted-foreground/70 hover:text-foreground rounded-full"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="max-h-40 overflow-y-auto px-1 custom-scrollbar">
                            {isLoadingStaff ? (
                                <div className="py-6 text-center text-xs text-muted-foreground">Cargando...</div>
                            ) : filteredStaff?.length === 0 ? (
                                <div className="py-6 text-center text-xs text-muted-foreground">Sin resultados</div>
                            ) : (
                                <div className="space-y-0.5 pb-1">
                                    {filteredStaff?.map((person) => (
                                        <div
                                            key={person.id}
                                            onClick={() => handleAddStaff(person.id)}
                                            className="cursor-pointer py-2 px-3 rounded-xl hover:bg-primary/10 flex items-center gap-2 transition-colors"
                                        >
                                            <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                                            <span className="text-sm font-medium text-foreground">{person.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance List */}
            <div className="flex-1 overflow-y-auto p-4">
                {records.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                        <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-muted-foreground/70 font-medium">No hay participantes registrados</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Agrega participantes con el botón &quot;Agregar&quot;</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {records.map((record) => (
                            <div
                                key={record.id}
                                className="group flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:border-border/80 transition-all"
                            >
                                <button
                                    onClick={() => handleToggleStatus(record)}
                                    className={cn(
                                        "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                                        record.status === 'presente'
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : record.status === 'tardanza'
                                                ? "bg-amber-500 border-amber-500 text-white"
                                                : "border-border text-transparent hover:border-emerald-400"
                                    )}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{record.staffName || 'Sin nombre'}</p>
                                    {record.staffRole && (
                                        <p className="text-xs text-muted-foreground/70">{record.staffRole}</p>
                                    )}
                                </div>

                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        "text-[10px] font-bold uppercase rounded-lg",
                                        record.status === 'presente' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                                            record.status === 'tardanza' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                                "bg-muted/30 text-muted-foreground"
                                    )}
                                >
                                    {record.status}
                                </Badge>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeAttendee.mutate(record.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground/70 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
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
    const deleteTask = useDeleteReservationTask();

    const [isCreating, setIsCreating] = useState(false);
    const [newDescription, setNewDescription] = useState('');

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">Cargando acuerdos...</p>
            </div>
        );
    }

    const allTasks = tasks || [];
    const pendingTasks = allTasks.filter(t => t.status === 'pending');
    const completedTasks = allTasks.filter(t => t.status === 'completed');

    const handleCreate = async () => {
        if (!newDescription.trim()) return;
        await createTask.mutateAsync({
            reservationId,
            task: { description: newDescription.trim() },
        });
        setNewDescription('');
        setIsCreating(false);
    };

    const handleToggle = (task: typeof allTasks[0]) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        updateTask.mutate({ taskId: task.id, data: { status: newStatus } });
    };

    const handleDelete = (taskId: string) => {
        if (confirm('¿Estás seguro de eliminar este acuerdo?')) {
            deleteTask.mutate(taskId);
        }
    };

    return (
        <div className="flex flex-col h-full bg-muted/10">
            {/* Header */}
            <div className="p-6 bg-card border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            {completedTasks.length} Completados
                        </span>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                            <Circle className="h-4 w-4 text-amber-500" />
                            {pendingTasks.length} Pendientes
                        </span>
                    </div>
                    <Button
                        onClick={() => setIsCreating(true)}
                        size="sm"
                        className="rounded-full gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Acuerdo
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Create Form */}
                {isCreating && (
                    <div className="mb-4 p-4 bg-card rounded-2xl border border-primary/20 shadow-lg shadow-primary/5 animate-in slide-in-from-top-2">
                        <h3 className="font-bold text-sm mb-3 text-foreground">Nuevo Acuerdo</h3>
                        <Textarea
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            placeholder="¿Qué acuerdo se estableció?"
                            className="bg-muted/20 border-border min-h-[80px] resize-none text-sm"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 pt-3">
                            <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>Cancelar</Button>
                            <Button size="sm" onClick={handleCreate} disabled={!newDescription.trim()}>Guardar</Button>
                        </div>
                    </div>
                )}

                {/* Tasks List */}
                {allTasks.length === 0 && !isCreating ? (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                        <ListChecks className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-muted-foreground/70 font-medium">No hay acuerdos registrados</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {allTasks.map((task) => (
                            <div
                                key={task.id}
                                className={cn(
                                    "group flex items-start gap-3 p-4 bg-card rounded-xl border transition-all",
                                    task.status === 'completed'
                                        ? "border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-900/10"
                                        : "border-border hover:border-border/80"
                                )}
                            >
                                <button
                                    onClick={() => handleToggle(task)}
                                    className={cn(
                                        "mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                                        task.status === 'completed'
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : "border-border text-transparent hover:border-emerald-400"
                                    )}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-sm font-medium text-foreground transition-all",
                                        task.status === 'completed' && "text-muted-foreground line-through decoration-muted-foreground/30"
                                    )}>
                                        {task.description}
                                    </p>
                                    {task.assignedStaffName && (
                                        <Badge variant="secondary" className="mt-2 bg-muted/30 text-muted-foreground gap-1.5 font-bold h-6 rounded-lg text-[10px]">
                                            <User className="h-3 w-3 opacity-70" />
                                            {task.assignedStaffName}
                                        </Badge>
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(task.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-muted-foreground/70 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
