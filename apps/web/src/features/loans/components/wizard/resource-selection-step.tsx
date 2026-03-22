"use client";

import { Package, Check, Plus } from "lucide-react";
import { Resource } from "../../types";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { formatResourceId } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ResourceSelectionStepProps {
    cart: Resource[];
    onAdd: (resource: Resource) => void;
    onRemove: (id: string) => void;
    selectedCategoryId: string | null;
    searchQuery?: string;
}

const statusConfig = {
    disponible: { border: "border-emerald-500/20", dot: "bg-emerald-500", text: "text-emerald-600", label: "Disponible" },
    prestado: { border: "border-amber-500/20", dot: "bg-amber-500", text: "text-amber-600", label: "Prestado" },
    mantenimiento: { border: "border-red-500/20", dot: "bg-red-500", text: "text-red-600", label: "Mant." },
} as const;

type ResourceStatus = keyof typeof statusConfig;

export function ResourceSelectionStep({ cart, onAdd, onRemove, selectedCategoryId, searchQuery }: ResourceSelectionStepProps) {
    const api = useApiClient();

    const { data: resources, isLoading } = useQuery({
        queryKey: ['available-resources', searchQuery, selectedCategoryId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (selectedCategoryId) params.append('categoryId', selectedCategoryId);
            const response = await api.get<any>(`/resources?${params.toString()}`);
            return Array.isArray(response) ? response : (response.data || []);
        },
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });

    const isInCart = (id: string) => cart.some(r => r.id === id);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-24 rounded-md border border-border bg-muted/5 animate-pulse" />
                ))}
            </div>
        );
    }

    if (!resources?.length) {
        return (
            <div className="py-24 text-center">
                <div className="inline-block p-4 rounded-full bg-muted/10 mb-4">
                    <Package className="h-8 w-8 text-muted-foreground opacity-20" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No se encontraron recursos disponibles</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {resources.map((resource: Resource) => {
                const added = isInCart(resource.id);
                const isAvailable = resource.status === 'disponible';
                const rawId = formatResourceId(resource.internalId);
                const displayId = rawId ? `#${rawId}` : null;
                const status = (resource.status ?? 'disponible') as ResourceStatus;
                const cfg = statusConfig[status] ?? statusConfig.disponible;

                return (
                    <div
                        key={resource.id}
                        onClick={() => {
                            if (!isAvailable) return;
                            added ? onRemove(resource.id) : onAdd(resource);
                        }}
                        className={cn(
                            "group relative flex items-center gap-4 p-4 rounded-md border transition-all duration-200 shadow-none",
                            isAvailable
                                ? added
                                    ? "bg-primary/5 border-primary/20"
                                    : "bg-background border-border hover:border-muted-foreground/30 cursor-pointer"
                                : "bg-muted/10 border-border opacity-50 cursor-not-allowed"
                        )}
                    >
                        {/* Technical Tag / ID */}
                        <div className={cn(
                            "absolute top-0 right-4 -translate-y-1/2 px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase border transition-colors",
                            added ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"
                        )}>
                            {displayId || 'TEMP'}
                        </div>

                        {/* Status Icon */}
                        <div className={cn(
                            "w-10 h-10 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 border",
                            added ? "bg-primary text-primary-foreground border-primary" : "bg-muted/20 text-muted-foreground border-border",
                            !isAvailable && "grayscale"
                        )}>
                            {added ? <Check className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                        </div>

                        {/* Resource Content */}
                        <div className="flex-1 min-w-0">
                            <h4 className={cn(
                                "text-[11px] font-black tracking-tight leading-tight transition-colors uppercase",
                                added ? "text-primary" : "text-foreground"
                            )}>
                                {resource.name}
                            </h4>

                            <div className="flex items-center gap-2 mt-2">
                                <span className={cn(
                                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm border",
                                    cfg.border,
                                    cfg.text
                                )}>
                                    {cfg.label}
                                </span>
                                {(resource.brand || resource.model) && (
                                    <p className="text-[8px] text-muted-foreground font-bold truncate uppercase tracking-widest opacity-60">
                                        {[resource.brand, resource.model].filter(Boolean).join(' • ')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="shrink-0 ml-2">
                            {isAvailable ? (
                                <div className={cn(
                                    "w-8 h-8 rounded-md flex items-center justify-center transition-all border",
                                    added
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground border-border group-hover:border-muted-foreground group-hover:text-foreground"
                                )}>
                                    {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </div>
                            ) : (
                                <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest border border-border px-2 py-1 rounded-sm bg-muted/10">
                                    N/A
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
