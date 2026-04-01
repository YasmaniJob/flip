'use client';

import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/atoms/button';
import { X, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================
export interface SummaryItem {
    icon: string;
    label: string;
    value: string;
}

interface WizardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
    srTitle?: string;
}

interface WizardModalSidebarProps {
    icon?: string;
    title: string;
    description: string;
    summary?: SummaryItem[];
    children?: ReactNode;
}

interface WizardModalContentProps {
    title: string;
    subtitle?: string;
    progress?: { current: number; total: number };
    onCancel?: () => void;
    onSubmit?: () => void;
    onBack?: () => void;
    submitLabel?: string;
    backLabel?: string;
    cancelLabel?: string;
    canSubmit?: boolean;
    isSubmitting?: boolean;
    children: ReactNode;
    showFooter?: boolean;
    footerLayout?: 'between' | 'end';
    footerStyle?: 'wizard' | 'simple';
}

// ============================================
// MAIN MODAL
// ============================================
export function WizardModal({ open, onOpenChange, children, srTitle = 'Modal', className }: WizardModalProps & { className?: string }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("sm:max-w-4xl h-[85vh] p-0 flex flex-col overflow-hidden shadow-none border border-border rounded-md bg-background [&>button]:hidden", className)}>
                <DialogTitle className="sr-only">{srTitle}</DialogTitle>
                <div className="flex w-full h-full min-h-0 overflow-hidden">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// SIDEBAR
// ============================================
export function WizardModalSidebar({
    icon,
    title,
    description,
    summary = [],
    children,
}: WizardModalSidebarProps) {
    return (
        <div className="w-72 shrink-0 bg-muted/20 border-r border-border p-6 flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="relative z-10 mb-2">
                {icon && (
                    <div className="w-12 h-12 rounded-md bg-background border border-border flex items-center justify-center mb-6 shadow-none">
                        <span className="text-2xl">{icon}</span>
                    </div>
                )}

                <h2 className={`text-xl font-bold text-foreground tracking-tight ${description ? 'mb-2' : 'mb-1'}`}>{title}</h2>
                {description && (
                    <p className="text-xs font-medium leading-relaxed text-muted-foreground/80">
                        {description}
                    </p>
                )}
            </div>

            {/* Top Content (Categories, Navigation, etc.) */}
            <div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2 relative z-10 custom-scrollbar pr-1">
                {children}
            </div>

            {/* Bottom Summary */}
            <div className="mt-4 shrink-0 relative z-10">
                {summary.length > 0 ? (
                    <div className="bg-card rounded-md p-5 border border-border shadow-none">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-0.5 w-3 bg-primary rounded-full"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resumen</span>
                        </div>

                        <div className="relative space-y-4">
                            {/* Vertical Line */}
                            <div className="absolute left-3 top-2 bottom-6 w-px bg-border rounded-full"></div>

                            {summary.map((item, idx) => (
                                <div key={idx} className="relative flex items-center gap-4 group">
                                    <div className="relative z-10 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-xs group-hover:scale-105 transition-transform duration-200">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">{item.label}</p>
                                        <p className="text-[13px] font-bold text-foreground leading-tight">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// ============================================
// CONTENT
// ============================================
export function WizardModalContent({
    title,
    subtitle,
    progress,
    onCancel,
    onSubmit,
    onBack,
    submitLabel = 'Siguiente',
    backLabel = 'Atrás',
    cancelLabel = 'Cancelar',
    canSubmit = true,
    isSubmitting = false,
    children,
    showFooter = true,
    footerLayout = 'between',
    footerStyle = 'wizard',
}: WizardModalContentProps) {
    return (
        <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-8 py-5 border-b border-border bg-background">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-foreground tracking-tight">{title}</h3>
                        {subtitle && <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{subtitle}</p>}
                    </div>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Progress bar */}
                {progress && (
                    <div className="flex gap-1 mt-4">
                        {Array.from({ length: progress.total }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-colors ${i < progress.current ? 'bg-primary' : 'bg-muted'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 min-h-0 custom-scrollbar">
                {children}
            </div>

            {/* Footer */}
            {showFooter && (
                <div className={cn(
                    "shrink-0 flex items-center px-8 py-5 border-t border-border bg-background relative",
                    footerLayout === 'end' ? "justify-end gap-3" : "justify-between"
                )}>
                    {footerLayout === 'between' ? (
                        <>
                            <div className="flex items-center gap-2">
                                {onCancel && (
                                    <Button
                                        variant="ghost"
                                        onClick={onCancel}
                                        className="rounded-md px-6 font-black uppercase tracking-widest text-[10px]"
                                    >
                                        {cancelLabel}
                                    </Button>
                                )}
                                {onBack && (
                                    <Button
                                        variant="ghost"
                                        onClick={onBack}
                                        className="rounded-md px-6 font-black uppercase tracking-widest text-[10px] border border-border"
                                    >
                                        {backLabel}
                                    </Button>
                                )}
                            </div>

                            {onSubmit && (
                                <Button
                                    onClick={onSubmit}
                                    disabled={!canSubmit || isSubmitting}
                                    variant="jira"
                                    className={cn(
                                        "rounded-md min-w-[140px] h-11 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-none",
                                        isSubmitting && 'opacity-80'
                                    )}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{submitLabel}</span>
                                            {footerStyle === 'wizard' && (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </>
                                    )}
                                </Button>
                            )}
                        </>
                    ) : (
                        // End Layout (Dialog Style)
                        <>
                            {onBack && (
                                <Button
                                    variant="ghost"
                                    onClick={onBack}
                                    className="rounded-md px-6 font-black uppercase tracking-widest text-[10px] border border-border"
                                >
                                    {backLabel}
                                </Button>
                            )}
                            {onCancel && (
                                <Button
                                    variant="ghost"
                                    onClick={onCancel}
                                    className="rounded-md px-6 font-black uppercase tracking-widest text-[10px]"
                                >
                                    {cancelLabel}
                                </Button>
                            )}
                            {onSubmit && (
                                <Button
                                    onClick={onSubmit}
                                    disabled={!canSubmit || isSubmitting}
                                    variant="jira"
                                    className={cn(
                                        "rounded-md min-w-[140px] h-11 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-none",
                                        isSubmitting && 'opacity-80'
                                    )}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{submitLabel}</span>
                                            {footerStyle === 'wizard' && (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </>
                                    )}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================
// SIMPLE FORM MODAL (for non-wizard use cases)
// ============================================
interface SimpleFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    icon: string;
    title: string;
    description: string;
    formTitle?: string;
    onSubmit: () => void;
    onCancel: () => void;
    submitLabel?: string;
    canSubmit?: boolean;
    isSubmitting?: boolean;
    children: ReactNode;
    sidebarChildren?: ReactNode;
    summary?: SummaryItem[];
    srTitle?: string;
}

export function SimpleFormModal({
    open,
    onOpenChange,
    icon,
    title,
    description,
    formTitle,
    onSubmit,
    onCancel,
    submitLabel = 'Guardar',
    canSubmit = true,
    isSubmitting = false,
    children,
    sidebarChildren,
    summary = [],
    srTitle,
}: SimpleFormModalProps) {
    const hasSidebar = !!(sidebarChildren || summary?.length > 0);

    return (
        <WizardModal 
            open={open} 
            onOpenChange={onOpenChange} 
            srTitle={srTitle || title}
            className={!hasSidebar ? "sm:max-w-2xl !h-auto !min-h-0" : undefined}
        >
            {hasSidebar && (
                <WizardModalSidebar
                    icon={icon}
                    title={title}
                    description={description}
                    summary={summary}
                >
                    {sidebarChildren}
                </WizardModalSidebar>
            )}
            <WizardModalContent
                title={formTitle || title}
                subtitle={hasSidebar ? undefined : description}
                onCancel={onCancel}
                onSubmit={onSubmit}
                submitLabel={submitLabel}
                canSubmit={canSubmit}
                isSubmitting={isSubmitting}
                footerLayout="end"
                footerStyle="simple"
            >
                {children}
            </WizardModalContent>
        </WizardModal>
    );
}
