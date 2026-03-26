"use client";

import { AulasClient } from './aulas-client';
import { RoleGuard } from "@/components/role-guard";
import { useState } from "react";

export default function AulasPage() {
    const [showCreateModal, setShowCreateModal] = useState(false);

    return (
        <RoleGuard roles={["admin", "superadmin"]} redirect="/dashboard">
            <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-foreground font-sans">Aulas</h1>
                        </div>
                    </div>
                    <AulasClient showCreateModal={showCreateModal} setShowCreateModal={setShowCreateModal} />
                </div>
            </div>
        </RoleGuard>
    );
}
