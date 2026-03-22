/**
 * Permission levels in the system:
 * - SuperAdmin: Platform owner (isSuperAdmin: true) - NO RESTRICTIONS
 * - Admin: Institution owner who purchased the SaaS (role: 'admin') - NO RESTRICTIONS in their institution
 * - PIP: Promotor de Innovación Pedagógica (role: 'pip') - Can manage inventory, loans, reservations
 * - Docente: Regular teacher (role: 'docente') - Limited to their own resources
 */

export interface UserPermissions {
    userId: string;
    role: string;
    isSuperAdmin: boolean;
    institutionId?: string;
}

export class PermissionsHelper {
    /**
     * Check if user is SuperAdmin (platform owner)
     * SuperAdmin has ZERO restrictions
     */
    static isSuperAdmin(user: UserPermissions): boolean {
        return user.isSuperAdmin === true;
    }

    /**
     * Check if user is Admin (institution owner who purchased SaaS)
     */
    static isAdmin(user: UserPermissions): boolean {
        return user.role === 'admin';
    }

    /**
     * Check if user is SuperAdmin or Admin (both have full permissions)
     */
    static hasFullPermissions(user: UserPermissions): boolean {
        return this.isSuperAdmin(user) || this.isAdmin(user);
    }

    /**
     * Check if user is PIP (Promotor de Innovación Pedagógica)
     */
    static isPIP(user: UserPermissions): boolean {
        return user.role === 'pip';
    }

    /**
     * Check if user can manage system configuration
     * SuperAdmin and Admin have full access
     */
    static canManageSystemConfig(user: UserPermissions): boolean {
        return this.hasFullPermissions(user);
    }

    /**
     * Check if user can manage staff
     * SuperAdmin and Admin can manage staff
     */
    static canManageStaff(user: UserPermissions): boolean {
        return this.hasFullPermissions(user);
    }

    /**
     * Check if user can create other users
     * SuperAdmin and Admin can create users
     */
    static canCreateUsers(user: UserPermissions): boolean {
        return this.hasFullPermissions(user);
    }

    /**
     * Check if user can manage inventory
     * SuperAdmin, Admin, and PIP can manage inventory
     */
    static canManageInventory(user: UserPermissions): boolean {
        return this.hasFullPermissions(user) || this.isPIP(user);
    }

    /**
     * Check if user can manage loans
     * SuperAdmin, Admin, and PIP can manage loans
     */
    static canManageLoans(user: UserPermissions): boolean {
        return this.hasFullPermissions(user) || this.isPIP(user);
    }

    /**
     * Check if user can cancel any reservation
     * SuperAdmin, Admin, and PIP can cancel any reservation
     */
    static canCancelAnyReservation(user: UserPermissions): boolean {
        return this.hasFullPermissions(user) || this.isPIP(user);
    }

    /**
     * Check if user can cancel specific reservation
     */
    static canCancelReservation(user: UserPermissions, reservationOwnerId: string): boolean {
        // SuperAdmin, Admin, PIP can cancel any reservation
        if (this.canCancelAnyReservation(user)) {
            return true;
        }
        // Owner can cancel their own reservation
        return user.userId === reservationOwnerId;
    }

    /**
     * Check if user can delete system configuration items
     * SuperAdmin and Admin have full permissions
     */
    static canDeleteSystemConfig(user: UserPermissions): boolean {
        return this.hasFullPermissions(user);
    }

    /**
     * Check if user can view reports
     * SuperAdmin, Admin, and PIP can view reports
     */
    static canViewReports(user: UserPermissions): boolean {
        return this.hasFullPermissions(user) || this.isPIP(user);
    }

    /**
     * Check if user can manage institution settings
     * SuperAdmin and Admin can manage institution settings
     */
    static canManageInstitutionSettings(user: UserPermissions): boolean {
        return this.hasFullPermissions(user);
    }
}
