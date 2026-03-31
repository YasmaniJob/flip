export interface Loan {
    id: string;
    institutionId: string;
    staffId: string | null;
    requestedByUserId?: string | null;
    status: 'active' | 'returned' | 'overdue';
    approvalStatus: 'pending' | 'approved' | 'rejected';
    loanDate: string;
    returnDate: string | null;
    purpose: string | null;
    notes: string | null;
    studentPickupNote?: string | null;
    items?: string[]; // Resource IDs
    // Enriched fields
    staffName?: string;
    resourceNames?: string[];
    resources?: any[]; // Hidratado desde backend
    gradeName?: string;
    sectionName?: string;
    curricularAreaName?: string;
}

export interface CreateLoanData {
    staffId?: string;
    resourceIds: string[];
    purpose?: string;
    notes?: string;
    studentPickupNote?: string;
    gradeId?: string;
    sectionId?: string;
    curricularAreaId?: string;
}

export const LoansApi = {
    getAll: async (params?: { page?: number, limit?: number }): Promise<Loan[]> => {
        const url = new URL('/api/loans', window.location.origin);
        const limit = params?.limit || 200; // Reduced from 1000 for better performance
        url.searchParams.append('limit', limit.toString());
        if (params?.page) url.searchParams.append('page', params.page.toString());

        const res = await fetch(url.toString(), { cache: 'no-store' });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || 'Error al cargar préstamos');
        }
        const response = await res.json();
        return Array.isArray(response) ? response : (response.data || []);
    },

    create: async (data: CreateLoanData): Promise<Loan> => {
        const res = await fetch('/api/loans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || 'Error al crear préstamo');
        }
        return res.json();
    },

    approve: async (id: string): Promise<Loan> => {
        const res = await fetch(`/api/loans/${id}/approve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || 'Error al aprobar préstamo');
        }
        return res.json();
    },
    reject: async (id: string): Promise<Loan> => {
        const res = await fetch(`/api/loans/${id}/reject`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || 'Error al rechazar préstamo');
        }
        return res.json();
    },
};
