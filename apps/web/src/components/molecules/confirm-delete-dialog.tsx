import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: ReactNode;
    confirmText?: string;
    cancelText?: string;
    warningText?: string;
    isLoading?: boolean;
}

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "¿Eliminar elemento?",
    description,
    confirmText = "Eliminar",
    cancelText = "Cancelar",
    isLoading = false,
}: ConfirmDeleteDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
            <AlertDialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden border-0 rounded-[2rem]">
                <div className="p-8 pb-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mb-5 shrink-0">
                        <Trash2 className="h-8 w-8" />
                    </div>

                    <AlertDialogHeader className="space-y-3">
                        <AlertDialogTitle className="text-xl font-bold text-foreground text-center">
                            {title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
                            {description || "Esta acción no se puede deshacer. Se eliminará permanentemente del sistema."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>

                <AlertDialogFooter className="p-6 pt-2 sm:justify-center flex-col-reverse sm:flex-row gap-3 bg-card w-full">
                    <AlertDialogCancel
                        disabled={isLoading}
                        className="mt-0 h-12 font-bold flex-1 sm:flex-1 w-full"
                    >
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={isLoading}
                        className={cn(
                            "h-12 font-bold flex-1 sm:flex-1 w-full flex items-center justify-center gap-2",
                            "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                            "focus:ring-0 focus:ring-offset-0"
                        )}
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Eliminando...</span>
                            </>
                        ) : (
                            <span>{confirmText}</span>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
