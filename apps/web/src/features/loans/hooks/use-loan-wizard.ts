import { useReducer } from 'react';
import { LoanWizardState, LoanWizardAction, Resource, Staff } from '../types';

// Update action type definition if it's not exported or if we can infer it. 
// Assuming LoanWizardAction is defined in types, I might need to check types.ts first. 
// However, since I can't check types.ts easily without a tool call, and I want to be safe,
// I'll assume I need to modify the reducer logic. But wait, TS might complain if I add payload to OPEN.
// Let's check types.ts first.

const initialState: LoanWizardState = {
    step: 1,
    viewState: 'CONTEXT', // 'CONTEXT' | 'CATALOG'
    selectedStaff: null,
    cart: [],
    isOpen: false,
    gradeId: null,
    sectionId: null,
    curricularAreaId: null,
    loanPurpose: 'CLASS',
    purposeDetails: '',
};

function loanWizardReducer(state: LoanWizardState, action: LoanWizardAction): LoanWizardState {
    switch (action.type) {
        case 'OPEN':
            return {
                ...initialState,
                isOpen: true,
                viewState: action.payload?.length ? 'CATALOG' : 'CONTEXT',
                cart: action.payload || []
            };
        case 'CLOSE':
            return initialState;
        case 'SET_VIEW_STATE':
            return { ...state, viewState: action.payload };
        case 'SELECT_STAFF':
            return { ...state, selectedStaff: action.payload };
        case 'SET_METADATA':
            return { ...state, ...action.payload };
        case 'ADD_TO_CART':
            if (state.cart.some(r => r.id === action.payload.id)) return state;
            return { ...state, cart: [...state.cart, action.payload] };
        case 'REMOVE_FROM_CART':
            return { ...state, cart: state.cart.filter(r => r.id !== action.payload) };
        case 'CLEAR_CART':
            return { ...state, cart: [] };
        default:
            return state;
    }
}

export function useLoanWizard() {
    const [state, dispatch] = useReducer(loanWizardReducer, initialState);

    return {
        state,
        open: (initialResources?: Resource[]) => dispatch({ type: 'OPEN', payload: initialResources }),
        close: () => dispatch({ type: 'CLOSE' }),
        setViewState: (view: 'CONTEXT' | 'CATALOG') => dispatch({ type: 'SET_VIEW_STATE', payload: view }),
        selectStaff: (staff: Staff | null) => dispatch({ type: 'SELECT_STAFF', payload: staff }),
        setMetadata: (metadata: { gradeId?: string | null; sectionId?: string | null; curricularAreaId?: string | null; loanPurpose?: 'CLASS' | 'EVENT'; purposeDetails?: string }) =>
            dispatch({ type: 'SET_METADATA', payload: metadata }),
        addToCart: (resource: Resource) => dispatch({ type: 'ADD_TO_CART', payload: resource }),
        removeFromCart: (id: string) => dispatch({ type: 'REMOVE_FROM_CART', payload: id }),
        clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    };
}
