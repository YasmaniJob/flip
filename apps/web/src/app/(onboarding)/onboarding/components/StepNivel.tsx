import { OnboardingData } from "./types";

export function StepNivel({ data, updateData }: {
    data: OnboardingData;
    updateData: (u: Partial<OnboardingData>) => void;
}) {
    const niveles = [
        {
            value: 'primaria' as const,
            label: 'Educación Primaria',
            desc: 'Para docentes de 1° a 6° grado. Configura el sistema con un enfoque simple y amigable para el control de recursos básicos.',
            badge: null,
            color: 'bg-blue-500/10 border-blue-200 dark:border-blue-900',
            topGradient: 'bg-gradient-to-br from-blue-400 to-blue-200 dark:from-blue-600 dark:to-blue-900',
        },
        {
            value: 'secundaria' as const,
            label: 'Educación Secundaria',
            desc: 'Para docentes de 1° a 5° año. Entorno optimizado para múltiples secciones, talleres y control de asistencias complejo.',
            badge: null,
            color: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-900',
            topGradient: 'bg-gradient-to-br from-emerald-300 to-emerald-100 dark:from-emerald-600 dark:to-emerald-900',
        },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
            <div className="bg-[#f4f5f7] dark:bg-muted/20 p-6 md:p-8 rounded-2xl border border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    {niveles.map((n) => {
                        const isSelected = data.nivel === n.value;
                        return (
                            <button
                                key={n.value}
                                onClick={() => updateData({ nivel: n.value })}
                                className={`
                                    relative text-center transition-all duration-300 flex flex-col p-6 rounded-xl bg-background border-2 h-full
                                    ${isSelected
                                        ? 'border-blue-600 ring-4 ring-blue-600/10'
                                        : 'border-transparent hover:border-border/50'
                                    }
                                `}
                            >
                                <div className="h-32 w-full flex items-center justify-center mb-6 shrink-0">
                                    <div className={`relative h-24 w-40 rounded-lg ${n.value === 'primaria' ? 'bg-orange-400' : 'bg-purple-500'} flex items-center justify-center transition-transform duration-500 group-hover:scale-105`}>
                                        <div className="absolute inset-1.5 bg-white/80 rounded border border-black/5 flex flex-col p-1.5 gap-1 overflow-hidden">
                                            <div className="h-1.5 w-1/2 bg-black/10 rounded-full" />
                                            <div className="grid grid-cols-2 gap-1">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className="h-4 bg-black/5 rounded" />
                                                ))}
                                            </div>
                                        </div>
                                        <div className={`absolute -right-3 -bottom-3 h-16 w-24 ${n.value === 'primaria' ? 'bg-orange-300' : 'bg-purple-400'} rounded-lg border-2 border-white rotate-12 flex items-center justify-center`}>
                                            <div className="w-20 h-10 bg-white/50 rounded flex flex-col p-1 gap-1">
                                                <div className="h-1 w-1/3 bg-black/10 rounded-full" />
                                                <div className="flex gap-1">
                                                    <div className="h-4 flex-1 bg-black/5 rounded" />
                                                    <div className="h-4 flex-1 bg-black/5 rounded" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="space-y-2 mb-6">
                                        <h3 className="font-bold text-lg text-foreground leading-tight">
                                            {n.label}
                                        </h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed px-2 max-w-[280px] mx-auto">
                                            {n.desc}
                                        </p>
                                    </div>

                                    <div className="flex justify-center mt-auto">
                                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-muted-foreground/30'}`}>
                                            {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-white transition-transform duration-300 transform scale-100" />}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
