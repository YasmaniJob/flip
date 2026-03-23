"use client";

import { Button } from "@/components/ui/button";
import { Plus, Upload, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderAction {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: "default" | "outline";
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    primaryAction?: PageHeaderAction;
    secondaryActions?: PageHeaderAction[];
    className?: string;
}

export function PageHeader({
    title,
    subtitle,
    primaryAction,
    secondaryActions = [],
    className
}: PageHeaderProps) {
    return (
        <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-foreground">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
            
            {(primaryAction || secondaryActions.length > 0) && (
                <div className="flex items-center gap-2 shrink-0">
                    {secondaryActions.map((action, index) => {
                        const Icon = action.icon || Upload;
                        return (
                            <Button
                                key={index}
                                variant={action.variant || "outline"}
                                onClick={action.onClick}
                            >
                                <Icon className="h-3.5 w-3.5 mr-2" />
                                {action.label}
                            </Button>
                        );
                    })}
                    
                    {primaryAction && (
                        <Button
                            variant={primaryAction.variant || "default"}
                            onClick={primaryAction.onClick}
                        >
                            {primaryAction.icon ? (
                                <primaryAction.icon className="h-3.5 w-3.5 mr-2" />
                            ) : (
                                <Plus className="h-3.5 w-3.5 mr-2" />
                            )}
                            {primaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </header>
    );
}
