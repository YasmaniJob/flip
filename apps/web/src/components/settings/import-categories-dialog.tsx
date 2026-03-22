'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCreateCategory, type Category } from '@/features/settings/hooks/use-categories';
import { DEFAULT_CATEGORIES } from '@/lib/constants/default-categories';

interface ImportCategoriesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existingCategories: Category[];
    onSuccess: () => void;
}

export function ImportCategoriesDialog({
    open,
    onOpenChange,
    existingCategories,
    onSuccess,
}: ImportCategoriesDialogProps) {
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{
        imported: number;
        skipped: number;
        errors: number;
    } | null>(null);

    const createMutation = useCreateCategory();

    const handleImport = async () => {
        setIsImporting(true);
        setImportResult(null);

        const existingNames = new Set(existingCategories.map(c => c.name.toLowerCase()));
        let imported = 0;
        let skipped = 0;
        let errors = 0;

        for (const category of DEFAULT_CATEGORIES) {
            if (existingNames.has(category.name.toLowerCase())) {
                skipped++;
                continue;
            }

            try {
                await createMutation.mutateAsync({
                    name: category.name,
                    icon: category.icon,
                    color: category.color,
                });
                imported++;
            } catch (error) {
                errors++;
                console.error(`Error importing category ${category.name}:`, error);
            }
        }

        setImportResult({ imported, skipped, errors });
        setIsImporting(false);

        if (imported > 0) {
            onSuccess();
        }
    };

    const handleClose = () => {
        setImportResult(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] shadow-none border border-border">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Importar Categorías Predeterminadas
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Importa las {DEFAULT_CATEGORIES.length} categorías predeterminadas para organizar tu inventario.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {!importResult ? (
                        <>
                            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Categorías a importar:
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {DEFAULT_CATEGORIES.slice(0, 6).map((cat) => (
                                        <div key={cat.name} className="flex items-center gap-2 text-sm">
                                            <span className="text-lg">{cat.icon}</span>
                                            <span className="font-medium text-xs truncate">{cat.name}</span>
                                        </div>
                                    ))}
                                </div>
                                {DEFAULT_CATEGORIES.length > 6 && (
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Y {DEFAULT_CATEGORIES.length - 6} categorías más...
                                    </p>
                                )}
                            </div>

                            {existingCategories.length > 0 && (
                                <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-4">
                                    <p className="text-xs font-medium text-amber-900">
                                        <AlertCircle className="h-4 w-4 inline mr-1" />
                                        Las categorías que ya existen serán omitidas.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={isImporting}
                                    className="rounded-md h-10 text-xs font-black uppercase tracking-widest border-border shadow-none"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleImport}
                                    disabled={isImporting}
                                    className="bg-primary hover:bg-primary/90 text-white rounded-md h-10 text-xs font-black uppercase tracking-widest shadow-none"
                                >
                                    {isImporting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Importando...
                                        </>
                                    ) : (
                                        'Importar Categorías'
                                    )}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div className="bg-green-50/50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm text-green-900">
                                            Importación completada
                                        </p>
                                        <div className="text-xs text-green-800 space-y-1">
                                            <p>✓ {importResult.imported} categorías importadas</p>
                                            {importResult.skipped > 0 && (
                                                <p>⊘ {importResult.skipped} categorías omitidas (ya existían)</p>
                                            )}
                                            {importResult.errors > 0 && (
                                                <p className="text-rose-600">✗ {importResult.errors} errores</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleClose}
                                    className="bg-primary hover:bg-primary/90 text-white rounded-md h-10 text-xs font-black uppercase tracking-widest shadow-none"
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
