"use client";

import { useState, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ResourceTable } from "@/features/inventory/components/resource-table";
import { InventoryHeader } from "@/features/inventory/components/inventory-header";
import { InventoryToolbar } from "@/features/inventory/components/inventory-toolbar";
import { InventoryEmptyState } from "@/features/inventory/components/inventory-empty-state";
import { useResources } from "@/features/inventory/hooks/use-resources";
import { useCategories } from "@/features/inventory/hooks/use-categories";
import { useApiClient } from "@/lib/api-client";
import { useUserRole } from "@/hooks/use-user-role";

// ─── Lazy modals ──────────────────────────────────────────────────────────────

const ResourceWizard = dynamic(
    () => import("@/features/inventory/components/resource-wizard").then(m => m.ResourceWizard),
    { ssr: false }
);
const ConfirmDeleteDialog = dynamic(
    () => import("@/components/molecules/confirm-delete-dialog").then(m => m.ConfirmDeleteDialog),
    { ssr: false }
);
const MaintenanceDialog = dynamic(
    () => import("@/features/inventory/components/maintenance-dialog").then(m => m.MaintenanceDialog),
    { ssr: false }
);
const ResourceDialog = dynamic(
    () => import("@/features/inventory/components/resource-dialog").then(m => m.ResourceDialog),
    { ssr: false }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryResource {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    internalId: string | null;
    status: string | null;
    condition: string | null;
    stock: number | null;
    categoryId: string | null;
    notes: string | null;
    createdAt: Date | null;
    maintenanceProgress?: number;
    maintenanceState?: Record<string, unknown> | null;
}

interface Category {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InventarioClient() {
    const queryClient = useQueryClient();
    const apiClient   = useApiClient();
    const { canManage } = useUserRole();

    // Filters
    const [search,         setSearch]         = useState("");
    const [statusFilter,   setStatusFilter]   = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");

    // Single-resource dialogs
    const [deletingResource,   setDeletingResource]   = useState<InventoryResource | null>(null);
    const [maintenanceResource, setMaintenanceResource] = useState<InventoryResource | null>(null);
    const [editingResource,    setEditingResource]    = useState<InventoryResource | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Multi-selection
    const [selectedIds,       setSelectedIds]       = useState<Set<string>>(new Set());
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
    const [isBulkDeleting,    setIsBulkDeleting]    = useState(false);

    // Data
    const { data: resources = [], isLoading: loadingResources } = useResources({ limit: 100 });
    const { data: categories = [] } = useCategories();

    // ── Mutations ──────────────────────────────────────────────────────────────

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<InventoryResource> & { id: string }) => {
            const { id, ...body } = data;
            return apiClient.put(`/resources/${id}`, body);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            setEditingResource(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/resources/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            setDeletingResource(null);
        },
    });

    // ── Derived data ───────────────────────────────────────────────────────────

    const filteredResources = useMemo(() => {
        const searchLower = search.toLowerCase();

        const filtered = resources.filter((r: InventoryResource) => {
            if (categoryFilter !== "all" && r.categoryId !== categoryFilter) return false;
            if (statusFilter   !== "all" && r.status      !== statusFilter)   return false;
            if (search) {
                const hit = r.name.toLowerCase().includes(searchLower)
                         || r.brand?.toLowerCase().includes(searchLower)
                         || r.internalId?.toLowerCase().includes(searchLower);
                if (!hit) return false;
            }
            return true;
        });

        return [...filtered].sort((a, b) =>
            (a.internalId ?? "").localeCompare(b.internalId ?? "", undefined, { numeric: true, sensitivity: "base" })
        );
    }, [resources, search, statusFilter, categoryFilter]);

    const usedCategories = useMemo(() => {
        const usedIds = new Set(resources.map((r: InventoryResource) => r.categoryId).filter(Boolean));
        return categories.filter((c: Category) => usedIds.has(c.id));
    }, [resources, categories]);

    // ── Selection handlers ─────────────────────────────────────────────────────

    const handleSelect = useCallback((id: string, multi = false) => {
        setSelectedIds(prev => {
            const next  = new Set(prev);
            const index = filteredResources.findIndex(r => r.id === id);

            if (multi && lastSelectedIndex !== null && index !== -1) {
                const start      = Math.min(lastSelectedIndex, index);
                const end        = Math.max(lastSelectedIndex, index);
                const shouldSelect = !prev.has(id);
                for (let i = start; i <= end; i++) {
                    shouldSelect ? next.add(filteredResources[i].id) : next.delete(filteredResources[i].id);
                }
            } else {
                next.has(id) ? next.delete(id) : next.add(id);
            }

            setLastSelectedIndex(index);
            return next;
        });
    }, [filteredResources, lastSelectedIndex]);

    const handleSelectAll = useCallback(() => {
        const availableResources = filteredResources.filter(r => r.status === "disponible");
        
        setSelectedIds(prev =>
            prev.size === availableResources.length && availableResources.length > 0
                ? new Set()
                : new Set(availableResources.map(r => r.id))
        );
        setLastSelectedIndex(null);
    }, [filteredResources]);

    const clearSelection = () => { setSelectedIds(new Set()); };

    // ── Bulk actions ───────────────────────────────────────────────────────────

    const handleBulkDelete = () => setIsBulkDeleting(true);

    const confirmBulkDelete = async () => {
        try {
            await Promise.all(Array.from(selectedIds).map(id => deleteMutation.mutateAsync(id)));
            clearSelection();
            setIsBulkDeleting(false);
        } catch (err) {
            console.error("Error al eliminar recursos en lote:", err);
        }
    };

    // ── Maintenance note helper ────────────────────────────────────────────────

    const buildNote = (resource: InventoryResource, label: string, resolution: string) => {
        const date    = new Date().toLocaleDateString("es-ES");
        const entry   = `[${date}] ${label}: ${resolution}`;
        const current = resource.notes ?? "";
        return current ? `${current}\n${entry}` : entry;
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen space-y-4">
            <InventoryHeader onAddResource={canManage ? () => setIsCreateDialogOpen(true) : undefined} />

            <InventoryToolbar
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                categories={usedCategories}
                resources={resources}
                filteredCount={filteredResources.length}
            />

            {loadingResources ? (
                <div className="bg-card border border-border h-[400px] animate-pulse flex items-center justify-center">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/30 animate-bounce">
                        Sincronizando Base de Datos...
                    </span>
                </div>
            ) : filteredResources.length === 0 ? (
                <InventoryEmptyState
                    search={search}
                    statusFilter={statusFilter}
                    onResetFilters={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); }}
                    onCreateResource={() => setIsCreateDialogOpen(true)}
                />
            ) : (
                <ResourceTable
                    resources={filteredResources}
                    categories={categories}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onSelectAll={handleSelectAll}
                    onEdit={canManage ? setEditingResource : undefined}
                    onDelete={canManage ? setDeletingResource : undefined}
                    onMaintenance={canManage ? setMaintenanceResource : undefined}
                />
            )}

            {/* Wizards & Dialogs */}
            <ResourceWizard
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["resources"] })}
            />

            {deletingResource && (
                <ConfirmDeleteDialog
                    open
                    onOpenChange={open => !open && setDeletingResource(null)}
                    title={`¿Eliminar "${deletingResource.name}"?`}
                    description="Esta acción eliminará permanentemente el recurso del inventario. No se puede deshacer."
                    onConfirm={() => deleteMutation.mutate(deletingResource.id)}
                    isLoading={deleteMutation.isPending}
                />
            )}

            {isBulkDeleting && (
                <ConfirmDeleteDialog
                    open
                    onOpenChange={open => !open && setIsBulkDeleting(false)}
                    title={`¿Eliminar ${selectedIds.size} recursos?`}
                    description="Esta acción eliminará permanentemente los recursos seleccionados. No se puede deshacer."
                    onConfirm={confirmBulkDelete}
                    isLoading={deleteMutation.isPending}
                />
            )}

            {maintenanceResource && (
                <MaintenanceDialog
                    key={maintenanceResource.id}
                    isOpen
                    onClose={() => setMaintenanceResource(null)}
                    resourceName={maintenanceResource.name}
                    resourceId={maintenanceResource.id}
                    initialMaintenanceState={maintenanceResource.maintenanceState as any}
                    onSaveProgress={async ({ resolution, maintenanceProgress, maintenanceState }) => {
                        await updateMutation.mutateAsync({
                            id: maintenanceResource.id,
                            status: "mantenimiento",
                            notes: buildNote(maintenanceResource, "Avance Mantenimiento", resolution),
                            maintenanceProgress,
                            maintenanceState: maintenanceState as Record<string, unknown>,
                        });
                        await queryClient.refetchQueries({ queryKey: ["resources"] });
                        setMaintenanceResource(null);
                        toast.success("Avance guardado correctamente", {
                            description: `El progreso de ${maintenanceResource.name} se ha actualizado.`,
                        });
                    }}
                    onConfirm={async ({ resolution, condition, status }) => {
                        const label = status === "baja" ? "BAJA DEL RECURSO" : "Mantenimiento Finalizado";
                        await updateMutation.mutateAsync({
                            id: maintenanceResource.id,
                            status,
                            condition,
                            notes: buildNote(maintenanceResource, label, resolution),
                            maintenanceProgress: 0,
                            maintenanceState: null,
                        });
                        await queryClient.refetchQueries({ queryKey: ["resources"] });
                        setMaintenanceResource(null);
                        
                        if (status === "baja") {
                            toast.success("Recurso dado de baja", {
                                description: `El recurso ${maintenanceResource.name} ha sido dado de baja.`,
                            });
                        } else {
                            toast.success("Mantenimiento finalizado", {
                                description: `El recurso ${maintenanceResource.name} está nuevamente disponible.`,
                            });
                        }
                    }}
                />
            )}

            {editingResource && (
                <ResourceDialog
                    resource={editingResource as any}
                    categories={categories}
                    loading={updateMutation.isPending}
                    onSave={data => updateMutation.mutate({ ...data, id: editingResource.id })}
                    onClose={() => setEditingResource(null)}
                />
            )}

            {/* ── Floating Action Bar ─────────────────────────────────────── */}
            {selectedIds.size > 0 && canManage && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="bg-card border border-border rounded-lg shadow-xl flex items-center overflow-hidden">
                        <div className="flex items-center gap-4 px-4 py-3">
                            <button
                                onClick={() => { handleBulkDelete(); }}
                                className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors whitespace-nowrap"
                            >
                                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                                Eliminar {selectedIds.size} seleccionados
                            </button>

                            <div className="h-4 w-px bg-border/60" />

                            <button
                                onClick={clearSelection}
                                className="text-xs font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                            >
                                Deseleccionar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
