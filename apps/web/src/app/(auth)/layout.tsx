import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
    title: "Flip - Iniciar Sesión",
    description: "Accede a tu cuenta de Flip",
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-muted/50 dark:bg-background overflow-y-auto py-12">
            {/* Theme Toggle Navbar (Subtle) */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-end z-30 pointer-events-none">
                <div className="pointer-events-auto">
                    <ThemeToggle />
                </div>
            </div>

            {/* --- FULL SCREEN APP SKELETON (Jira Style) --- */}
            <div className="absolute inset-0 z-0 pointer-events-none hidden sm:flex fixed">
                {/* Slim Fake Sidebar (Collapsed) */}
                <div className="w-16 bg-muted/60 dark:bg-muted/10 h-full border-r border-border/50 flex flex-col items-center py-6 space-y-8 opacity-60">
                    <div className="h-8 w-8 rounded-lg bg-border/60" />
                    {[...Array(5)].map((_, i) => (
                        <div key={`icon-${i}`} className="w-6 h-6 rounded bg-border/40" />
                    ))}
                </div>

                {/* Expanded Fake Sidebar */}
                <div className="w-64 bg-white dark:bg-muted/5 h-full border-r border-border/50 flex flex-col p-6 space-y-8 opacity-50 shadow-sm">
                    <div className="w-3/4 h-6 rounded bg-border/60" />
                    <div className="space-y-4 mt-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={`menu-${i}`} className="flex items-center gap-4">
                                <div className="w-5 h-5 rounded bg-border/40" />
                                <div className={`h-4 rounded bg-border/30 ${i % 2 === 0 ? 'w-32' : 'w-24'}`} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fake Main Viewport */}
                <div className="flex-1 flex flex-col opacity-40 bg-background">
                    {/* Fake Header */}
                    <div className="h-16 w-full border-b border-border/50 flex items-center px-8 justify-between">
                        <div className="flex gap-4">
                            <div className="h-6 w-24 rounded bg-border/50" />
                            <div className="h-6 w-20 rounded bg-border/50" />
                            <div className="h-6 w-32 rounded bg-border/50" />
                        </div>
                        <div className="flex gap-4">
                            <div className="h-8 w-64 rounded bg-border/40" />
                            <div className="h-8 w-8 rounded-lg bg-border/50" />
                        </div>
                    </div>

                    {/* Fake Board/Content */}
                    <div className="flex-1 p-10 flex gap-6 overflow-hidden">
                        {[...Array(3)].map((_, colIndex) => (
                            <div key={`col-${colIndex}`} className="flex-1 bg-muted/60 dark:bg-muted/10 rounded-lg p-4 space-y-4">
                                <div className="h-4 w-32 rounded bg-border/60 uppercase tracking-widest text-[10px] mb-6" />
                                {[...Array(4)].map((_, cardIndex) => (
                                    <div key={`card-${colIndex}-${cardIndex}`} className="w-full h-24 rounded shadow-sm bg-white dark:bg-muted/5 border border-border/50 p-4 flex flex-col justify-between">
                                        <div className="h-3 w-3/4 rounded bg-border/50" />
                                        <div className="flex justify-between items-center mt-4">
                                            <div className="h-4 w-12 rounded bg-border/40" />
                                            <div className="h-6 w-6 rounded-lg bg-border/50" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* --- END SKELETON --- */}

            {/* Centered Form Container (The Razor approach) */}
            <div className="relative z-20 w-full flex justify-center p-4">
                {children}
            </div>
        </div>
    );
}
