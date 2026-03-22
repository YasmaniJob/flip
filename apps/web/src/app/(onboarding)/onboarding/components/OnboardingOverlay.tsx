import { Rocket } from "lucide-react";

export function OnboardingOverlay() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-background rounded-xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-10 max-w-lg w-full mx-4 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-5 rounded bg-primary text-primary-foreground flex items-center justify-center">
                        <span className="text-[10px] font-black">F</span>
                    </div>
                    <span className="font-bold text-foreground tracking-tight text-sm">Flip Setup</span>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Preparando las cosas...</h2>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed px-4">
                        A continuación, te llevaremos a la configuración del espacio
                    </p>
                </div>

                <div className="py-8 relative">
                    <Rocket className="w-16 h-16 text-primary animate-bounce relative z-10 fill-primary/20" strokeWidth={1.5} />
                </div>

                <div className="w-full max-w-[280px] h-1.5 bg-muted rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-emerald-500 rounded-full w-2/3 animate-[pulse_2s_ease-in-out_infinite]" />
                </div>
            </div>
        </div>
    );
}
