import { CategoriesSettings } from '@/components/settings/categories-settings';

export default function CategoriasPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                    Categorías de Inventario
                </h1>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                    Gestiona las categorías para organizar tu inventario de recursos.
                </p>
            </div>
            <CategoriesSettings />
        </div>
    );
}
