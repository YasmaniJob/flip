'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, ChevronLeft, FileText, Hash, List, Tag, Loader2, Server } from 'lucide-react';
import { RESOURCE_CONDITION_OPTIONS } from '@flip/shared';
import { WizardLayout } from '@/components/layouts/wizard-layout';
import type { WizardData } from './resource-wizard';
import { cn } from '@/lib/utils';
import { useApiClient } from '@/lib/api-client';

interface WizardStep2Props {
    data: Partial<WizardData>;
    onBack: () => void;
    onSuccess: () => void;
    onCancel: () => void;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
}

export function WizardStep2({ data, onBack, onSuccess, onCancel, isFullscreen, onToggleFullscreen }: WizardStep2Props) {
    const queryClient = useQueryClient();
    const apiClient = useApiClient();

    // Form state - auto-fill from template
    const [mode, setMode] = useState<'individual' | 'batch'>(data.mode || 'individual');
    const [name, setName] = useState(data.templateData?.name || data.name || '');
    const [brand, setBrand] = useState(data.templateData?.defaultBrand || data.brand || '');
    const [model, setModel] = useState(data.templateData?.defaultModel || data.model || '');
    const [serialNumber, setSerialNumber] = useState(data.serialNumber || '');
    const [condition, setCondition] = useState(data.condition || 'bueno');
    const [notes, setNotes] = useState(data.notes || '');
    const [quantity, setQuantity] = useState(data.quantity || 2);
    const [items, setItems] = useState<{ id: number; serialNumber: string; condition: string }[]>([]);

    // Sync items with quantity
    useEffect(() => {
        setItems(prev => {
            const currentLength = prev.length;
            if (currentLength === quantity) return prev;

            if (currentLength > quantity) {
                return prev.slice(0, quantity);
            }

            const newItems = [...prev];
            for (let i = currentLength; i < quantity; i++) {
                newItems.push({
                    id: i,
                    serialNumber: '',
                    condition: condition
                });
            }
            return newItems;
        });
    }, [quantity, condition]); // Added condition dependency to init new items

    // Update items when main condition changes
    const updateGlobalCondition = (newCondition: string) => {
        setCondition(newCondition);
        setItems(prev => prev.map(item => ({ ...item, condition: newCondition })));
    };

    // Auto-fill when template data changes (if coming back or init)
    useEffect(() => {
        if (data.templateData) {
            if (!name) setName(data.templateData.name);
            if (data.templateData.defaultBrand && !brand) setBrand(data.templateData.defaultBrand);
            if (data.templateData.defaultModel && !model) setModel(data.templateData.defaultModel);
        }
    }, [data.templateData, name, brand, model]);

    // Create mutation (Individual or Batch)
    const createMutation = useMutation({
        mutationFn: async () => {
            const resourceData = {
                categoryId: data.categoryId,
                templateId: data.templateId,
                name,
                brand: brand || undefined,
                model: model || undefined,
                serialNumber: mode === 'individual' ? (serialNumber || undefined) : undefined,
                condition,
                notes: notes || undefined,
            };

            if (mode === 'batch' && quantity > 1) {
                return apiClient.post('/resources/batch', {
                    resource: resourceData,
                    quantity: quantity,
                    items: items.map(i => ({
                        serialNumber: i.serialNumber || undefined,
                        condition: i.condition
                    })),
                });
            } else {
                return apiClient.post('/resources', resourceData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            onSuccess();
        },
    });

    const handleSubmit = () => {
        if (!name.trim()) return;
        createMutation.mutate();
    };

    const canSubmit = name.trim().length > 0;

    const formInputs = (
        <div className="space-y-6">
            {/* MODE SELECTION TABS */}
            <div className="space-y-4">
                <Tabs value={mode} onValueChange={(v) => setMode(v as 'individual' | 'batch')} className="w-full">
                    <TabsList className="w-full h-11 p-1 bg-slate-50/50 border border-border rounded-none shadow-none">
                        <TabsTrigger 
                            value="individual" 
                            className="flex-1 rounded-none border border-transparent data-[state=active]:bg-white data-[state=active]:border-border data-[state=active]:shadow-none font-black uppercase tracking-widest text-[10px] h-full transition-all"
                        >
                            <span className="mr-2 text-sm leading-none">💎</span> Individual
                        </TabsTrigger>
                        <TabsTrigger 
                            value="batch" 
                            className="flex-1 rounded-none border border-transparent data-[state=active]:bg-white data-[state=active]:border-border data-[state=active]:shadow-none font-black uppercase tracking-widest text-[10px] h-full transition-all"
                        >
                            <span className="mr-2 text-sm leading-none">📦</span> Por Lote
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex items-center gap-2 px-1">
                    <div className="h-0.5 w-4 bg-primary/30" />
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                        {mode === 'individual'
                            ? 'Un único recurso con número de serie y condición específica.'
                            : 'Registra múltiples copias idénticas en una sola acción.'}
                    </p>
                </div>
            </div>

            {/* Specific Group */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Name */}
                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                        <Label htmlFor="name" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Tag className="w-3 h-3" />
                            Nombre del Recurso *
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="EJ: MONITOR LG 24 PULGADAS"
                            className="bg-background border-border focus-visible:ring-0 focus-visible:border-primary/50 transition-all duration-200 h-10 rounded-none shadow-none text-xs font-bold uppercase tracking-tight"
                            autoFocus
                        />
                    </div>

                    {/* Brand & Model */}
                    <div className="space-y-1.5">
                        <Label htmlFor="brand" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Tag className="w-3 h-3" />
                            Marca
                        </Label>
                        <Input
                            id="brand"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="EJ: LG"
                            className="bg-background border-border focus-visible:ring-0 focus-visible:border-primary/50 transition-all duration-200 h-10 rounded-none shadow-none text-xs font-bold uppercase tracking-tight"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="model" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Server className="w-3 h-3" />
                            Modelo
                        </Label>
                        <Input
                            id="model"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="EJ: 24MK430H"
                            className="bg-background border-border focus-visible:ring-0 focus-visible:border-primary/50 transition-all duration-200 h-10 rounded-none shadow-none text-xs font-bold uppercase tracking-tight"
                        />
                    </div>

                    {/* Individual: Serial */}
                    {mode === 'individual' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="serialNumber" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <Hash className="w-3 h-3" />
                                Número de Serie
                            </Label>
                            <Input
                                id="serialNumber"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                                placeholder="AUTOGENERADO"
                                className="bg-slate-50/30 border-border focus-visible:ring-0 focus-visible:border-primary/50 font-mono transition-all duration-200 h-10 rounded-none shadow-none text-xs font-bold uppercase tracking-widest"
                            />
                            <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Generado automáticamente si se deja vacío.</p>
                        </div>
                    )}



                    {/* Condition Global - Only for Individual Mode */}
                    {mode === 'individual' && (
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <List className="w-3 h-3" />
                                Condición
                            </Label>
                            <div className="flex gap-2">
                                {RESOURCE_CONDITION_OPTIONS.map((option) => {
                                    const isSelected = condition === option.value;
                                    let selectedColorClass = "border-primary bg-primary/5 text-primary";
                                    let starColorClass = "text-primary";

                                    if (isSelected) {
                                        if (option.value === 'nuevo') {
                                            selectedColorClass = "border-emerald-600 bg-emerald-50 text-emerald-700";
                                            starColorClass = "text-emerald-500";
                                        } else if (option.value === 'bueno') {
                                            selectedColorClass = "border-primary bg-primary/5 text-primary";
                                            starColorClass = "text-primary";
                                        } else if (option.value === 'regular') {
                                            selectedColorClass = "border-amber-500 bg-amber-50 text-amber-700";
                                            starColorClass = "text-amber-500";
                                        } else if (option.value === 'malo') {
                                            selectedColorClass = "border-destructive bg-destructive/5 text-destructive-foreground";
                                            starColorClass = "text-destructive";
                                        }
                                    }

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => updateGlobalCondition(option.value)}
                                            className={cn(
                                                "flex-1 flex flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-none border transition-all duration-200 shadow-none",
                                                isSelected
                                                    ? selectedColorClass
                                                    : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={cn(
                                                            "text-[7px] leading-none transition-colors",
                                                            i < option.stars
                                                                ? starColorClass
                                                                : "opacity-20"
                                                        )}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-[9px] font-black leading-none uppercase tracking-[0.1em]">{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );

    return (
        <WizardLayout
            title="Nuevo Recurso"
            description="Registro de activos"
            onClose={onCancel}
            isFullscreen={isFullscreen}
            onToggleFullscreen={onToggleFullscreen}
        >

            {/* Main Content - Centered Single Column */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50/20 flex justify-center">
                <div className="w-full max-w-6xl space-y-8 pb-10">
                    {/* Context Header (Jira Style) */}
                    <div className="flex items-start gap-5">
                        <div className="shrink-0 w-14 h-14 flex items-center justify-center bg-white border border-border rounded-none text-2xl shadow-none">
                            {data.templateData?.icon || '📄'}
                        </div>
                        <div className="flex-1 pt-1">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-0.5 w-3 bg-primary/40" />
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    {data.categoryName} / Selección de Detalles
                                </span>
                            </div>
                            <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">
                                {data.templateData?.name || 'Recurso Nuevo'}
                            </h2>
                        </div>
                    </div>
                    {/* Form Inputs Section - Integrated */}
                    <div>
                        {formInputs}
                    </div>

                    {/* Batch Table Section - Integrated */}
                    {mode === 'batch' && (
                        <div className="mt-8">
                            <div className="mb-4 flex items-center justify-between bg-slate-100/30 p-3 border border-border rounded-none">
                                <div>
                                    <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest">Números de Serie y Estado</h4>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Define los detalles para cada unidad.</p>
                                </div>
                                <div className="flex items-center gap-3 bg-white p-1 border border-border rounded-none shadow-none">
                                    <span className="text-[9px] font-black text-muted-foreground pl-2 uppercase tracking-tight">CANTIDAD:</span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (quantity > 1) setQuantity(quantity - 1);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-none bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors focus:outline-none focus:ring-0 shadow-none text-xs font-bold"
                                        >
                                            -
                                        </button>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={quantity}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val) && val >= 1 && val <= 100) setQuantity(val);
                                            }}
                                            className="w-10 h-7 text-center font-black bg-transparent border-none focus:ring-0 p-0 text-[11px] text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none m-0 uppercase"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (quantity < 100) setQuantity(quantity + 1);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-none bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors focus:outline-none focus:ring-0 shadow-none text-xs font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-none border border-border overflow-hidden bg-background shadow-none">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-b border-border hover:bg-transparent">
                                            <TableHead className="w-[48px] text-center font-black text-muted-foreground uppercase text-[10px] tracking-widest">#</TableHead>
                                            <TableHead className="w-[200px] font-black text-muted-foreground uppercase text-[10px] tracking-widest">Recurso Base</TableHead>
                                            <TableHead className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">N/S (Serial)</TableHead>
                                            <TableHead className="w-[140px] font-black text-muted-foreground uppercase text-[10px] tracking-widest">Condición</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={item.id} className="hover:bg-slate-50 border-b border-border last:border-0 h-11">
                                                <TableCell className="text-center font-black text-muted-foreground/60 text-[10px] tracking-tight">
                                                    {String(index + 1).padStart(2, '0')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-foreground text-[11px] uppercase tracking-tight truncate max-w-[180px]">
                                                            {name || 'Recurso sin nombre'}
                                                        </span>
                                                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                                                            {brand} {model}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-1">
                                                    <Input
                                                        value={item.serialNumber}
                                                        onChange={(e) => {
                                                            const newValue = e.target.value;
                                                            setItems(prev => prev.map(i =>
                                                                i.id === item.id ? { ...i, serialNumber: newValue } : i
                                                            ));
                                                        }}
                                                        placeholder="N/S"
                                                        className="h-8 text-[11px] font-black uppercase tracking-widest bg-slate-50/30 border-border focus-visible:ring-0 focus-visible:border-primary/50 rounded-none shadow-none"
                                                    />
                                                </TableCell>
                                                <TableCell className="py-1">
                                                    <Select
                                                        value={item.condition}
                                                        onValueChange={(val) => {
                                                            setItems(prev => prev.map(i =>
                                                                i.id === item.id ? { ...i, condition: val } : i
                                                            ));
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-full h-8 text-[10px] font-black uppercase tracking-widest border-border bg-slate-50/30 focus:ring-0 rounded-none shadow-none">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-none border-border">
                                                            {RESOURCE_CONDITION_OPTIONS.map((option) => (
                                                                <SelectItem key={option.value} value={option.value} className="text-[10px] font-black uppercase tracking-widest rounded-none">
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                    {/* Notes - Moved to End */}
                    <div className="space-y-1.5 pt-4 mt-4">
                        <Label htmlFor="notes" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <FileText className="w-3 h-3" />
                            Notas Adicionales / Ubicación
                        </Label>
                        <div className="bg-slate-100/30 p-1 border border-border rounded-none">
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="UBICACIÓN FÍSICA O DETALLES ADICIONALES..."
                                rows={3}
                                className="resize-none bg-white border-none focus-visible:ring-0 transition-all duration-200 rounded-none shadow-none text-xs font-bold uppercase tracking-tight placeholder:text-muted-foreground/30"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-5 border-t border-border bg-slate-50/50 flex items-center justify-between z-10 shadow-none">
                <div className="flex items-center gap-3">
                    <Button variant="jiraOutline" onClick={onBack} className="h-10 px-6 font-black uppercase tracking-widest text-[10px] shadow-none">
                        <ChevronLeft className="h-3.5 w-3.5 mr-2" />
                        Anterior
                    </Button>
                </div>

                <div className="flex gap-2 text-right">
                    <Button
                        variant="jiraOutline"
                        onClick={onCancel}
                        className="h-10 px-8 font-black uppercase tracking-widest text-[10px] min-w-[120px] shadow-none"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="jira"
                        onClick={handleSubmit}
                        disabled={createMutation.isPending || !canSubmit}
                        className="h-10 px-10 font-black uppercase tracking-widest text-[11px] disabled:opacity-40 shadow-none"
                    >
                        {createMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {mode === 'batch' ? 'Procesando...' : 'Creando...'}
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {mode === 'batch' ? `Crear ${quantity} Recursos` : 'Confirmar y Crear'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Error Toast/Message */}
            {createMutation.isError && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg shadow-none text-xs font-bold uppercase tracking-tight animate-in fade-in slide-in-from-bottom-2 z-50">
                    <AlertCircle className="h-4 w-4" />
                    Error al crear recurso. Intenta de nuevo.
                </div>
            )}
        </WizardLayout>
    );
}
