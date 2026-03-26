import { CategoriesSettings } from '@/components/settings/categories-settings';

export default function CategoriasPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                    Categorías de Inventario
                </h1>
            </div>
            <CategoriesSettings />
        </div>
    );
}
