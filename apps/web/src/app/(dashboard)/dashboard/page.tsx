"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays } from "lucide-react";

import { TodayAgenda } from "@/features/dashboard/components/today-agenda";
import { ActiveInventory } from "@/features/dashboard/components/active-inventory";
import { SuperAdminDashboard } from "@/features/dashboard/components/super-admin-dashboard";
import { Users, Database, Wrench, Landmark } from "lucide-react";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { useMyInstitution } from "@/features/institutions/hooks/use-my-institution";

// Mobile components
import { MobileMetricsGrid } from "@/features/dashboard/components/mobile-metrics-grid";
import { MobileOverdueAlert } from "@/features/dashboard/components/mobile-overdue-alert";
import { MobileQuickActions } from "@/features/dashboard/components/mobile-quick-actions";
import { MobileRecentActivity } from "@/features/dashboard/components/mobile-recent-activity";
import { DashboardDiagnosticNotification } from "@/features/diagnostic/components/dashboard-notification";

export default function DashboardPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { data: institution } = useMyInstitution();
    const user = session?.user as any;
    const isSuperAdmin = user?.isSuperAdmin;
    // const isInstitutionAdmin = user?.role === 'admin' && !isSuperAdmin;

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    const now = new Date();
    const dateStr = format(now, "eeee, d 'de' MMMM", { locale: es });
    const dateCapitalized = dateStr.toUpperCase();

    if (!session) return null;

    if (!isSuperAdmin && !user.institutionId) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <h1 className="text-2xl font-bold mb-4">Configuración Incompleta</h1>
                    <p className="text-muted-foreground mb-6">
                        Tu cuenta necesita vincularse a una institución educativa.
                    </p>
                    <Button
                        onClick={() => router.push('/onboarding')}
                        className="w-full mb-4"
                        size="lg"
                    >
                        Completar Registro
                    </Button>
                    <Button
                        onClick={handleSignOut}
                        variant="ghost"
                        className="w-full"
                    >
                        Cerrar Sesión
                    </Button>
                </Card>
            </div>
        );
    }

    if (isSuperAdmin) {
        return <SuperAdminDashboard user={user} />;
    }

    // Standard User Dashboard (Flat Workspace Layout)
    return (
        <>
            {/* Mobile Dashboard */}
            <div className="lg:hidden bg-background min-h-screen">
                {/* Greeting Section */}
                <div className="px-4 pt-6 pb-4">
                    <h1 className="text-2xl font-bold text-foreground mb-1">
                        ¡Hola, {user?.name?.split(' ')[0]}!
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {format(now, "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                    {institution?.name && (
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-card border border-border/60 rounded-lg mt-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-semibold text-foreground truncate max-w-[250px]">
                                {institution.name}
                            </span>
                        </div>
                    )}
                </div>
                
                <MobileMetricsGrid 
                    stats={{
                        weekReservations: institution?.stats?.weekReservations ?? 0,
                        totalResources: institution?.stats?.totalResources ?? 0,
                        activeLoans: institution?.stats?.activeLoans ?? 0,
                        totalStaff: institution?.stats?.totalStaff ?? 0,
                    }}
                />

                <MobileOverdueAlert count={institution?.stats?.overdueLoans ?? 0} />

                <MobileQuickActions />

                <MobileRecentActivity />
            </div>

            {/* Desktop Dashboard */}
            <div className="hidden lg:block relative flex flex-col h-[calc(100vh-4rem)] bg-background overflow-y-auto overflow-x-hidden">
                {/* ── Mesh Background (Edge-to-Edge) ── */}
                <div className="pointer-events-none absolute -top-24 -right-24 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
                <div className="pointer-events-none absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
                <div className="pointer-events-none absolute bottom-0 -left-24 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />

                <div className="max-w-[1440px] mx-auto w-full flex-1 flex flex-col min-h-0 px-6 md:px-10 relative z-10">
                    {/* Hybrid Alpha Hero (Next-Gen) - Consistent for all */}
                    <div className="relative pt-8 pb-6">

                        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                            {/* Left: Typography Focus */}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-foreground mb-4">
                                    ¡Hola, {user?.name?.split(' ')[0]}!
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/10 rounded-full">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Gestión Administrativa</span>
                                    </div>
                                    <div className="h-4 w-px bg-border/60 mx-1 hidden md:block" />
                                    <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 border border-border/50 rounded-full group hover:border-primary/30 transition-all cursor-default">
                                        < Landmark className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <span className="text-xs font-bold text-foreground truncate max-w-[300px]">
                                            {institution?.name || 'Sincronizando...'}
                                        </span>
                                    </div>
                                    <div className="h-4 w-px bg-border/60 mx-1 hidden md:block" />
                                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        Panel de control activo
                                    </div>
                                </div>
                            </div>

                            {/* Right Area: Status Intelligence */}
                            <div className="flex flex-col items-start lg:items-end gap-6 shrink-0 lg:pb-1">
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground/80">
                                    <div className="flex items-center gap-2">
                                        <span className="text-foreground font-extrabold">ADMIN</span>
                                        <span className="text-[10px] uppercase tracking-wider opacity-60">Role</span>
                                    </div>
                                    <div className="w-px h-3 bg-border" />
                                    <div className="flex items-center gap-2 text-primary font-bold">
                                        <CalendarDays className="h-4 w-4 opacity-70" />
                                        <span className="text-[11px] uppercase tracking-widest">{dateCapitalized}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Diagnostic Notification */}
                    <div className="mb-8 mt-2">
                        <DashboardDiagnosticNotification />
                    </div>

                    {/* 1. Specialized Impact Cockpit (AIP/CRT Context) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard label="Personal" value={institution?.stats?.totalStaff ?? '—'} icon={Users} href="/personal" color="violet" />
                        <StatCard label="Inventario" value={institution?.stats?.totalResources ?? '—'} icon={Database} href="/inventario" color="emerald" />
                        <StatCard label="Reuniones" value={institution?.stats?.totalMeetings ?? '—'} icon={Wrench} href="/reuniones" color="indigo" />
                    </div>

                    {/* ── 60/40 Split Content Area ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 pb-10 pt-6">
                        {/* Left Column (60%): The Narrative (Today's Agenda) */}
                        <div className="lg:col-span-8 flex flex-col min-h-0">
                            <div className="pr-2 pb-6 overflow-y-auto w-full h-full bg-card/40 rounded-lg border border-border/60 p-5 flex-1">
                                <TodayAgenda />
                            </div>
                        </div>

                        {/* Right Column (40%): The Alerts (Inventory Context) */}
                        <div className="lg:col-span-4 flex flex-col min-h-0">
                            <ActiveInventory />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}


