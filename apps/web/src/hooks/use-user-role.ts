import { useSession } from "@/lib/auth-client";
import { UserRole, ROLES } from "@flip/shared";

export function useUserRole() {
    const { data: session, isPending } = useSession();
    const role = (session?.user as any)?.role as UserRole | undefined;
    const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPERADMIN;
    const isPIP = role === ROLES.PIP;

    return {
        role,
        isPending,
        isSuperAdmin: role === ROLES.SUPERADMIN,
        isAdmin,
        isPIP,
        isTeacher: role === ROLES.DOCENTE,
        canManage: isAdmin || isPIP,
        user: session?.user as any,
    };
}
