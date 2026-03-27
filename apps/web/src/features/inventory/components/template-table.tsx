"use client";

import React, { useState } from "react";
import { type InventoryTemplateAggregation } from "../hooks/use-inventory-aggregation";
import { InventoryTable } from "@/features/inventory/components/inventory-table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateTableProps {
    items: InventoryTemplateAggregation[];
    rawResources?: any[];
    categories?: any[];
    onAddStock: (template: InventoryTemplateAggregation) => void;
    onEditResource?: (resource: any) => void;
    onDeleteResource?: (resource: any) => void;
    onDeleteTemplate?: (template: InventoryTemplateAggregation) => void;
}

export function TemplateTable({ 
    items, 
    rawResources = [], 
    categories = [],
    onAddStock,
    onEditResource,
    onDeleteResource,
    onDeleteTemplate
}: TemplateTableProps) {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const toggleRow = (templateId: string, e: React.MouseEvent) => {
        // Ignorar clics en botones
        if ((e.target as HTMLElement).closest('button')) return;
        setExpandedRow(prev => prev === templateId ? null : templateId);
    };

    return (
        <div className="bg-transparent md:bg-card md:border md:border-border rounded-lg mt-6 mb-8 shadow-none transition-all">
            {/* Mobile View: Cards */}
            <div className="flex flex-col gap-3 md:hidden px-1">
                {items.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-12 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        No hay recursos registrados
                    </div>
                ) : (
                    items.map((item) => (
                        <div 
                            key={item.templateId}
                            className="bg-card border border-border rounded-lg p-4 flex flex-col gap-4 shadow-none active:scale-[0.98] transition-all"
                            onClick={(e) => toggleRow(item.templateId, e)}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-md bg-muted/10 border border-border flex items-center justify-center text-xl shrink-0">
                                        {item.templateIcon || '📦'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-black text-foreground uppercase tracking-tight truncate">
                                            {item.templateName}
                                        </p>
                                        <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                                            {item.categoryName}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button 
                                        variant="jiraOutline" 
                                        className="h-8 px-3 text-[9px] font-black uppercase tracking-[0.1em] border shadow-none shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddStock(item);
                                        }}
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Añadir
                                    </Button>
                                    {onDeleteTemplate && (
                                        <Button
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 border-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteTemplate(item);
                                            }}
                                            title="Eliminar registro"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
                                <div className="space-y-0.5">
                                    <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest block">En Stock</span>
                                    <p className="text-xs font-black text-foreground tabular-nums">{item.available}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest block">Prestados</span>
                                    <p className="text-xs font-black text-foreground tabular-nums">{item.borrowed}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop View: Wide Horizontal Cards */}
            <div className="hidden md:flex flex-col gap-3">
                {items.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-12 text-center text-xs font-black uppercase tracking-widest text-muted-foreground/40">
                        No hay recursos registrados
                    </div>
                ) : (
                    items.map((item) => {
                        const isExpanded = expandedRow === item.templateId;
                        
                        // Filtrar recursos crudos para este template
                        const templateResources = rawResources.filter(r => r.templateId === item.templateId);
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

                        const total = item.totalStock;
                        const availablePercent = total > 0 ? (item.available / total) * 100 : 0;
                        const borrowedPercent = total > 0 ? (item.borrowed / total) * 100 : 0;
                        const maintenancePercent = total > 0 ? (item.maintenance / total) * 100 : 0;
                        const retiredPercent = total > 0 ? (item.retired / total) * 100 : 0;

                        return (
                            <React.Fragment key={item.templateId}>
                                <div 
                                    onClick={(e) => toggleRow(item.templateId, e)}
                                    className={cn(
                                        "bg-card border rounded-lg transition-colors cursor-pointer group hover:border-primary/50 hover:bg-muted/5 flex flex-col overflow-hidden shadow-none",
                                        isExpanded ? "border-primary/50 bg-muted/5" : "border-border"
                                    )}
                                >
                                    <div className="flex items-center gap-6 p-5">
                                        
                                        {/* Left Side: Identity */}
                                        <div className="flex items-center gap-4 min-w-[280px] shrink-0">
                                            <div className="w-12 h-12 rounded-md bg-muted/20 border border-border flex items-center justify-center text-2xl shrink-0 transition-colors">
                                                {item.templateIcon || '📦'}
                                            </div>
                                            <div className="flex flex-col justify-center min-w-0">
                                                <h3 className="text-sm font-black text-foreground uppercase tracking-tight truncate">
                                                    {item.templateName}
                                                </h3>
                                                <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mt-0.5 truncate">
                                                    {item.categoryName}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Center: Metrics & Progress */}
                                        <div className="flex-1 flex items-center gap-6 px-4 border-l border-border">
                                            {/* Big Number */}
                                            <span className="text-3xl font-black text-foreground tracking-tighter tabular-nums leading-none shrink-0 w-16 text-right">
                                                {total}
                                            </span>
                                            
                                            {/* Bar & Status Dots */}
                                            <div className="flex flex-col justify-center flex-1 gap-2.5">
                                                {/* Progress Bar */}
                                                <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden flex gap-0.5 shadow-none border border-black/5 dark:border-white/5">
                                                    <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${availablePercent}%` }} />
                                                    <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${borrowedPercent}%` }} />
                                                    <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: `${maintenancePercent}%` }} />
                                                    <div className="h-full bg-rose-500 transition-all duration-700" style={{ width: `${retiredPercent}%` }} />
                                                </div>

                                                {/* Status Legend */}
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-0.5">Disp: <span className="text-foreground">{item.available}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-0.5">Pres: <span className="text-foreground">{item.borrowed}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-0.5">Mant: <span className="text-foreground">{item.maintenance}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-0.5">Baja: <span className="text-foreground">{item.retired}</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Actions */}
                                        <div className="flex items-center justify-end gap-2 shrink-0 min-w-[140px] border-l border-border pl-6">
                                            <Button 
                                                variant="jira" 
                                                className="h-9 px-4 text-[10px] font-black uppercase tracking-[0.1em] shadow-none"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddStock(item);
                                                }}
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={3} />
                                                Añadir
                                            </Button>
                                            {onDeleteTemplate && (
                                                <Button
                                                    variant="ghost"
                                                    className="h-9 w-9 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteTemplate(item);
                                                    }}
                                                    title="Eliminar registro"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Detail View */}
                                    {isExpanded && (
                                        <div className="border-t border-border bg-muted/10">
                                            <div className="p-4 sm:p-6 pt-5 animate-in slide-in-from-top-2 duration-300">
                                                <div className="bg-card border border-border rounded-lg shadow-none overflow-hidden">
                                                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/5">
                                                        <div className="space-y-0.5">
                                                            <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">Unidades Registradas</h3>
                                                            <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Gestión de stock individual.</p>
                                                        </div>
                                                        <Button 
                                                            variant="jiraOutline"
                                                            size="sm"
                                                            className="h-8 px-4 text-[9px] font-black uppercase tracking-widest shadow-none"
                                                            onClick={() => onAddStock(item)}
                                                        >
                                                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                                                            Nueva Unidad
                                                        </Button>
                                                    </div>
                                                    <div className="p-0">
                                                        <InventoryTable 
                                                            items={tableItems}
                                                            onEdit={onEditResource ? (i) => onEditResource(templateResources.find(r => r.id === i.id)) : undefined}
                                                            onDelete={onDeleteResource ? (i) => onDeleteResource(templateResources.find(r => r.id === i.id)) : undefined}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
            </div>
        </div>
    );
}
