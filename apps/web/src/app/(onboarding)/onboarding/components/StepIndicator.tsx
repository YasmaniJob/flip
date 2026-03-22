import { Step, STEPS } from "./types";

export function StepIndicator({ currentStep }: { currentStep: Step }) {
    const idx = STEPS.indexOf(currentStep);
    return (
        <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                    <div
                        className={`h-1.5 rounded-sm transition-all duration-300 ${i < idx
                            ? 'w-6 bg-primary'
                            : i === idx
                                ? 'w-6 bg-primary'
                                : 'w-2 bg-border'
                            }`}
                    />
                </div>
            ))}
            <span className="text-xs text-muted-foreground font-medium ml-1">
                {idx + 1} de {STEPS.length}
            </span>
        </div>
    );
}
