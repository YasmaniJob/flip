"use client";

import { useState } from "react";
import { motion } from "framer-motion"; // Removed AnimatePresence
import { X, Plus, Package, FileText } from "lucide-react";

import { useResources } from "@/features/inventory/hooks/use-resources";
import { InventoryTemplateAggregation } from "@/features/inventory/hooks/use-inventory-aggregation";
import { InventoryTable } from "@/features/inventory/components/inventory-table";
import { AddStockModal } from "@/features/inventory/components/add-stock-modal";
import { Button } from "@/components/ui/button";

interface TemplateDrawerProps {
    template: InventoryTemplateAggregation;
    onClose: () => void;
    categories: any[];
    onEdit?: (resource: any) => void;
    onDelete?: (resource: any) => void;
    onMaintenance?: (resource: any) => void;
    onArchive?: (resource: any) => void;
    onRestore?: (resource: any) => void;
}

export function TemplateDrawer({
    template,
    onClose,
    categories,
    onEdit,
    onDelete,
    onArchive,
    onRestore
}: TemplateDrawerProps) {
    const [isAddStockOpen, setIsAddStockOpen] = useState(false);

    // Fetch resources specific to this template
    const { data: resources = [], isLoading } = useResources({ 
        limit: 500, // Fetch enough to cover the template size
        // The API might need an update to support templateId filtering, 
        // but for now we filter client-side if the API doesn't support it yet
    });

    // Client-side filter to only show resources for this template
    const templateResources = resources.filter((r: any) => r.templateId === template.templateId);

    // Handle mapping logic for InventoryTable
    const tableItems = templateResources.map((r: any) => ({
        id: r.id,
        internalId: r.internalId || null,
        name: r.name,
        brand: r.brand || null,
        categoryName: categories.find((c: any) => c.id === r.categoryId)?.name || "Sin Categoría",
        status: r.status,
        serialNumber: r.serialNumber || null,
        model: r.model || null,
    }));

    return (
        <> {/* Replaced AnimatePresence with a fragment as the parent handles conditional rendering */}
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
                initial={{ x: "100%", boxShadow: "-10px 0 30px rgba(0,0,0,0)" }}
                animate={{ x: 0, boxShadow: "-10px 0 30px rgba(0,0,0,0.1)" }}
                exit={{ x: "100%", boxShadow: "-10px 0 30px rgba(0,0,0,0)" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-50 w-full md:w-[85vw] lg:w-[75vw] xl:w-[65vw] max-w-6xl bg-card border-l border-border flex flex-col shadow-2xl"
            >
                {/* ── Header ────────────────────────────────────────────────── */}
                <div className="shrink-0 px-6 py-5 border-b border-border bg-muted/20 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-card border border-border shadow-sm flex items-center justify-center text-2xl shrink-0">
                            {template.templateIcon || template.categoryIcon || '📦'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span 
                                    className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border" 
                                    style={{ 
                                        color: template.categoryColor || '#64748b', 
                                        backgroundColor: `${template.categoryColor}15`,
                                        borderColor: `${template.categoryColor}30`
                                    }}
                                >
                                    {template.categoryName}
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-foreground tracking-tight leading-none">
                                {template.templateName}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Quick Stats */}
                        <div className="hidden sm:flex items-center gap-4 mr-4 text-xs font-bold text-muted-foreground">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] uppercase tracking-widest opacity-60">Total Unidades</span>
                                <span className="text-lg text-foreground leading-none">{template.totalStock}</span>
                            </div>
                            <div className="h-8 w-px bg-border" />
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] uppercase tracking-widest opacity-60">Disponibles</span>
                                <span className="text-lg text-emerald-600 leading-none">{template.available}</span>
                            </div>
                        </div>

                        <Button 
                            onClick={() => setIsAddStockOpen(true)}
                            className="h-10 px-4 font-black uppercase tracking-widest text-[11px] gap-2 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Añadir Unidades
                        </Button>

                        <button 
                            onClick={onClose}
                            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted/50 text-muted-foreground transition-colors ml-2"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* ── Content ───────────────────────────────────────────────── */}
                <div className="flex-1 overflow-hidden flex flex-col bg-card">
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 gap-4">
                            <Package className="w-12 h-12 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-widest animate-bounce">
                                Cargando unidades...
                            </span>
                        </div>
                    ) : templateResources.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 bg-muted/20 border border-border rounded-full flex items-center justify-center mb-6">
                                <FileText className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-lg font-black text-foreground mb-2">No hay unidades registradas</h3>
                            <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
                                Esta subcategoría está activa pero aún no tiene ítems físicos asociados. Registra la primera unidad para comenzar a gestionar el stock.
                            </p>
                            <Button 
                                onClick={() => setIsAddStockOpen(true)}
                                variant="outline"
                                className="h-11 px-6 font-black uppercase tracking-widest text-[11px] shadow-sm border-slate-200"
                            >
                                Añadir Primera Unidad
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto custom-scrollbar p-6">
                            {/* Mapped array and standard InventoryTable */}
                            <InventoryTable
                                items={tableItems}
                                onEdit={onEdit ? (item) => onEdit(templateResources.find((r: any) => r.id === item.id)) : undefined}
                                onDelete={onDelete ? (item) => onDelete(templateResources.find((r: any) => r.id === item.id)) : undefined}
                                onArchive={onArchive ? (item) => onArchive(templateResources.find((r: any) => r.id === item.id)) : undefined}
                                onRestore={onRestore ? (item) => onRestore(templateResources.find((r: any) => r.id === item.id)) : undefined}
                            />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Modal para añadir stock a esta plantilla específica */}
            <AddStockModal 
                open={isAddStockOpen} 
                onOpenChange={setIsAddStockOpen}
                categoryId={template.categoryId}
                templateId={template.templateId}
                templateName={template.templateName}
                templateIcon={template.templateIcon || template.categoryIcon}
            />
        </>
    );
}
