import { TemplatesSettings } from '@/components/settings/templates-settings';

export default function TemplatesPage() {
    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-foreground font-sans">
                    Templates de Recursos
                </h1>
            </div>
            <TemplatesSettings />
        </div>
    );
}
