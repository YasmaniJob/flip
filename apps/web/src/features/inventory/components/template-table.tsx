"use client";

import React, { useState } from "react";
import { type InventoryTemplateAggregation } from "../hooks/use-inventory-aggregation";
import { InventoryTable } from "@/features/inventory/components/inventory-table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
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

const TH_CLASS = "px-6 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40";

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
                        No hay plantillas registradas
                    </div>
                ) : (
                    items.map((item) => (
                        <div 
                            key={item.templateId}
                            className="bg-white border border-border rounded-lg p-4 flex flex-col gap-4 shadow-none active:scale-[0.98] transition-all"
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
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteTemplate(item);
                                            }}
                                            title="Eliminar plantilla"
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

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-muted/5 border-b border-border">
                            <th className="px-6 py-4 w-[40px]">
                                {/* Empty space for chevron */}
                            </th>
                            <th className={TH_CLASS}>Nombre de Plantilla</th>
                            <th className={TH_CLASS}>Categoría</th>
                            <th className={TH_CLASS}>Prestados</th>
                            <th className={TH_CLASS}>En Stock</th>
                            <th className={TH_CLASS}>Estado</th>
                            <th className="px-6 py-4 text-right text-[13px] font-semibold text-muted-foreground capitalize">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
                                        No hay plantillas registradas
                                    </p>
                                </td>
                            </tr>
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

                                return (
                                    <React.Fragment key={item.templateId}>
                                        <tr
                                            onClick={(e) => toggleRow(item.templateId, e)}
                                            className={cn(
                                                "group hover:bg-muted/[0.03] cursor-pointer transition-colors border-b border-border last:border-0",
                                                isExpanded ? "bg-muted/[0.05]" : ""
                                            )}
                                        >
                                            <td className="px-6 py-4 text-muted-foreground/70 group-hover:text-foreground transition-colors">
                                                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                            </td>

                                            {/* Nombre de Plantilla */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center text-xl shrink-0">
                                                        {item.templateIcon || '📦'}
                                                    </div>
                                                    <p className="text-[13px] font-black text-foreground uppercase tracking-tight">
                                                        {item.templateName}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Categoría */}
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                    {item.categoryName}
                                                </span>
                                            </td>

                                            {/* Prestados */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-foreground tabular-nums">
                                                    {item.borrowed}
                                                </span>
                                            </td>

                                            {/* En Stock (Total - Prestados) */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-foreground tabular-nums">
                                                    {item.available}
                                                </span>
                                            </td>

                                            {/* Estado */}
                                            <td className="px-6 py-4">
                                                {item.available > 0 ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm border border-emerald-100 bg-emerald-50/30 text-emerald-700 text-[9px] font-black uppercase tracking-widest">
                                                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                                        En stock
                                                    </div>
                                                ) : item.totalStock > 0 && item.available === 0 ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm border border-rose-100 bg-rose-50/30 text-rose-700 text-[9px] font-black uppercase tracking-widest">
                                                        <div className="w-1 h-1 rounded-full bg-rose-500"></div>
                                                        Sin stock
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm border border-border bg-muted/20 text-muted-foreground text-[9px] font-black uppercase tracking-widest">
                                                        <div className="w-1 h-1 rounded-full bg-muted-foreground/50"></div>
                                                        Vacío
                                                    </div>
                                                )}
                                            </td>

                                            {/* Acción */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button 
                                                        variant="jiraOutline" 
                                                        className="h-8 px-4 text-[9px] font-black uppercase tracking-[0.1em] border shadow-none"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAddStock(item);
                                                        }}
                                                    >
                                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                                        Añadir
                                                    </Button>
                                                    {onDeleteTemplate && (
                                                        <Button
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteTemplate(item);
                                                            }}
                                                            title="Eliminar plantilla"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="border-b border-border bg-muted/5">
                                                <td colSpan={7} className="p-0">
                                                    <div className="px-10 py-6 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="bg-card border border-border rounded-lg shadow-none">
                                                            <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-muted/5">
                                                                <div className="space-y-1">
                                                                    <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">Unidades Físicas</h3>
                                                                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Gestión del stock específico.</p>
                                                                </div>
                                                                <Button 
                                                                    variant="jira"
                                                                    size="sm"
                                                                    className="h-9 px-6 text-[9px] font-black uppercase tracking-widest shadow-none"
                                                                    onClick={() => onAddStock(item)}
                                                                >
                                                                    <Plus className="w-3.5 h-3.5 mr-2" />
                                                                    Añadir Unidades
                                                                </Button>
                                                            </div>
                                                            <div className="p-4">
                                                                <InventoryTable 
                                                                    items={tableItems}
                                                                    onEdit={onEditResource ? (i) => onEditResource(templateResources.find(r => r.id === i.id)) : undefined}
                                                                    onDelete={onDeleteResource ? (i) => onDeleteResource(templateResources.find(r => r.id === i.id)) : undefined}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
