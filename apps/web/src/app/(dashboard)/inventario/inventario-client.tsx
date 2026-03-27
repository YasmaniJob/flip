"use client";

import { useState, useMemo, useDeferredValue, lazy, Suspense, memo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { TemplateTable } from "@/features/inventory/components/template-table";
import { InventoryHeader } from "@/features/inventory/components/inventory-header";
import { useResources, type Resource } from "@/features/inventory/hooks/use-resources";
import { useInventoryAggregation } from "@/features/inventory/hooks/use-inventory-aggregation";
import { useCategories } from "@/features/inventory/hooks/use-categories";
import { useUserRole } from "@/hooks/use-user-role";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { toast } from "sonner";

// Lazy load dialogs and modals
const ResourceWizard = lazy(() => import("@/features/inventory/components/resource-wizard").then(m => ({ default: m.ResourceWizard })));
const ConfirmDeleteDialog = lazy(() => import("@/components/molecules/confirm-delete-dialog").then(m => ({ default: m.ConfirmDeleteDialog })));
const ResourceDialog = lazy(() => import("@/features/inventory/components/resource-dialog").then(m => ({ default: m.ResourceDialog })));
const AddStockModal = lazy(() => import("@/features/inventory/components/add-stock-modal").then(m => ({ default: m.AddStockModal })));

// Loading skeleton component
const TableSkeleton = memo(() => (
    <div className="bg-card border border-border h-[400px] flex items-center justify-center">
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/30 animate-pulse">
            Cargando catálogo...
        </span>
    </div>
));
TableSkeleton.displayName = "TableSkeleton";

export default function InventarioClient() {
    const { canManage } = useUserRole();
    const queryClient = useQueryClient();
    const apiClient = useApiClient();
    
    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [addStockParams, setAddStockParams] = useState<{ categoryId: string, templateId: string, templateName: string, templateIcon?: string } | null>(null);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [deletingResource, setDeletingResource] = useState<Resource | null>(null);
    const [deletingTemplate, setDeletingTemplate] = useState<{ id: string; name: string } | null>(null);
    
    const { data: resources = [] } = useResources();
    const { data: templates = [], isLoading: loadingTemplates } = useInventoryAggregation();
    const { data: categories = [] } = useCategories();
    const deleteTemplateMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/resource-templates/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory-templates-aggregation"] });
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            setDeletingTemplate(null);
            toast.success("Categoría eliminada correctamente");
        },
        onError: () => {
            toast.error("No se pudo eliminar la categoría. Puede que tenga recursos asociados.");
        }
    });
    
    useEffect(() => {
        const handleCenterButtonClick = () => {
            setIsCreateDialogOpen(true);
        };
        window.addEventListener('mobile-center-button-click', handleCenterButtonClick);
        return () => window.removeEventListener('mobile-center-button-click', handleCenterButtonClick);
    }, []);
    
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
        const searchLower = deferredSearch.toLowerCase();
        return templates.filter((t: any) => {
            if (categoryFilter !== "all" && t.categoryId !== categoryFilter) return false;
            
            // Apply status filter from Summary Cards
            if (statusFilter === "disponible" && t.available === 0) return false;
            if (statusFilter === "prestado" && t.borrowed === 0) return false;
            if (statusFilter === "mantenimiento" && t.maintenance === 0) return false;
            if (statusFilter === "baja" && t.retired === 0) return false;

            if (deferredSearch) {
                const hit = t.templateName.toLowerCase().includes(searchLower) ||
                            t.categoryName.toLowerCase().includes(searchLower);
                if (!hit) return false;
            }
            return true;
        });
    }, [templates, deferredSearch, categoryFilter, statusFilter]);
    
    const usedCategories = useMemo(() => {
        const usedIds = new Set(templates.map((t: any) => t.categoryId).filter(Boolean));
        return categories.filter((c: any) => usedIds.has(c.id));
    }, [templates, categories]);

    return (
        <div className="p-4 sm:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
            {/* Page Header - Desktop Only (Duplicated by NotionTopbar on Mobile) */}
            <div className="hidden lg:flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">Inventario</h1>
                </div>
                
                {/* Actions - Desktop */}
                <div className="flex items-center gap-3">
                    {canManage && (
                        <Button 
                            variant="jira" 
                            onClick={() => setIsCreateDialogOpen(true)} 
                            className="h-9 px-6 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-none"
                        >
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Nuevo Recurso
                        </Button>
                    )}
                </div>
            </div>

            <InventoryHeader resources={resources} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />
            
            <div className="flex flex-row items-center gap-2 mt-0 md:mt-8 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                    <Input 
                        placeholder="Buscar..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="h-10 pl-9 w-full bg-background border-border rounded-md text-[12px] shadow-none focus-visible:ring-primary/20 font-black placeholder:text-muted-foreground/30" 
                    />
                </div>
                
                <div className="shrink-0">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-10 w-[140px] sm:w-[220px] bg-card border-border rounded-md text-[10px] font-black uppercase tracking-widest shadow-none focus:ring-primary/20">
                            <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent className="border-border shadow-none">
                            <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Todas</SelectItem>
                            {usedCategories.map((cat) => (<SelectItem key={cat.id} value={cat.id} className="text-[10px] font-black uppercase tracking-widest cursor-pointer">{cat.name}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {loadingTemplates ? (
                <TableSkeleton />
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
                    onDeleteTemplate={(template) => setDeletingTemplate({ id: template.templateId, name: template.templateName })}
                />
            )}
            
            {/* Lazy loaded dialogs */}
            <Suspense fallback={null}>
                {isCreateDialogOpen && (
                    <ResourceWizard 
                        open={isCreateDialogOpen} 
                        onOpenChange={setIsCreateDialogOpen} 
                        onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ["inventory-templates-aggregation"] });
                            queryClient.invalidateQueries({ queryKey: ["resources"] });
                        }} 
                    />
                )}

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
                        }}
                    />
                )}

                {editingResource && (
                    <ResourceDialog 
                        resource={editingResource} 
                        categories={categories} 
                        loading={updateMutation.isPending} 
                        onSave={(data) => updateMutation.mutate({ ...data, id: editingResource.id })} 
                        onClose={() => setEditingResource(null)} 
                    />
                )}
                
                {deletingResource && (
                    <ConfirmDeleteDialog 
                        open 
                        onOpenChange={(open) => !open && setDeletingResource(null)} 
                        title={`¿Eliminar "${deletingResource.name}"?`} 
                        description="Esta acción eliminará permanentemente el recurso del inventario. No se puede deshacer." 
                        onConfirm={() => deleteMutation.mutate(deletingResource.id)} 
                        isLoading={deleteMutation.isPending} 
                    />
                )}

                {deletingTemplate && (
                    <ConfirmDeleteDialog 
                        open 
                        onOpenChange={(open) => !open && setDeletingTemplate(null)} 
                        title={`¿Eliminar la categoría "${deletingTemplate.name}"?`} 
                        description="Esta acción eliminará la categoría. Solo se puede eliminar si no tiene unidades en stock asociadas." 
                        onConfirm={() => deleteTemplateMutation.mutate(deletingTemplate.id)} 
                        isLoading={deleteTemplateMutation.isPending} 
                    />
                )}
            </Suspense>
        </div>
    );
}
