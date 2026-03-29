'use client';

import * as React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, Trash2, Info } from 'lucide-react';

interface ActionConfirmProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'destructive' | 'warning' | 'info';
    isLoading?: boolean;
    error?: string;
}

export function ActionConfirm({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    onCancel,
    confirmText = 'Confirmar',
    cancelText = 'Volver',
    variant = 'info',
    isLoading = false,
    error,
}: ActionConfirmProps) {
    
    const variantStyles = {
        destructive: {
            marker: 'bg-destructive',
            button: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
            icon: <Trash2 className="h-4 w-4 text-destructive" />,
        },
        warning: {
            marker: 'bg-amber-500',
            button: 'bg-amber-500 hover:bg-amber-600 text-white',
            icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
        },
        info: {
            marker: 'bg-primary',
            button: 'bg-primary hover:bg-primary/90 text-primary-foreground',
            icon: <Info className="h-4 w-4 text-primary" />,
        }
    };

    const style = variantStyles[variant];

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className={cn(
                "p-0 gap-0 overflow-hidden border-border shadow-none rounded-sm bg-background max-w-[90vw] sm:max-w-md",
                "animate-in fade-in zoom-in-95 duration-200"
            )}>
                {/* Visual Marker (Top) */}
                <div className={cn("h-1 w-full shrink-0", style.marker)} />
                
                <div className="p-8 sm:p-10">
                    <AlertDialogHeader className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={cn("hidden sm:flex h-8 w-8 rounded-sm items-center justify-center bg-muted/10 border border-border/10")}>
                                {style.icon}
                            </div>
                            <AlertDialogTitle className="text-[14px] font-black uppercase tracking-tight text-foreground leading-tight">
                                {title}
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-[11px] font-medium text-muted-foreground/70 leading-relaxed text-left">
                            {description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {error && (
                        <div className="mt-6 flex items-start gap-3 p-4 rounded-sm bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold leading-relaxed animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <AlertDialogFooter className="mt-10 sm:mt-12 flex-col sm:flex-row gap-3 sm:gap-4">
                        <AlertDialogCancel 
                            onClick={onCancel}
                            disabled={isLoading}
                            className="h-12 flex-1 rounded-sm border-border bg-background hover:bg-muted text-[10px] font-black uppercase tracking-widest transition-all shadow-none m-0"
                        >
                            {cancelText}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                onConfirm();
                            }}
                            disabled={isLoading}
                            className={cn(
                                "h-12 flex-1 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all shadow-none m-0 gap-3",
                                style.button
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                confirmText
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
