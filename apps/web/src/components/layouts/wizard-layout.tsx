import { ReactNode } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface WizardLayoutProps {
    // Header Info (Displayed in Sidebar)
    title: string;
    description: string;
    icon?: ReactNode; // Optional in clean design, but kept for compatibility

    // Content
    sidebarContent?: ReactNode; // Form inputs go here
    children: ReactNode; // Main right-side content

    // Actions
    onClose: () => void;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;

    // Customization
    className?: string;
    contentClassName?: string;
}

export function WizardLayout({
    title,
    description,
    sidebarContent,
    children,
    onClose,
    className,
    contentClassName,
    isFullscreen,
    onToggleFullscreen,
}: WizardLayoutProps) {
    return (
        <div className={cn(
            "flex w-full h-full bg-background overflow-hidden shadow-none",
            !isFullscreen ? "sm:rounded-lg border border-border" : "rounded-none border-0",
            className
        )}>
            {/* LEFT SIDEBAR - FORM INPUTS */}
            {sidebarContent && (
                <div className="w-[340px] bg-card border-r border-border flex flex-col shrink-0">
                    <div className="px-6 pt-6 pb-4 border-b border-border">
                        <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>
                        <DialogDescription className="sr-only">{description}</DialogDescription>
                    </div>

                    {/* Scrollable Sidebar Content */}
                    <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6 custom-scrollbar flex flex-col">
                        {sidebarContent}
                    </div>
                </div>
            )}

            {!sidebarContent && (
                <div className="sr-only">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </div>
            )}

            {/* RIGHT CONTENT - DYNAMIC VIEWS */}
            <div className={cn("flex-1 flex flex-col bg-background overflow-hidden relative", contentClassName)}>
                {/* Header with Close Button */}
                <div className="absolute top-0 right-0 p-6 z-50 pointer-events-none flex items-center gap-2">
                    {onToggleFullscreen && (
                        <button
                            onClick={onToggleFullscreen}
                            className="pointer-events-auto p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                        >
                            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                            <span className="sr-only">Pantalla Completa</span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="pointer-events-auto p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Cerrar</span>
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}
