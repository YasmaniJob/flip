'use client';

import { useState } from 'react';
import { useClassrooms, useCreateClassroom, useUpdateClassroom, useDeleteClassroom, type Classroom } from '@/features/classrooms/hooks/use-classrooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Star, GripVertical, Check, X } from 'lucide-react';
import { toast } from 'sonner';

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

export function AulasClient() {
    const { data: classrooms, isLoading } = useClassrooms();
    const createMutation = useCreateClassroom();
    const updateMutation = useUpdateClassroom();
    const deleteMutation = useDeleteClassroom();

    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', code: '' });

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        try {
            await createMutation.mutateAsync({
                name: formData.name.trim(),
                code: formData.code.trim() || undefined,
                sortOrder: (classrooms?.length ?? 0),
            });
            setFormData({ name: '', code: '' });
            setIsCreating(false);
            toast.success('Aula creada correctamente');
        } catch (error) {
            toast.error('Error al crear el aula');
        }
    };

    const handleUpdate = async (id: string) => {
        if (!formData.name.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        try {
            await updateMutation.mutateAsync({
                id,
                name: formData.name.trim(),
                code: formData.code.trim() || undefined,
            });
            setFormData({ name: '', code: '' });
            setEditingId(null);
            toast.success('Aula actualizada correctamente');
        } catch (error) {
            toast.error('Error al actualizar el aula');
        }
    };

    const handleSetPrimary = async (id: string) => {
        try {
            await updateMutation.mutateAsync({ id, isPrimary: true });
            toast.success('Aula principal actualizada');
        } catch (error) {
            toast.error('Error al actualizar el aula principal');
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;

        try {
            await deleteMutation.mutateAsync(deletingId);
            setDeletingId(null);
            toast.success('Aula eliminada correctamente');
        } catch (error) {
            toast.error('Error al eliminar el aula');
        }
    };

    const startEdit = (classroom: Classroom) => {
        setEditingId(classroom.id);
        setFormData({ name: classroom.name, code: classroom.code || '' });
        setIsCreating(false);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ name: '', code: '' });
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-20 bg-muted/20 border border-border animate-pulse rounded-lg" />
                <div className="h-20 bg-muted/20 border border-border animate-pulse rounded-lg" />
            </div>
        );
    }

    const activeClassrooms = classrooms?.filter(c => c.active) ?? [];

    return (
        <div className="space-y-4">
            {/* List */}
            <div className="bg-card/40 border border-border rounded-lg overflow-hidden shadow-none">
                <div className="divide-y divide-border/50">
                    {activeClassrooms.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground bg-card/20">
                            <p className="text-[11px] font-black uppercase tracking-widest">No hay aulas configuradas</p>
                            <p className="text-[10px] mt-1 opacity-60">Crea tu primera aula para comenzar la gestión</p>
                        </div>
                    ) : (
                        activeClassrooms.map((classroom) => (
                            <div key={classroom.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors group">
                                {/* Drag handle indicator */}
                                <div className="text-muted-foreground/20">
                                    <GripVertical className="h-4 w-4" />
                                </div>

                                {editingId === classroom.id ? (
                                    <>
                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Nombre del Aula</Label>
                                                <Input
                                                    value={formData.name}
                                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                                    placeholder="Ej: Sala de Innovación"
                                                    className="h-9 text-sm font-bold shadow-none border-border focus:ring-1 focus:ring-primary"
                                                    autoFocus
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Código / Identificador</Label>
                                                <Input
                                                    value={formData.code}
                                                    onChange={(e) => setFormData(p => ({ ...p, code: e.target.value }))}
                                                    placeholder="Ej: AIP-01"
                                                    className="h-9 text-sm font-bold shadow-none border-border focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleUpdate(classroom.id)}
                                                disabled={updateMutation.isPending}
                                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/5 rounded-md"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={cancelEdit}
                                                disabled={updateMutation.isPending}
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[13px] font-black uppercase tracking-tight text-foreground">{classroom.name}</p>
                                                {classroom.isPrimary && (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded">
                                                        <Star className="h-2.5 w-2.5 fill-current" />
                                                        Principal
                                                    </span>
                                                )}
                                            </div>
                                            {classroom.code && (
                                                <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-widest">{classroom.code}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!classroom.isPrimary && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleSetPrimary(classroom.id)}
                                                    disabled={updateMutation.isPending}
                                                    className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md"
                                                >
                                                    <Star className="h-3.5 w-3.5 mr-1.5" />
                                                    Principal
                                                </Button>
                                            )}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => startEdit(classroom)}
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setDeletingId(classroom.id)}
                                                disabled={deleteMutation.isPending || classroom.isPrimary}
                                                className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-md disabled:opacity-30"
                                                title={classroom.isPrimary ? 'El aula principal no puede ser eliminada' : 'Eliminar aula'}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}

                    {/* Quick Create row */}
                    {isCreating && (
                        <div className="p-4 bg-primary/5 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-end gap-3">
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Nombre del Aula</Label>
                                        <Input
                                            autoFocus
                                            value={formData.name}
                                            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                            placeholder="Ej: Sala de Cómputo 2"
                                            className="h-9 text-sm font-bold shadow-none border-border focus:ring-1 focus:ring-primary"
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">Código / ID</Label>
                                        <Input
                                            value={formData.code}
                                            onChange={(e) => setFormData(p => ({ ...p, code: e.target.value }))}
                                            placeholder="Ej: SC-02"
                                            className="h-9 text-sm font-bold shadow-none border-border focus:ring-1 focus:ring-primary"
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={handleCreate}
                                        disabled={createMutation.isPending}
                                        className="h-9 px-4 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white rounded-md shadow-none"
                                    >
                                        Confirmar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setIsCreating(false);
                                            setFormData({ name: '', code: '' });
                                        }}
                                        disabled={createMutation.isPending}
                                        className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground rounded-md transition-colors"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add button trigger */}
            {!isCreating && (
                <Button
                    variant="outline"
                    onClick={() => {
                        setIsCreating(true);
                        setEditingId(null);
                        setFormData({ name: '', code: '' });
                    }}
                    className="w-full h-11 border-dashed border-border/80 hover:border-primary/50 hover:text-primary hover:bg-primary/5 rounded-lg shadow-none font-black uppercase tracking-widest text-[11px] transition-all"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Nueva Aula
                </Button>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent className="shadow-none border border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">¿Eliminar Aula?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            Esta acción eliminará el registro del aula permanentemente. Las reservaciones existentes vinculadas a este aula no serán afectadas, pero no se podrán realizar nuevas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-md h-10 text-xs font-black uppercase tracking-widest border-border shadow-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-md h-10 text-xs font-black uppercase tracking-widest shadow-none"
                        >
                            Eliminar Registro
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
