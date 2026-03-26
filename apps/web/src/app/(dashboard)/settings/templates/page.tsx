import { TemplatesSettings } from '@/components/settings/templates-settings';

export default function TemplatesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                    Templates de Recursos
                </h1>
            </div>
            <TemplatesSettings />
        </div>
    );
}
