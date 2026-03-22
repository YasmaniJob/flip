"use client";

export default function AnalyticsPage() {
    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
                        Analytics
                    </h1>
                </div>

                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <h2 className="text-2xl font-bold mb-2">Analytics de Plataforma</h2>
                    <p className="text-muted-foreground mb-6">
                        Visualiza métricas de uso, instituciones activas, usuarios y más.
                    </p>
                    <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                        En desarrollo
                    </div>
                </div>
            </div>
        </div>
    );
}
