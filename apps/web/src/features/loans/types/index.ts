export interface Staff {
    id: string;
    name: string;
    dni?: string;
    email?: string;
    role: string;
    status: string;
}

export interface Resource {
    id: string;
    name: string;
    brand?: string | null;
    model?: string | null;
    status: string;
    internalId?: string | null;
    serialNumber?: string | null;
    category?: {
        name: string;
        color?: string;
    };
}

export interface Loan {
    id: string;
    institutionId: string;
    staffId: string | null;
    requestedByUserId?: string | null;
    staffName?: string | null;
    staffArea?: string | null;
    status: 'active' | 'returned' | 'overdue';
    approvalStatus: 'pending' | 'approved' | 'rejected';
    loanDate: string;
    returnDate: string | null;
    purpose: string | null;
    notes: string | null;
    studentPickupNote?: string | null;
    items?: string[]; // Resource IDs
    // Enriched fields
    resourceNames?: string[];
    resources?: Resource[];
    gradeName?: string;
    sectionName?: string;
    curricularAreaName?: string;
    damageReports?: Record<string, any>;
    suggestionReports?: Record<string, any>;
}

export interface LoanWizardState {
    step: number;
    viewState: 'CONTEXT' | 'CATALOG';
    selectedStaff: Staff | null;
    cart: Resource[];
    isOpen: boolean;
    gradeId?: string | null;
    sectionId?: string | null;
    curricularAreaId?: string | null;
    loanPurpose: 'CLASS' | 'EVENT';
    purposeDetails: string;
}

export type LoanWizardAction =
    | { type: 'OPEN'; payload?: Resource[] }
    | { type: 'CLOSE' }
    | { type: 'SET_VIEW_STATE'; payload: 'CONTEXT' | 'CATALOG' }
    | { type: 'SELECT_STAFF'; payload: Staff | null }
    | { type: 'SET_METADATA'; payload: { gradeId?: string | null; sectionId?: string | null; curricularAreaId?: string | null; loanPurpose?: 'CLASS' | 'EVENT'; purposeDetails?: string } }
    | { type: 'ADD_TO_CART'; payload: Resource }
    | { type: 'REMOVE_FROM_CART'; payload: string }
    | { type: 'CLEAR_CART' };
