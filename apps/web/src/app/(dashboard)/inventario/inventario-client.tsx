"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { TemplateTable } from "@/features/inventory/components/template-table";
import { AddStockModal } from "@/features/inventory/components/add-stock-modal";
import { InventoryHeader } from "@/features/inventory/components/inventory-header";
import { useResources, type Resource } from "@/features/inventory/hooks/use-resources";
import { useInventoryAggregation } from "@/features/inventory/hooks/use-inventory-aggregation";
import { useCategories } from "@/features/inventory/hooks/use-categories";
import { useUserRole } from "@/hooks/use-user-role";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { toast } from "sonner";

const ResourceWizard = dynamic(() => import("@/features/inventory/components/resource-wizard").then(m => m.ResourceWizard), { ssr: false });
const ConfirmDeleteDialog = dynamic(() => import("@/components/molecules/confirm-delete-dialog").then(m => m.ConfirmDeleteDialog), { ssr: false });
const ResourceDialog = dynamic(() => import("@/features/inventory/components/resource-dialog").then(m => m.ResourceDialog), { ssr: false });

export default function InventarioClient() {
    const { canManage } = useUserRole();
    const queryClient = useQueryClient();
    const apiClient = useApiClient();
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [addStockParams, setAddStockParams] = useState<{ categoryId: string, templateId: string, templateName: string, templateIcon?: string } | null>(null);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [deletingResource, setDeletingResource] = useState<Resource | null>(null);
    
    // We still load resources to pass down lengths or basic metadata if needed, but the main table consumes templates
    const { data: resources = [], isLoading: loadingResources } = useResources();
    const { data: templates = [], isLoading: loadingTemplates } = useInventoryAggregation();
    const { data: categories = [] } = useCategories();
    
    // Debug: Log resources data
    console.log('[INVENTARIO] Resources:', resources);
    console.log('[INVENTARIO] Loading:', loadingResources);
    console.log('[INVENTARIO] Categories:', categories);
    
    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const { id, ...body } = data;
            return apiClient.put(`/resources/${id}`, body);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            setEditingResource(null);
            toast.success("Recurso actualizado");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/resources/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            queryClient.invalidateQueries({ queryKey: ["inventory-templates-aggregation"] });
            setDeletingResource(null);
            toast.success("Recurso eliminado");
        },
    });

    const filteredTemplates = useMemo(() => {
        const searchLower = search.toLowerCase();
        return templates.filter((t: any) => {
            if (categoryFilter !== "all" && t.categoryId !== categoryFilter) return false;
            if (search) {
                const hit = t.templateName.toLowerCase().includes(searchLower) ||
                            t.categoryName.toLowerCase().includes(searchLower);
                if (!hit) return false;
            }
            return true;
        });
    }, [templates, search, categoryFilter]);
    const usedCategories = useMemo(() => {
        const usedIds = new Set(templates.map((t: any) => t.categoryId).filter(Boolean));
        return categories.filter((c: any) => usedIds.has(c.id));
    }, [templates, categories]);

    return (
        <div className="p-6 sm:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
            <InventoryHeader onAddResource={canManage ? () => setIsCreateDialogOpen(true) : undefined} resources={resources} />
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mt-8 mb-6 border-b border-border/30 pb-4">
                <div className="relative w-full sm:w-[360px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                    <Input 
                        placeholder="Buscar recursos..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="h-10 pl-9 w-full bg-white border-border rounded-md text-[13px] shadow-none focus-visible:ring-primary/20" 
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-10 w-[180px] bg-white border-border rounded-md text-[11px] font-black uppercase tracking-widest shadow-none focus:ring-primary/20">
                            <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent className="border-border shadow-none">
                            <SelectItem value="all" className="text-[11px] font-black uppercase tracking-widest cursor-pointer">Todas las categorías</SelectItem>
                            {usedCategories.map((cat) => (<SelectItem key={cat.id} value={cat.id} className="text-[11px] font-black uppercase tracking-widest cursor-pointer">{cat.name}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 w-[160px] bg-white border-border rounded-md text-[11px] font-black uppercase tracking-widest shadow-none focus:ring-primary/20">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent className="border-border shadow-none">
                            <SelectItem value="all" className="text-[11px] font-black uppercase tracking-widest cursor-pointer">Todos los estados</SelectItem>
                            <SelectItem value="disponible" className="text-[11px] font-black uppercase tracking-widest cursor-pointer">Disponible</SelectItem>
                            <SelectItem value="prestado" className="text-[11px] font-black uppercase tracking-widest cursor-pointer">Prestado</SelectItem>
                            <SelectItem value="mantenimiento" className="text-[11px] font-black uppercase tracking-widest cursor-pointer">Mantenimiento</SelectItem>
                            <SelectItem value="baja" className="text-[11px] font-black uppercase tracking-widest cursor-pointer">Baja</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="ghost" className="h-10 px-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
                        <Filter className="w-3.5 h-3.5 mr-2 opacity-40" />
                        Más Filtros
                    </Button>
                </div>
            </div>
            {loadingTemplates ? (
                <div className="bg-white border border-border h-[400px] flex items-center justify-center">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/30 animate-pulse">Cargando catálogo...</span>
                </div>
            ) : (
                <TemplateTable
                    items={filteredTemplates}
                    rawResources={resources}
                    categories={categories}
                    onAddStock={(template) => {
                        setAddStockParams({
                            categoryId: template.categoryId,
                            templateId: template.templateId,
                            templateName: template.templateName,
                            templateIcon: template.templateIcon || template.categoryIcon || undefined
                        });
                    }}
                    onEditResource={setEditingResource}
                    onDeleteResource={setDeletingResource}
                />
            )}
            
            <ResourceWizard 
                open={isCreateDialogOpen} 
                onOpenChange={setIsCreateDialogOpen} 
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-templates-aggregation"] });
                    queryClient.invalidateQueries({ queryKey: ["resources"] });
                }} 
            />



            {addStockParams && (
                <AddStockModal
                    open={!!addStockParams}
                    onOpenChange={(open) => !open && setAddStockParams(null)}
                    categoryId={addStockParams.categoryId}
                    templateId={addStockParams.templateId}
                    templateName={addStockParams.templateName}
                    templateIcon={addStockParams.templateIcon}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["resources"] });
                        queryClient.invalidateQueries({ queryKey: ["inventory-templates-aggregation"] });
                        setAddStockParams(null);
                        
                        // Opcionalmente, aquí podríamos abrir el Drawer ahora que sí tiene stock,
                        // para que el usuario fluya naturalmente. Pero por ahora, volver a la tabla es limpio.
                    }}
                />
            )}

            {editingResource && (<ResourceDialog resource={editingResource} categories={categories} loading={updateMutation.isPending} onSave={(data) => updateMutation.mutate({ ...data, id: editingResource.id })} onClose={() => setEditingResource(null)} />)}
            {deletingResource && (<ConfirmDeleteDialog open onOpenChange={(open) => !open && setDeletingResource(null)} title={`¿Eliminar "${deletingResource.name}"?`} description="Esta acción eliminará permanentemente el recurso del inventario. No se puede deshacer." onConfirm={() => deleteMutation.mutate(deletingResource.id)} isLoading={deleteMutation.isPending} />)}
        </div>
    );
}
