import { CategoriesSettings } from '@/components/settings/categories-settings';

export default function CategoriasPage() {
    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-foreground font-sans">
                    Categorías de Inventario
                </h1>
            </div>
            <CategoriesSettings />
        </div>
    );
}
