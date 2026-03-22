export interface SuperAdminStats {
    platform: {
        totalInstitutions: number;
        totalUsers: number;
        totalResources: number;
        totalLoans: number;
        activeLoans: number;
        overdueLoans: number;
    };
    recentInstitutions: {
        id: string;
        name: string;
        nivel: string | null;
        plan: string | null;
        createdAt: string;
    }[];
}

export interface InstitutionStats {
    institution: {
        totalStaff: number;
        totalResources: number;
        availableResources: number;
        activeLoans: number;
        overdueLoans: number;
        totalMeetings: number;
    };
}

export const DashboardApi = {
    getSuperAdminStats: async (): Promise<SuperAdminStats> => {
        const res = await fetch('/api/dashboard/super-stats');
        if (!res.ok) throw new Error('Error al cargar estadísticas de plataforma');
        return res.json();
    },
    getInstitutionStats: async (): Promise<InstitutionStats> => {
        const res = await fetch('/api/dashboard/institution-stats');
        if (!res.ok) throw new Error('Error al cargar estadísticas de institución');
        return res.json();
    },
};
