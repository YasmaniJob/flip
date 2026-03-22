import { AulasClient } from './aulas-client';
import { RoleGuard } from "@/components/role-guard";

export default function AulasPage() {
    return (
        <RoleGuard roles={["admin", "superadmin"]} redirect="/dashboard">
            <AulasClient />
        </RoleGuard>
    );
}
