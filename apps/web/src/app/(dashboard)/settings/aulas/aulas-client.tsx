'use client';

import { useState } from 'react';
import { useClassrooms, useCreateClassroom, useUpdateClassroom, useDeleteClassroom, type Classroom } from '@/features/classrooms/hooks/use-classrooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Star, Loader2, AlertCircle, DoorOpen } from 'lucide-react';
import { toast } from 'sonner';
import { ActionConfirm } from '@/components/molecules/action-confirm';
import { SimpleFormModal } from '@/components/molecules/wizard-modal';

interface AulasClientProps {
    showCreateModal: boolean;
    setShowCreateModal: (show: boolean) => void;
}

export function AulasClient({ showCreateModal, setShowCreateModal }: AulasClientProps) {
    const { data: classrooms, isLoading, isError, refetch } = useClassrooms();
    const createMutation = useCreateClassroom();
    const updateMutation = useUpdateClassroom();
    const deleteMutation = useDeleteClassroom();

    const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
    const [deletingClassroom, setDeletingClassroom] = useState<Classroom | null>(null);
    const [formData, setFormData] = useState({ name: '', code: '' });

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        try {
            if (editingClassroom) {
                await updateMutation.mutateAsync({
                    id: editingClassroom.id,
                    name: formData.name.trim(),
                    code: formData.code.trim() || undefined,
                });
                toast.success('Aula actualizada correctamente');
            } else {
                await createMutation.mutateAsync({
                    name: formData.name.trim(),
                    code: formData.code.trim() || undefined,
                    sortOrder: (classrooms?.length ?? 0),
                });
                toast.success('Aula creada correctamente');
            }
            setFormData({ name: '', code: '' });
            setShowCreateModal(false);
            setEditingClassroom(null);
        } catch (error) {
            toast.error(editingClassroom ? 'Error al actualizar el aula' : 'Error al crear el aula');
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
        if (!deletingClassroom) return;

        try {
            await deleteMutation.mutateAsync(deletingClassroom.id);
            setDeletingClassroom(null);
            toast.success('Aula eliminada correctamente');
        } catch (error) {
            toast.error('Error al eliminar el aula');
        }
    };

    const openCreate = () => {
        setEditingClassroom(null);
        setFormData({ name: '', code: '' });
        setShowCreateModal(true);
    };

    const openEdit = (classroom: Classroom) => {
        setEditingClassroom(classroom);
        setFormData({ name: classroom.name, code: classroom.code || '' });
        setShowCreateModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-rose-50/20 border border-rose-200 rounded-lg p-6 text-center shadow-none">
                <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
                <p className="text-rose-900 font-bold text-sm uppercase tracking-tight">Error al cargar aulas</p>
                <Button 
                    variant="outline" 
                    onClick={() => refetch()} 
                    className="mt-4 rounded-md border-border shadow-none font-black uppercase tracking-widest text-[11px] h-9"
                >
                    Reintentar
                </Button>
            </div>
        );
    }

    const activeClassrooms = classrooms?.filter(c => c.active) ?? [];

    return (
        <div className="space-y-6">
            {/* Header with action button */}
            <div className="flex justify-end">
                <Button
                    onClick={openCreate}
                    className="bg-primary hover:bg-primary/90 text-white rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-9"
                >
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    Registrar Nueva Aula
                </Button>
            </div>

            {/* Classrooms Grid */}
            {activeClassrooms.length === 0 ? (
                <div className="bg-card/30 border border-dashed border-border/80 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                        <DoorOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="max-w-xs space-y-2">
                        <h3 className="font-black text-sm uppercase tracking-tight text-foreground">Sin aulas configuradas</h3>
                        <p className="text-[11px] text-muted-foreground font-medium mb-6">
                            Crea tu primera aula para comenzar la gestión de espacios físicos.
                        </p>
                    </div>
                    <Button
                        onClick={openCreate}
                        className="bg-primary hover:bg-primary/90 text-white rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-10 px-6 mt-6"
                    >
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Crear Primera Aula
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeClassrooms.map((classroom) => (
                        <div
                            key={classroom.id}
                            className="bg-card/40 border border-border rounded-lg p-4 hover:border-primary/40 hover:bg-card/60 transition-all group flex flex-col shadow-none relative"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-md bg-white border border-border flex items-center justify-center text-primary shadow-none">
                                        <DoorOpen className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-[13px] uppercase tracking-tight text-foreground line-clamp-1" title={classroom.name}>
                                            {classroom.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {classroom.code && (
                                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                                                    {classroom.code}
                                                </span>
                                            )}
                                            {classroom.isPrimary && (
                                                <span className="inline-flex items-center gap-1 text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                                                    <Star className="h-2.5 w-2.5 fill-current" />
                                                    Principal
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!classroom.isPrimary && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleSetPrimary(classroom.id)}
                                            disabled={updateMutation.isPending}
                                            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md"
                                            title="Marcar como principal"
                                        >
                                            <Star className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEdit(classroom)}
                                        className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeletingClassroom(classroom)}
                                        disabled={classroom.isPrimary}
                                        className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-md disabled:opacity-30"
                                        title={classroom.isPrimary ? 'El aula principal no puede ser eliminada' : 'Eliminar aula'}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <SimpleFormModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                icon=""
                title={editingClassroom ? 'Editar Aula' : 'Nueva Aula'}
                description={editingClassroom
                    ? 'Modifica los datos del aula.'
                    : 'Crea una nueva aula para gestionar espacios físicos.'}
                onSubmit={handleSave}
                onCancel={() => {
                    setShowCreateModal(false);
                    setEditingClassroom(null);
                    setFormData({ name: '', code: '' });
                }}
                submitLabel={editingClassroom ? 'Guardar Cambios' : 'Crear Registro'}
                canSubmit={formData.name.trim().length > 0 && !(createMutation.isPending || updateMutation.isPending)}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
            >
                <div className="space-y-6 pt-2">
                    <div className="space-y-3">
                        <Label htmlFor="classroom-name" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                            Nombre del Aula <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="classroom-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Sala de Innovación"
                            className="h-11 text-sm rounded-md border-border focus:ring-1 focus:ring-primary shadow-none font-bold"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && formData.name.trim().length > 0) {
                                    handleSave();
                                }
                            }}
                        />
                        <p className="text-[11px] font-medium text-muted-foreground">
                            El nombre descriptivo del espacio físico.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="classroom-code" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                            Código / Identificador
                        </Label>
                        <Input
                            id="classroom-code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="Ej: AIP-01"
                            className="h-11 text-sm rounded-md border-border focus:ring-1 focus:ring-primary shadow-none font-bold"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && formData.name.trim().length > 0) {
                                    handleSave();
                                }
                            }}
                        />
                        <p className="text-[11px] font-medium text-muted-foreground">
                            Código opcional para identificación rápida.
                        </p>
                    </div>
                </div>
            </SimpleFormModal>

            {/* Delete Confirmation: Institutional Action Box */}
            <ActionConfirm
                open={!!deletingClassroom}
                onOpenChange={(open) => !open && setDeletingClassroom(null)}
                title="¿Confirmar eliminación de aula?"
                description={`Estás por eliminar permanentemente el aula "${deletingClassroom?.name}" del catálogo institucional. No podrás realizar nuevas reservas en este espacio.`}
                onConfirm={handleDelete}
                confirmText="Confirmar eliminación"
                cancelText="Mantenimiento"
                variant="destructive"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
