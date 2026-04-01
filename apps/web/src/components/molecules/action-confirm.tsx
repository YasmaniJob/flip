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
import { Button } from '@/components/ui/button';

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
            button: 'destructive' as const,
            icon: <Trash2 className="h-4 w-4 text-destructive" />,
            iconBg: 'bg-destructive/10',
            iconBorder: 'border-destructive/20'
        },
        warning: {
            button: 'default' as const, // We don't have a specific amber jira button yet, using default
            icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
            iconBg: 'bg-amber-500/10',
            iconBorder: 'border-amber-500/20'
        },
        info: {
            button: 'jira' as const,
            icon: <Info className="h-4 w-4 text-[#0052cc]" />,
            iconBg: 'bg-[#0052cc]/5',
            iconBorder: 'border-[#0052cc]/10'
        }
    };

    const style = variantStyles[variant];

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className={cn(
                "p-0 gap-0 overflow-hidden border border-border shadow-none rounded-md bg-background max-w-[95vw] sm:max-w-md",
                "animate-in fade-in zoom-in-95 duration-200"
            )}>
                <div className="p-8 sm:p-10">
                    <AlertDialogHeader className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors",
                                style.iconBg,
                                style.iconBorder
                            )}>
                                {style.icon}
                            </div>
                            <AlertDialogTitle className="text-lg font-bold text-foreground leading-tight tracking-tight">
                                {title}
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-sm text-muted-foreground/80 leading-relaxed text-left">
                            {description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {error && (
                        <div className="mt-6 flex items-start gap-3 p-4 rounded-md bg-destructive/5 border border-destructive/10 text-destructive text-xs font-medium leading-relaxed animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <AlertDialogFooter className="mt-10 sm:mt-12 flex flex-col-reverse sm:flex-row gap-3">
                        <AlertDialogCancel 
                            asChild
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            <Button 
                                variant="ghost" 
                                className="flex-1 h-11 text-xs font-bold rounded-md transition-all"
                            >
                                {cancelText}
                            </Button>
                        </AlertDialogCancel>
                        
                        <AlertDialogAction
                            asChild
                            onClick={(e) => {
                                e.preventDefault();
                                onConfirm();
                            }}
                            disabled={isLoading}
                        >
                            <Button
                                variant={style.button}
                                className="flex-1 h-11 text-xs font-bold rounded-md transition-all gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    confirmText
                                )}
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
