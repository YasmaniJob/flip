import { useSession } from "@/lib/auth-client";
import { UserRole, ROLES } from "@flip/shared";
import { useMyInstitution } from "@/features/institutions/hooks/use-my-institution";
import { useCallback } from "react";

export function useUserRole() {
    const { data: session, isPending: isSessionPending } = useSession();
    const { data: institution, isLoading: isInstitutionLoading } = useMyInstitution();
    const role = (session?.user as any)?.role as UserRole | undefined;
    
    const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPERADMIN;
    const isPIP = role === ROLES.PIP;

    /**
     * Check if a specific feature is enabled for the current user's role
     * @param featureKey - The feature to check (e.g., 'reservations')
     * @returns boolean
     */
    const canAction = useCallback((featureKey: string) => {
        if (isAdmin) return true; // Admins always have access
        
        const settings = institution?.settings as any;
        const featureSettings = settings?.features?.[featureKey];
        
        if (!featureSettings) return isPIP; // Fallback to current hardcoded logic (PIP can manage)
        
        return !!featureSettings[role as string];
    }, [isAdmin, institution, role, isPIP]);

    return {
        role,
        isPending: isSessionPending || isInstitutionLoading,
        isSuperAdmin: role === ROLES.SUPERADMIN,
        isAdmin,
        isPIP,
        isTeacher: role === ROLES.DOCENTE,
        canManage: isAdmin || isPIP, // Legacy admin view check
        canAction, // New granular permission check
        user: session?.user as any,
        institutionSettings: institution?.settings as any
    };
}
