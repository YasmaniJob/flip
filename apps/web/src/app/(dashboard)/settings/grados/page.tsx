"use client";

import { GradesSectionsSettings } from "@/components/settings/grades-sections-settings";
import { useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { RoleGuard } from "@/components/role-guard";

export default function GradosPage() {
    const { data: session } = useSession();
    const [institution, setInstitution] = useState<any>(null);
    const hasInstitution = !!(session?.user as any)?.institutionId;

    useEffect(() => {
        if (hasInstitution) {
            fetch('/api/institutions/my-institution')
                .then(async res => {
                    if (res.ok) {
                        const data = await res.json();
                        setInstitution(data);
                    }
                })
                .catch(console.error);
        }
    }, [hasInstitution]);

    if (!hasInstitution) return null;

    return (
        <RoleGuard roles={["admin", "superadmin"]} redirect="/dashboard">
            <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-foreground font-sans">Grados y Secciones</h1>
                            <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest mt-1">Gestión de niveles académicos</p>
                        </div>
                    </div>
                    <GradesSectionsSettings educationLevel={institution?.nivel} />
                </div>
            </div>
        </RoleGuard>
    );
}
