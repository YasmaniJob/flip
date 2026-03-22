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
            <div className="p-6 pb-4 border-b bg-white">
                <h2 className="text-xl font-black text-slate-900">{title || 'Detalle del Taller'}</h2>
                <p className="text-xs text-slate-500 mt-1">Gestiona la asistencia y acuerdos de este taller</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="attendance" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-none h-12 p-0 border-b">
                    <TabsTrigger value="attendance" className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none gap-2 font-bold">
                        <Users className="h-4 w-4" />
                        Asistencia
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="h-full rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none gap-2 font-bold">
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
                <p className="text-slate-500 font-medium">Cargando asistencia...</p>
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
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Stats Header */}
            <div className="p-6 bg-white border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            {presentCount} Presentes
                        </span>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-sm font-bold text-slate-500">
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
                <div className="p-4 bg-white border-b animate-in slide-in-from-top-2">
                    <div className="bg-slate-100 p-2 rounded-2xl">
                        <div className="flex items-center px-3 pt-1 pb-1 mb-2 gap-2">
                            <Search className="h-4 w-4 shrink-0 text-slate-400" />
                            <Input
                                placeholder="Buscar personal..."
                                value={staffSearch}
                                onChange={(e) => setStaffSearch(e.target.value)}
                                className="flex-1 h-auto py-1.5 border-none focus-visible:ring-0 px-0 text-sm bg-transparent placeholder:text-slate-400 font-medium text-slate-700"
                                autoFocus
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setShowSearch(false); setStaffSearch(''); }}
                                className="h-7 px-2 text-xs text-slate-400 hover:text-slate-600 rounded-full"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="max-h-40 overflow-y-auto px-1 custom-scrollbar">
                            {isLoadingStaff ? (
                                <div className="py-6 text-center text-xs text-slate-500">Cargando...</div>
                            ) : filteredStaff?.length === 0 ? (
                                <div className="py-6 text-center text-xs text-slate-500">Sin resultados</div>
                            ) : (
                                <div className="space-y-0.5 pb-1">
                                    {filteredStaff?.map((person) => (
                                        <div
                                            key={person.id}
                                            onClick={() => handleAddStaff(person.id)}
                                            className="cursor-pointer py-2 px-3 rounded-xl hover:bg-blue-100 flex items-center gap-2 transition-colors"
                                        >
                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">{person.name}</span>
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
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                        <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 font-medium">No hay participantes registrados</p>
                        <p className="text-xs text-slate-400 mt-1">Agrega participantes con el botón &quot;Agregar&quot;</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {records.map((record) => (
                            <div
                                key={record.id}
                                className="group flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-all"
                            >
                                <button
                                    onClick={() => handleToggleStatus(record)}
                                    className={cn(
                                        "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                                        record.status === 'presente'
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : record.status === 'tardanza'
                                                ? "bg-amber-500 border-amber-500 text-white"
                                                : "border-slate-300 text-transparent hover:border-emerald-400"
                                    )}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{record.staffName || 'Sin nombre'}</p>
                                    {record.staffRole && (
                                        <p className="text-xs text-slate-400">{record.staffRole}</p>
                                    )}
                                </div>

                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        "text-[10px] font-bold uppercase rounded-lg",
                                        record.status === 'presente' ? "bg-emerald-100 text-emerald-700" :
                                            record.status === 'tardanza' ? "bg-amber-100 text-amber-700" :
                                                "bg-slate-100 text-slate-500"
                                    )}
                                >
                                    {record.status}
                                </Badge>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeAttendee.mutate(record.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
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
                <p className="text-slate-500 font-medium">Cargando acuerdos...</p>
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
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Header */}
            <div className="p-6 bg-white border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            {completedTasks.length} Completados
                        </span>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
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
                    <div className="mb-4 p-4 bg-white rounded-2xl border border-primary/20 shadow-lg shadow-primary/5 animate-in slide-in-from-top-2">
                        <h3 className="font-bold text-sm mb-3 text-slate-800">Nuevo Acuerdo</h3>
                        <Textarea
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            placeholder="¿Qué acuerdo se estableció?"
                            className="bg-slate-50 border-slate-200 min-h-[80px] resize-none text-sm"
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
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                        <ListChecks className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 font-medium">No hay acuerdos registrados</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {allTasks.map((task) => (
                            <div
                                key={task.id}
                                className={cn(
                                    "group flex items-start gap-3 p-4 bg-white rounded-xl border transition-all",
                                    task.status === 'completed'
                                        ? "border-emerald-100 bg-emerald-50/30"
                                        : "border-slate-100 hover:border-slate-200"
                                )}
                            >
                                <button
                                    onClick={() => handleToggle(task)}
                                    className={cn(
                                        "mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                                        task.status === 'completed'
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : "border-slate-300 text-transparent hover:border-emerald-400"
                                    )}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-sm font-medium text-slate-900 transition-all",
                                        task.status === 'completed' && "text-slate-500 line-through decoration-slate-300"
                                    )}>
                                        {task.description}
                                    </p>
                                    {task.assignedStaffName && (
                                        <Badge variant="secondary" className="mt-2 bg-slate-100 text-slate-600 gap-1.5 font-bold h-6 rounded-lg text-[10px]">
                                            <User className="h-3 w-3 opacity-70" />
                                            {task.assignedStaffName}
                                        </Badge>
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(task.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
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
