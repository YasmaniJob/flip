"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryHeaderProps {
    onAddResource?: () => void;
}

export function InventoryHeader({ onAddResource }: InventoryHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-foreground">Inventario</h1>
            </div>
            <div className="flex items-center gap-2">
                {onAddResource && (
                    <Button
                        onClick={onAddResource}
                        variant="jira"
                        size="sm"
                        className="h-9 px-4 font-black uppercase tracking-widest text-[11px]"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Recurso
                    </Button>
                )}
            </div>
        </div>
    );
}
