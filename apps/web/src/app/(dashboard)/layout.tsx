"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { QueryProvider } from "@/providers/query-provider";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/mobile/bottom-nav";
import { NotionTopbar } from "@/components/mobile/notion-topbar";
import { NotionMenu } from "@/components/mobile/notion-menu";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, isPending } = useSession();

    const [institution, setInstitution] = useState<any>(null);
    const [isBannerDismissed, setIsBannerDismissed] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [hideBottomNav, setHideBottomNav] = useState(false);

    // Determine if center button should show based on current route
    const showCenterButton = pathname.startsWith("/inventario") || pathname.startsWith("/loans");

    // Get page title based on current route
    const getPageTitle = () => {
        if (pathname.startsWith("/dashboard")) return "Dashboard";
        if (pathname.startsWith("/inventario")) return "Inventario";
        if (pathname.startsWith("/loans")) return "Préstamos";
        if (pathname.startsWith("/reservaciones")) return "Reservas";
        if (pathname.startsWith("/reuniones")) return "Reuniones";
        if (pathname.startsWith("/personal")) return "Personal";
        if (pathname.startsWith("/settings")) return "Configuración";
        return "Flip";
    };

    useEffect(() => {
        // Check if banner was dismissed in this session
        const dismissed = sessionStorage.getItem('trial_banner_dismissed');
        if (dismissed === 'true') {
            setIsBannerDismissed(true);
        }

        if (session?.user && (session.user as any).institutionId && !(session.user as any).isSuperAdmin && !institution) {
            fetch('/api/institutions/my-institution')
                .then(async res => {
                    if (res.ok) {
                        const data = await res.json();
                        setInstitution(data);
                    }
                })
                .catch(console.error);
        }

        // Listen for bottom nav visibility changes
        const handleShowBottomNav = () => setHideBottomNav(false);
        const handleHideBottomNav = () => setHideBottomNav(true);
        
        window.addEventListener('show-bottom-nav', handleShowBottomNav);
        window.addEventListener('hide-bottom-nav', handleHideBottomNav);
        
        return () => {
            window.removeEventListener('show-bottom-nav', handleShowBottomNav);
            window.removeEventListener('hide-bottom-nav', handleHideBottomNav);
        };
    }, [session, institution]);

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
        } else if (!isPending && session) {
            const user = session.user as any;
            const isSuperAdmin = user.isSuperAdmin;

            // Check email verification (unless in development mode)
            const requireEmailVerification = process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true';
            if (requireEmailVerification && !user.emailVerified) {
                router.push("/verify-required");
                return;
            }

            // Check if user needs onboarding (unless SuperAdmin)
            if (!isSuperAdmin && !user.institutionId) {
                // Solo redirigir si llevamos más de 2 segundos en el dashboard sin institutionId
                const timer = setTimeout(() => {
                    router.push("/onboarding");
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [session, isPending, router]);

    if (isPending) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">
                    Cargando...
                </div>
            </div>
        );
    }

    if (!session) return null;

    const user = session.user as any;
    const isSuperAdmin = user.isSuperAdmin;
    const requireEmailVerification = process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true';

    // If email not verified and required, show loading (will redirect)
    if (requireEmailVerification && !user.emailVerified) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">
                    Verificando...
                </div>
            </div>
        );
    }

    // If redirecting to onboarding, show loading
    if (!isSuperAdmin && !user.institutionId) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">
                    Redirigiendo...
                </div>
            </div>
        );
    }

    const handleDismissBanner = () => {
        sessionStorage.setItem('trial_banner_dismissed', 'true');
        setIsBannerDismissed(true);
    };

    const trialEndsAt = institution?.trialEndsAt ? new Date(institution.trialEndsAt) : null;
    const daysRemaining = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const isTrial = institution?.subscriptionStatus === 'trial';

    // Smart Banner Color Logic
    let bannerBg = "bg-emerald-600";
    let bannerBorder = "border-emerald-500/20";
    let iconBg = "bg-white/10";
    let badgeBg = "bg-white/20";

    if (daysRemaining <= 0) {
        bannerBg = "bg-rose-600";
        bannerBorder = "border-rose-500/20";
    } else if (daysRemaining <= 7) {
        bannerBg = "bg-amber-500";
        bannerBorder = "border-amber-400/20";
    }

    return (
        <QueryProvider>
            <div className="flex flex-col min-h-screen bg-background">
                {/* ── Global Smart Trial Banner (Edge-to-Edge) ── */}
                {isTrial && !isBannerDismissed && (
                    <div className={`shrink-0 ${bannerBg} border-b ${bannerBorder} sticky top-0 z-[100] transition-colors duration-500`}>
                        <div className="w-full px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-xl ${iconBg} text-white flex items-center justify-center border border-white/10`}>
                                    <Sparkles size={20} className="animate-pulse" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-3">
                                        <p className="text-[13px] font-black text-white tracking-widest uppercase leading-none">
                                            {daysRemaining <= 0 ? "Acceso Restringido · Trial Expirado" : "Suscripción Flip · Prueba Activa"}
                                        </p>
                                        <div className={`px-2 py-0.5 rounded-full ${badgeBg} border border-white/10 text-[9px] font-black text-white uppercase tracking-tighter`}>
                                            {daysRemaining > 0 ? `${daysRemaining} Días Restantes` : "Bloqueado"}
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-bold text-white/80 leading-tight max-w-2xl">
                                        {daysRemaining > 0
                                            ? "Tu entorno de gestión está en evaluación. Actualiza ahora para asegurar el acceso ininterrumpido a todos los módulos."
                                            : "Tu tiempo de evaluación ha concluido. El acceso a la creación de registros y funciones avanzadas está restringido."
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 ml-auto lg:ml-0">
                                <div className="hidden sm:flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-4 border-white/30 bg-transparent hover:bg-white/10 text-white text-[10px] font-black tracking-widest transition-colors rounded-md py-0"
                                    >
                                        PLANES
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 px-4 bg-white text-foreground text-[10px] font-black tracking-widest hover:bg-white/90 transition-colors flex items-center gap-2 rounded-md border-0 shadow-none py-0"
                                    >
                                        ACTUALIZAR
                                        <ArrowRight size={12} className="opacity-50" />
                                    </Button>
                                </div>
                                <button
                                    onClick={handleDismissBanner}
                                    className="p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
                                    title="Ocultar por ahora"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-1 min-h-0">
                    {/* Desktop Sidebar */}
                    <Sidebar />
                    
                    {/* Main Content */}
                    <main className="flex-1 overflow-auto relative">
                        {/* Mobile Topbar - Shows on all pages */}
                        <NotionTopbar 
                            title={getPageTitle()}
                            onMenuClick={() => setMenuOpen(true)}
                        />
                        
                        {/* Mobile Menu */}
                        <NotionMenu 
                            open={menuOpen}
                            onClose={() => setMenuOpen(false)}
                        />
                        
                        {/* Page Content with bottom padding for mobile nav */}
                        <div className="pb-20 lg:pb-0">
                            {children}
                        </div>
                    </main>
                </div>

                {/* Mobile Bottom Navigation */}
                <BottomNav 
                    showCenterButton={showCenterButton}
                    onCenterButtonClick={() => {
                        // This will be handled by each page individually
                        const event = new CustomEvent('mobile-center-button-click');
                        window.dispatchEvent(event);
                    }}
                    hidden={hideBottomNav}
                />
            </div>
        </QueryProvider>
    );
}
