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
            <DialogContent className={cn("sm:max-w-4xl h-[85vh] p-0 gap-0 overflow-hidden [&>button]:hidden", className)}>
                <DialogTitle className="sr-only">{srTitle}</DialogTitle>
                <div className="absolute inset-0 flex">
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
        <div className="w-72 shrink-0 bg-primary text-primary-foreground p-6 flex flex-col relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-background/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-32 -left-10 w-32 h-32 bg-background/5 rounded-full" />

            {/* Header */}
            <div className="relative z-10 mb-2">
                {icon && (
                    <div className="w-14 h-14 rounded-2xl bg-background/20 flex items-center justify-center mb-6">
                        <span className="text-3xl">{icon}</span>
                    </div>
                )}

                <h2 className={`text-2xl font-bold ${description ? 'mb-3' : 'mb-1'}`}>{title}</h2>
                {description && (
                    <p className="text-sm opacity-90 leading-relaxed text-primary-foreground/80">
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
                    <div className="bg-background/10 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-0.5 w-3 bg-background/50 rounded-full"></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">Resumen</span>
                        </div>

                        <div className="relative space-y-4">
                            {/* Vertical Line */}
                            <div className="absolute left-3 top-2 bottom-6 w-0.5 bg-background/15 rounded-full"></div>

                            {summary.map((item, idx) => (
                                <div key={idx} className="relative flex items-center gap-4 group">
                                    <div className="relative z-10 w-6 h-6 rounded-full bg-background flex items-center justify-center text-xs ring-2 ring-white/30 group-hover:scale-110 transition-transform duration-200">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-primary-foreground/70 uppercase tracking-wide font-medium">{item.label}</p>
                                        <p className="text-sm font-bold text-primary-foreground leading-tight">{item.value}</p>
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
            <div className="shrink-0 px-8 pt-8 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">{title}</h3>
                        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                    </div>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
                        >
                            <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                    )}
                </div>

                {/* Progress bar */}
                {progress && (
                    <div className="flex gap-1.5">
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
            <div className="flex-1 overflow-y-auto px-8 pb-8 min-h-0 custom-scrollbar">
                {children}
            </div>

            {/* Footer */}
            {showFooter && (
                <div className={cn(
                    "shrink-0 flex items-center px-8 py-4 border-t border-border bg-background relative",
                    footerLayout === 'end' ? "justify-end gap-4" : "justify-between"
                )}>
                    {/* Gradient Fade Top */}
                    <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />

                    {footerLayout === 'between' ? (
                        <>
                            <div className="flex items-center gap-2">
                                {onCancel && (
                                    <Button
                                        variant="outline"
                                        onClick={onCancel}
                                        className="rounded-full px-6 font-medium sm:min-w-[100px]"
                                    >
                                        {cancelLabel}
                                    </Button>
                                )}
                                {onBack && (
                                    <Button
                                        variant="outline"
                                        onClick={onBack}
                                        className="rounded-full px-6 font-medium sm:min-w-[100px]"
                                    >
                                        {backLabel}
                                    </Button>
                                )}
                            </div>

                            {onSubmit && (
                                <Button
                                    onClick={onSubmit}
                                    disabled={!canSubmit || isSubmitting}
                                    className={cn(
                                        "rounded-full h-11 transition-all font-bold flex items-center gap-3",
                                        footerStyle === 'wizard' ? "pl-5 pr-2" : "px-6",
                                        canSubmit && !isSubmitting
                                            ? ''
                                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                                    )}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{submitLabel}</span>
                                            {footerStyle === 'wizard' && (
                                                <div className={cn(
                                                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                                                    canSubmit ? 'bg-white/20' : 'bg-muted'
                                                )}>
                                                    <ChevronRight className="h-5 w-5" />
                                                </div>
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
                                    variant="outline"
                                    onClick={onBack}
                                    className="rounded-full px-6 font-medium sm:min-w-[100px]"
                                >
                                    {backLabel}
                                </Button>
                            )}
                            {onCancel && (
                                <Button
                                    variant="outline"
                                    onClick={onCancel}
                                    className="rounded-full px-6 font-medium sm:min-w-[100px]"
                                >
                                    {cancelLabel}
                                </Button>
                            )}
                            {onSubmit && (
                                <Button
                                    onClick={onSubmit}
                                    disabled={!canSubmit || isSubmitting}
                                    className={cn(
                                        "rounded-full h-11 transition-all font-bold flex items-center gap-3",
                                        footerStyle === 'wizard' ? "pl-5 pr-2" : "px-6",
                                        canSubmit && !isSubmitting
                                            ? ''
                                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                                    )}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{submitLabel}</span>
                                            {footerStyle === 'wizard' && (
                                                <div className={cn(
                                                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                                                    canSubmit ? 'bg-background/20' : 'bg-muted'
                                                )}>
                                                    <ChevronRight className="h-5 w-5" />
                                                </div>
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
    formTitle: string;
    onSubmit: () => void;
    onCancel: () => void;
    submitLabel?: string;
    canSubmit?: boolean;
    isSubmitting?: boolean;
    children: ReactNode;
    sidebarChildren?: ReactNode;
    summary?: SummaryItem[];
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
}: SimpleFormModalProps) {
    return (
        <WizardModal open={open} onOpenChange={onOpenChange} srTitle={title}>
            <WizardModalSidebar
                icon={icon}
                title={title}
                description={description}
                summary={summary}
            >
                {sidebarChildren}
            </WizardModalSidebar>
            <WizardModalContent
                title={formTitle}
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
