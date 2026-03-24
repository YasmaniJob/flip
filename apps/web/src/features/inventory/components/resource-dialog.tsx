import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { WizardLayout } from '@/components/layouts/wizard-layout';
import { RESOURCE_STATUS_OPTIONS, RESOURCE_CONDITION_OPTIONS } from '@flip/shared';
import { Tag, Server, Hash, List, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourceData {
    id?: string;
    name: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    categoryId?: string;
    status?: string;
    condition?: string;
    stock?: number;
    notes?: string;
}

interface ResourceDialogProps {
    resource?: ResourceData;
    categories?: Array<{ id: string; name: string }>;
    loading?: boolean;
    onSave: (data: ResourceData) => void;
    onClose: () => void;
}

export function ResourceDialog({ resource, categories = [], loading, onSave, onClose }: ResourceDialogProps) {
    const [formData, setFormData] = useState<ResourceData>(resource || {
        name: '',
        brand: '',
        model: '',
        serialNumber: '',
        categoryId: '',
        status: 'disponible',
        condition: 'bueno',
        stock: 1,
        notes: '',
    });

    // Derive category name for preview
    const categoryName = categories.find(c => c.id === formData.categoryId)?.name;

    const handleSubmit = () => {
        if (!formData.name.trim()) return;
        onSave(formData);
    };

    const hasChanges = JSON.stringify(formData) !== JSON.stringify(resource || {
        name: '',
        brand: '',
        model: '',
        serialNumber: '',
        categoryId: '',
        status: 'disponible',
        condition: 'bueno',
        stock: 1,
        notes: '',
    });

    const canSubmit = formData.name.trim().length > 0 && hasChanges;

    const sidebarContent = (
        <div className="w-full space-y-3">
            <div className="px-1">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Vista Previa
                </h4>
                <p className="text-[10px] text-muted-foreground/60 font-medium">
                    Así se verá el recurso actualizado.
                </p>
            </div>

            <div className="w-full bg-background rounded-none border border-border overflow-hidden relative shadow-none">
                <div className="p-4">
                    <div className="flex justify-center mb-4">
                        <div className="w-14 h-14 rounded-none bg-muted/20 border border-border flex items-center justify-center text-2xl shadow-none">
                            📦
                        </div>
                    </div>

                    <div className="space-y-4 text-center">
                        <div>
                            <h3 className="text-xs font-black text-foreground uppercase tracking-tight leading-tight mb-1 break-words">
                                {formData.name || <span className="text-muted-foreground/30 italic">Nombre del Recurso</span>}
                            </h3>
                            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">
                                <span className="truncate max-w-[120px]">
                                    {formData.brand || 'MARCA'}
                                </span>
                                {formData.model && (
                                    <>
                                        <span className="w-1 h-0.5 bg-border shrink-0" />
                                        <span className="truncate max-w-[120px]">{formData.model}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {categoryName && (
                                <div className="px-2 py-0.5 rounded-none bg-muted/20 border border-border text-[9px] font-black uppercase tracking-widest text-foreground flex items-center gap-1">
                                    <Tag className="w-2.5 h-2.5" />
                                    {categoryName}
                                </div>
                            )}
                            {formData.serialNumber && (
                                <div className="px-2 py-0.5 rounded-none bg-primary/5 border border-primary/10 text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                    <Hash className="w-2.5 h-2.5" />
                                    {formData.serialNumber}
                                </div>
                            )}
                            <div className={cn(
                                "px-2 py-0.5 rounded-none border text-[9px] font-black uppercase tracking-widest flex items-center gap-1",
                                formData.condition === 'nuevo' ? "bg-primary/5 border-primary/20 text-primary" :
                                    formData.condition === 'bueno' ? "bg-muted/20 border-border text-foreground/60" :
                                        "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-300"
                            )}>
                                <span className="text-[8px]">★</span>
                                {RESOURCE_CONDITION_OPTIONS.find(c => c.value === formData.condition)?.label || formData.condition}
                            </div>
                        </div>

                        {formData.notes && (
                            <div className="p-2.5 rounded-none bg-muted/10 border border-border text-[10px] text-muted-foreground/60 leading-relaxed text-left font-medium">
                                <FileText className="w-2.5 h-2.5 mb-0.5 inline-block mr-1 text-muted-foreground/40" />
                                <span className="italic">{formData.notes}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="sm:max-w-6xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none sm:rounded-none">
                <WizardLayout
                    title="Editar Recurso"
                    description="Modifica los detalles del recurso."
                    sidebarContent={sidebarContent}
                    onClose={onClose}
                    className="h-[85vh] sm:rounded-none"
                    contentClassName="rounded-none sticky"
                >
                    <div className="shrink-0 px-6 pt-5 pb-3 border-b border-border flex items-center justify-between bg-muted/10">
                        <div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                                Información del Recurso
                            </h3>
                            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-0.5">
                                Actualiza los datos técnicos y el estado.
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="col-span-1 md:col-span-2 space-y-1.5">
                                    <Label htmlFor="name" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5" />
                                        Nombre del Recurso *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej: Monitor LG 24 pulgadas"
                                        className="bg-background border-border focus:border-primary/50 focus:ring-0 transition-all duration-200 h-9 rounded-none shadow-none text-xs font-bold uppercase tracking-tight"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="brand" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5" />
                                        Marca
                                    </Label>
                                    <Input
                                        id="brand"
                                        value={formData.brand || ''}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        className="bg-background border-border focus:border-primary/50 focus:ring-0 transition-all duration-200 h-9 rounded-none shadow-none text-xs font-bold uppercase tracking-tight"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="model" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <Server className="w-3.5 h-3.5" />
                                        Modelo
                                    </Label>
                                    <Input
                                        id="model"
                                        value={formData.model || ''}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        className="bg-background border-border focus:border-primary/50 focus:ring-0 transition-all duration-200 h-9 rounded-none shadow-none text-xs font-bold uppercase tracking-tight"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="serialNumber" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <Hash className="w-3.5 h-3.5" />
                                        Número de Serie
                                    </Label>
                                    <Input
                                        id="serialNumber"
                                        value={formData.serialNumber || ''}
                                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                        className="bg-background border-border focus:border-primary/50 focus:ring-0 font-mono transition-all duration-200 h-9 rounded-none shadow-none text-xs font-bold uppercase tracking-tight"
                                    />
                                </div>

                                {categories.length > 0 && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="category" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                            <Tag className="w-3.5 h-3.5" />
                                            Categoría
                                        </Label>
                                        <Select
                                            value={formData.categoryId || ''}
                                            onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                                        >
                                            <SelectTrigger className="h-9 w-full bg-background border-border rounded-none shadow-none text-[10px] font-black uppercase tracking-widest">
                                                <SelectValue placeholder="Seleccionar categoría" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-border shadow-none">
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id} className="text-[10px] font-black uppercase tracking-widest py-2 rounded-none">
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="col-span-1 md:col-span-2 space-y-1.5 pt-2">
                                    <Label htmlFor="status" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <List className="w-3.5 h-3.5" />
                                        Estado Actual
                                    </Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {RESOURCE_STATUS_OPTIONS.map((option) => {
                                            const isSelected = formData.status === option.value;
                                            let selectedColorClass = "bg-primary border-primary text-primary-foreground";

                                            if (isSelected) {
                                                if (option.value === 'disponible') {
                                                    selectedColorClass = "bg-emerald-600 border-emerald-600 text-white";
                                                } else if (option.value === 'prestado') {
                                                    selectedColorClass = "bg-blue-600 border-blue-600 text-white";
                                                } else if (option.value === 'mantenimiento') {
                                                    selectedColorClass = "bg-amber-500 border-amber-500 text-white";
                                                } else if (option.value === 'baja') {
                                                    selectedColorClass = "bg-destructive border-destructive text-destructive-foreground";
                                                }
                                            }

                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, status: option.value })}
                                                    className={cn(
                                                        "flex items-center justify-center gap-2 py-2 px-3 rounded-none border transition-all duration-200",
                                                        isSelected
                                                            ? selectedColorClass
                                                            : "bg-background border-border text-muted-foreground/60 hover:border-primary/50 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "w-1.5 h-1.5",
                                                        isSelected ? "bg-white" :
                                                            option.value === 'disponible' ? "bg-emerald-500" :
                                                                option.value === 'prestado' ? "bg-blue-500" :
                                                                    option.value === 'mantenimiento' ? "bg-amber-500" : "bg-destructive"
                                                    )} />
                                                    <span className="text-[9px] font-black leading-none uppercase tracking-widest">{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="col-span-1 md:col-span-2 space-y-1.5">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <List className="w-3.5 h-3.5" />
                                        Condición Física
                                    </Label>
                                    <div className="flex gap-2">
                                        {RESOURCE_CONDITION_OPTIONS.map((option) => {
                                            const isSelected = formData.condition === option.value;
                                            let selectedColorClass = "bg-primary border-primary text-primary-foreground";
                                            let starColorClass = "text-primary-foreground/90";

                                            if (isSelected) {
                                                if (option.value === 'nuevo') {
                                                    selectedColorClass = "bg-blue-600 border-blue-600 text-white";
                                                    starColorClass = "text-blue-100";
                                                } else if (option.value === 'bueno') {
                                                    selectedColorClass = "bg-slate-700 border-slate-700 text-white";
                                                    starColorClass = "text-slate-100";
                                                } else if (option.value === 'regular') {
                                                    selectedColorClass = "bg-amber-500 border-amber-500 text-white";
                                                    starColorClass = "text-amber-100";
                                                } else if (option.value === 'malo') {
                                                    selectedColorClass = "bg-destructive border-destructive text-destructive-foreground";
                                                    starColorClass = "text-destructive-foreground/90";
                                                }
                                            }

                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, condition: option.value })}
                                                    className={cn(
                                                        "flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-none border transition-all duration-200",
                                                        isSelected
                                                            ? selectedColorClass
                                                            : "bg-background border-border text-muted-foreground/60 hover:border-primary/50 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className="flex gap-0.5">
                                                        {Array.from({ length: 3 }).map((_, i) => (
                                                            <span
                                                                key={i}
                                                                className={cn(
                                                                    "text-[8px] leading-none transition-colors",
                                                                    i < option.stars
                                                                        ? (isSelected ? starColorClass : "text-amber-500")
                                                                        : (isSelected ? "text-white/30" : "text-muted-foreground/20")
                                                                )}
                                                            >
                                                                ★
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="text-[9px] font-black leading-none uppercase tracking-widest">{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                             <div className="space-y-1.5 pt-4 border-t border-border">
                                <Label htmlFor="notes" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" />
                                    Notas Adicionales / Ubicación
                                </Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Ubicación física o detalles adicionales..."
                                    rows={3}
                                    className="resize-none bg-background border-border focus:border-primary/50 focus:ring-0 transition-all duration-200 rounded-none shadow-none text-xs font-bold uppercase tracking-tight"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 p-5 border-t border-border bg-muted/10 flex items-center gap-4 z-10 shadow-none">
                        <div className="flex-1 flex gap-2">
                            <Button
                                variant="jiraOutline"
                                onClick={onClose}
                                className="font-black px-6 h-10 text-[10px] uppercase tracking-widest min-w-[120px]"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="jira"
                                onClick={handleSubmit}
                                disabled={loading || !canSubmit}
                                className="flex-1 font-black h-10 text-[11px] uppercase tracking-widest disabled:opacity-30"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </WizardLayout>
            </DialogContent>
        </Dialog>
    );
}
