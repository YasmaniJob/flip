"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, PackagePlus, Save, X, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Slider } from "@/components/ui/slider";

import { useCreateResource } from "@/features/inventory/hooks/use-resources";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Enums & Options ────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "disponible", label: "Disponible", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "prestado", label: "Prestado", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "mantenimiento", label: "Mantenimiento", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "baja", label: "Baja", color: "bg-rose-50 text-rose-700 border-rose-200" },
] as const;

const CONDITION_OPTIONS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "bueno", label: "Bueno" },
  { value: "regular", label: "Regular" },
  { value: "malo", label: "Malo" },
] as const;

// ─── Validation Schema ──────────────────────────────────────────────────────
const itemSchema = z.object({
  serialNumber: z.string().optional(),
  condition: z.string().min(1, "Obligatorio"),
  status: z.string().min(1, "Obligatorio"),
  name: z.string().optional(),
  notes: z.string().optional(),
});

const formSchema = z.object({
  mode: z.enum(["individual", "batch"]),
  name: z.string().min(2, "Obligatorio (mín 2 caracteres)"),
  brand: z.string().optional(),
  model: z.string().optional(),
  singleItem: itemSchema,
  batchItems: z.array(itemSchema).min(1, "Debe añadir al menos un recurso"),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Component ──────────────────────────────────────────────────────────────
interface AddStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  templateId: string;
  templateName: string;
  templateIcon?: string | null;
  onSuccess?: () => void;
}

export function AddStockModal({
  open,
  onOpenChange,
  categoryId,
  templateId,
  templateName,
  templateIcon,
  onSuccess
}: AddStockModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createResourceMutation = useCreateResource();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "individual",
      name: templateName, // Default to template name
      brand: "",
      model: "",
      singleItem: {
        serialNumber: "", condition: "bueno", status: "disponible", notes: "", name: ""
      },
      batchItems: [
        { serialNumber: "", condition: "bueno", status: "disponible", name: `${templateName} 1`, notes: "" },
        { serialNumber: "", condition: "bueno", status: "disponible", name: `${templateName} 2`, notes: "" }
      ],
    },
  });

  const mode = form.watch("mode");
  const isBatchMode = mode === "batch";

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "batchItems",
  });

  const handleQuantityChange = (newLen: number) => {
      let finalLen = isNaN(newLen) || newLen < 1 ? 1 : newLen;
      if (finalLen > 50) finalLen = 50; 
      
      const currentLen = fields.length;
      if (finalLen > currentLen) {
          const newItems = Array.from({ length: finalLen - currentLen }).map((_, i) => ({
              name: `${templateName} ${currentLen + i + 1}`,
              serialNumber: "", condition: "bueno", status: "disponible", notes: ""
          }));
          append(newItems);
      } else if (finalLen < currentLen) {
          const indicesToRemove = Array.from({ length: currentLen - finalLen }).map((_, i) => currentLen - 1 - i);
          remove(indicesToRemove);
      }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (!isBatchMode) {
        // Individual
        await createResourceMutation.mutateAsync({
          name: values.name,
          categoryId,
          templateId,
          brand: values.brand,
          model: values.model,
          serialNumber: values.singleItem.serialNumber,
          condition: values.singleItem.condition,
          status: values.singleItem.status,
          notes: values.singleItem.notes,
        });
        toast.success("Recurso registrado exitosamente");
      } else {
        // En lote (Batch)
        const promises = values.batchItems.map((item) =>
          createResourceMutation.mutateAsync({
            name: item.name || values.name,
            categoryId,
            templateId,
            brand: values.brand,
            model: values.model,
            serialNumber: item.serialNumber,
            condition: item.condition,
            status: item.status,
            notes: item.notes,
          })
        );
        await Promise.all(promises);
        toast.success(`${values.batchItems.length} recursos registrados exitosamente`);
      }

      form.reset({
        mode: "individual",
        name: templateName,
        brand: "",
        model: "",
        singleItem: { serialNumber: "", condition: "bueno", status: "disponible", notes: "", name: "" },
        batchItems: [
          { serialNumber: "", condition: "bueno", status: "disponible", notes: "", name: `${templateName} 1` },
          { serialNumber: "", condition: "bueno", status: "disponible", notes: "", name: `${templateName} 2` },
        ],
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar el recurso");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if (!val) form.reset();
        onOpenChange(val);
    }}>
      <DialogContent
        showCloseButton={false}
        className={cn(
            "p-0 gap-0 overflow-hidden bg-background border border-border shadow-none rounded-lg transition-all duration-300",
            isBatchMode ? "sm:max-w-[900px] w-[95vw]" : "sm:max-w-[700px] w-[95vw]"
        )}
      >
        <DialogTitle className="sr-only">Añadir Unidades a {templateName}</DialogTitle>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border bg-muted/20 relative">
          <button 
            onClick={() => {
                form.reset();
                onOpenChange(false);
            }}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted/30 text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center text-xl shrink-0">
                 {templateIcon || <PackagePlus className="w-5 h-5 text-muted-foreground/70" />}
             </div>
             <div>
                <h3 className="text-lg font-black text-foreground tracking-tight">
                  Añadir {templateName}
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Registra nuevas unidades físicas para esta subcategoría.
                </p>
             </div>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar max-h-[75vh]">
          <Form {...form}>
            <form id="add-stock-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Type toggle */}
              <div className="bg-muted/20 rounded-lg p-1 flex items-center border border-border shadow-sm max-w-xs">
                <button
                  type="button"
                  onClick={() => form.setValue("mode", "individual")}
                  className={cn(
                    "flex-1 text-[11px] font-black uppercase tracking-widest py-2 px-3 rounded-sm transition-all",
                    !isBatchMode ? "bg-card text-primary border border-border" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  Unidad Única
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("mode", "batch")}
                  className={cn(
                    "flex-1 text-[11px] font-black uppercase tracking-widest py-2 px-3 rounded-sm transition-all",
                    isBatchMode ? "bg-card text-primary border border-border" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  Lote (Múltiples)
                </button>
              </div>

              {/* COMMON FIELDS: Nombre, Marca, Modelo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 space-y-1">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Nombre Descriptivo <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Laptop HP Core i5" className="h-9 shadow-none rounded-none text-sm font-bold border-border focus-visible:ring-primary/20" {...field} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Marca general</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. HP" className="h-9 shadow-none rounded-none text-sm border-border focus-visible:ring-primary/20" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Modelo general</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. ProBook 450" className="h-9 shadow-none rounded-none text-sm border-border focus-visible:ring-primary/20" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* DYNAMIC VIEW BASED ON MODE */}
              <AnimatePresence mode="wait">
                {!isBatchMode ? (
                  // ─ INDIVIDUAL MODE ─────────────────────────────────────────────────
                  <motion.div
                    key="single"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 py-4 border-t border-border mt-6"
                  >
                    <div className="md:col-span-2 text-[10px] font-black uppercase tracking-widest text-primary mb-[-10px]">
                        Detalles Específicos de la Unidad
                    </div>

                    <FormField
                      control={form.control}
                      name="singleItem.serialNumber"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2 space-y-1">
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Número de Serie</FormLabel>
                          <FormControl>
                            <Input placeholder="SN XXXXXXXXXX" className="h-9 shadow-none rounded-none text-sm font-mono border-border uppercase focus-visible:ring-primary/20" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="singleItem.condition"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Condición Física</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9 shadow-none rounded-none text-sm border-border font-medium capitalize focus:ring-primary/20">
                                <SelectValue placeholder="Seleccione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-none shadow-md">
                              {CONDITION_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="rounded-none cursor-pointer">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="singleItem.status"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado Logístico</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9 shadow-none rounded-none text-sm border-border font-medium focus:ring-primary/20">
                                <SelectValue placeholder="Seleccione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-none shadow-md p-1 gap-1 flex flex-col">
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className={cn("rounded-none cursor-pointer py-2", opt.color)}>
                                  <span className="font-bold">{opt.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="singleItem.notes"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2 space-y-1">
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notas Adicionales</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Incluye cargador y bolso" className="h-9 shadow-none rounded-none text-sm border-border focus-visible:ring-primary/20" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </motion.div>
                ) : (
                  // ─ BATCH MODE (TABLE) ──────────────────────────────────────────────
                  <motion.div
                    key="batch"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="py-4 border-t border-border mt-6 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/20 rounded-md border border-border">
                        <div className="text-[10px] font-black uppercase tracking-widest text-primary shrink-0">
                            Tabla de Unidades ({fields.length})
                        </div>
                        <div className="flex flex-1 items-center gap-4 max-w-sm ml-auto">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Cantidad Total:</span>
                            <Slider 
                                value={[fields.length]} 
                                min={1} max={50} step={1}
                                onValueChange={(vals) => handleQuantityChange(vals[0])}
                                className="flex-1"
                            />
                            <Input 
                              type="number" min={1} max={50} value={fields.length} 
                              onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                              className="h-8 w-16 text-[12px] font-black text-center rounded-sm shadow-none border-border"
                            />
                        </div>
                    </div>

                    <div className="border border-border overflow-visible rounded-sm bg-card">
                        {/* Table Header */}
                        <div className="grid grid-cols-[30px_1fr_120px_100px_120px_40px] gap-2 items-center px-2 py-2 border-b border-border bg-muted/20 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            <span className="text-center">#</span>
                            <span>Nombre</span>
                            <span>Número de Serie</span>
                            <span>Condición</span>
                            <span>Estado</span>
                            <span className="text-center text-transparent">Acc</span>
                        </div>
                        
                        {/* Table Body */}
                        <div className="divide-y divide-border">
                            {fields.map((fieldItem, index) => (
                                <div key={fieldItem.id} className="grid grid-cols-[30px_1fr_120px_100px_120px_40px] gap-2 items-center p-2 hover:bg-muted/10 transition-colors">
                                    <span className="text-[10px] font-bold text-muted-foreground/70 text-center">{index + 1}</span>
                                    
                                    <FormField
                                        control={form.control}
                                        name={`batchItems.${index}.name`}
                                        render={({ field }) => (
                                            <Input placeholder="Ej. Monitor 1" className="h-8 shadow-none rounded-none text-[11px] font-bold border-slate-200" {...field} />
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`batchItems.${index}.serialNumber`}
                                        render={({ field }) => (
                                            <Input placeholder="SN opcional" className="h-8 shadow-none rounded-none text-[11px] font-mono border-slate-200 uppercase" {...field} />
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`batchItems.${index}.condition`}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className="h-8 shadow-none rounded-none text-xs border-slate-200 capitalize w-full px-2">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-none shadow-md min-w-[120px]">
                                                    {CONDITION_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value} className="text-xs rounded-none pointer-events-auto">
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`batchItems.${index}.status`}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className="h-8 shadow-none rounded-none text-[11px] border-slate-200 uppercase font-bold w-full px-2">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-none shadow-md min-w-[140px]">
                                                    {STATUS_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value} className={cn("text-[10px] font-bold uppercase rounded-none pointer-events-auto", opt.color)}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => fields.length > 1 && remove(index)}
                                        disabled={fields.length === 1}
                                        className="h-8 w-8 rounded-none text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Form>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="shrink-0 p-5 border-t border-border bg-muted/20 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
                form.reset();
                onOpenChange(false);
            }}
            className="font-black uppercase tracking-widest text-[10px] h-10 px-6 text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </Button>
          <Button
            form="add-stock-form"
            type="submit"
            disabled={isSubmitting}
            variant="jira"
            className="h-10 px-8 font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-none rounded-md gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSubmitting ? "Guardando..." : "Guardar Unidades"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
