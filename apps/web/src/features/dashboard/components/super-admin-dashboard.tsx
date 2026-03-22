'use client';

import { useRouter } from 'next/navigation';
import { Building2, Users, Database, TrendingUp, Loader2, Clock, Wrench, CalendarDays } from 'lucide-react';
import { useSuperAdminStats, useInstitutionStats } from '@/features/dashboard/hooks/use-dashboard';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

import { TodayAgenda } from '@/features/dashboard/components/today-agenda';
import { ActiveInventory } from '@/features/dashboard/components/active-inventory';

import { StatCard } from './stat-card';

export function SuperAdminDashboard({ user }: { user: any }) {
    const router = useRouter();

    const { data: platformStats, isLoading: platformLoading } = useSuperAdminStats();
    const { data: institutionStats, isLoading: ieLoading } = useInstitutionStats();

    const platform = platformStats?.platform;
    const recentInstitutions = platformStats?.recentInstitutions || [];
    const institution = institutionStats?.institution;

    const now = new Date();
    const dateLabel = format(now, "EEEE, d 'de' MMMM", { locale: es });
    const dateCapitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

    const isLoading = platformLoading || ieLoading;

    return (
        <div className="relative flex flex-col h-[calc(100vh-4rem)] bg-background overflow-y-auto overflow-x-hidden">
            {/* ── Mesh Background (Edge-to-Edge) ── */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
            <div className="pointer-events-none absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
            <div className="pointer-events-none absolute bottom-0 -left-24 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />

            <div className="max-w-[1440px] mx-auto w-full flex flex-col min-h-0 px-6 md:px-10 relative z-10">
                {/* ── Hybrid Alpha Hero (Next-Gen) ── */}
                <div className="relative pt-8 pb-6">
                    <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-foreground mb-4">
                                ¡Hola, {user?.name?.split(' ')[0]}!
                            </h1>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1 bg-primary rounded-full opacity-20" />
                                <p className="text-base text-muted-foreground font-medium max-w-xl leading-snug">
                                    {platform
                                        ? <>{platform.totalInstitutions} {platform.totalInstitutions === 1 ? 'institución registrada' : 'instituciones registradas'} coordinando esfuerzos en la plataforma hoy.</>
                                        : 'Sincronizando datos de la plataforma...'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-start lg:items-end gap-6 shrink-0 lg:pb-1">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground/80">
                                {platform && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-foreground font-extrabold">{platform.totalUsers}</span>
                                            <span className="text-[10px] uppercase tracking-wider opacity-60">Usuarios</span>
                                        </div>
                                        <div className="w-px h-3 bg-border" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-foreground font-extrabold">{platform.activeLoans}</span>
                                            <span className="text-[10px] uppercase tracking-wider opacity-60">Préstamos</span>
                                        </div>
                                        <div className="w-px h-3 bg-border" />
                                    </>
                                )}
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <CalendarDays className="h-4 w-4 opacity-70" />
                                    <span className="text-[11px] uppercase tracking-widest">{dateCapitalized}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Dashboard Operations Area ── */}
                <div className="flex-1 flex flex-col gap-6 pt-2 pb-10">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando Estación de Mando...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* 1. Specialized Impact Cockpit (AIP/CRT Context) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatCard label="Personal" value={institution?.totalStaff ?? '—'} icon={Users} href="/personal" color="violet" />
                                <StatCard label="Inventario" value={institution?.totalResources ?? '—'} icon={Database} href="/inventario" color="emerald" />
                                <StatCard label="Reuniones" value={institution?.totalMeetings ?? '—'} icon={Wrench} href="/reuniones" color="indigo" />
                            </div>

                            {/* 2. 60/40 Functional Split */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                                <div className="lg:col-span-8 flex flex-col min-h-0">
                                    <div className="bg-card/40 rounded-lg border border-border/60 p-6 flex-1">
                                        <TodayAgenda />
                                    </div>
                                </div>

                                <div className="lg:col-span-4 flex flex-col min-h-0">
                                    <ActiveInventory />
                                </div>
                            </div>

                            {/* 3. Platform Management Section */}
                            <div className="mt-10 border-t border-border/40 pt-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-0.5 w-6 bg-primary/20 rounded-full" />
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 shrink-0">
                                        Gestión de Plataforma & Ecosistema
                                    </h2>
                                    <div className="h-px flex-1 bg-border/40" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    <StatCard label="Instituciones" value={platform?.totalInstitutions ?? '—'} icon={Building2} href="/platform/instituciones" color="blue" />
                                    <StatCard label="Usuarios" value={platform?.totalUsers ?? '—'} icon={Users} href="/platform/usuarios" color="violet" />
                                    <StatCard label="Préstamos" value={platform?.totalLoans ?? '—'} icon={TrendingUp} color="indigo" />
                                    <StatCard label="Subscripciones" value={platform?.activeLoans ?? '—'} icon={Clock} color="amber" />
                                </div>
                                <div className="flex flex-col gap-3">
                                    {recentInstitutions.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-lg bg-muted/20">Esperando nuevas integraciones...</p>
                                    ) : recentInstitutions.map(inst => (
                                        <div key={inst.id} className="group bg-card/40 border border-border/40 rounded-lg px-4 py-3 flex items-center gap-5 hover:border-primary/30 hover:bg-accent/20 transition-all cursor-pointer"
                                            onClick={() => router.push(`/platform/instituciones/${inst.id}`)}>

                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-muted group-hover:bg-primary/5 flex items-center justify-center transition-colors">
                                                <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors truncate">{inst.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold uppercase tracking-tighter">{inst.nivel || 'Global'}</span>
                                                    <span className="text-[10px] font-bold text-primary uppercase">Plan {inst.plan}</span>
                                                </div>
                                            </div>

                                            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase shrink-0">
                                                <Clock className="h-3 w-3" />
                                                {inst.createdAt ? formatDistanceToNow(new Date(inst.createdAt), { addSuffix: true, locale: es }) : '—'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
