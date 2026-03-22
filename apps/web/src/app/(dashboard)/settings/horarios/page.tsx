"use client";

import { PedagogicalHoursSettings } from "@/components/settings/pedagogical-hours-settings";
import { useSession } from "@/lib/auth-client";
import { RoleGuard } from "@/components/role-guard";

export default function HorariosPage() {
    const { data: session } = useSession();
    const hasInstitution = !!(session?.user as any)?.institutionId;

    if (!hasInstitution) return null;

    return (
        <RoleGuard roles={["admin", "superadmin"]} redirect="/dashboard">
            <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-foreground font-sans">Horarios</h1>
                            <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest mt-1">Configuración de horas pedagógicas</p>
                        </div>
                    </div>
                    <PedagogicalHoursSettings />
                </div>
            </div>
        </RoleGuard>
    );
}
