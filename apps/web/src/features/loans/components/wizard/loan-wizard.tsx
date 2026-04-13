'use client';

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, ChevronLeft, X, Loader2, User } from "lucide-react";
import { StaffSelectionStep } from "./staff-selection-step";
import { ResourceSelectionStep } from "./resource-selection-step";
import { TeacherContextStep } from "./teacher-context-step";
import { useLoanWizard } from "../../hooks/use-loan-wizard";
import { useCreateLoan } from "../../hooks/use-loans";
import { Resource } from "../../types";
import { useCategories } from "@/features/inventory/hooks/use-categories";
import { useDebounce } from "@/hooks/use-debounce";
import { useUserRole } from "@/hooks/use-user-role";
import { useConfigLoadout } from "@/features/settings/hooks/use-config-loadout";
import { useMemo } from "react";
import { cn } from "@/lib/utils";


interface LoanWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialResources?: Resource[];
}

export function LoanWizard({ open, onOpenChange, initialResources }: LoanWizardProps) {
    const { state, selectStaff, setMetadata, addToCart, removeFromCart, clearCart, setViewState } = useLoanWizard();
    const { isTeacher, user } = useUserRole();

    // Stage State
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [studentPickupNote, setStudentPickupNote] = useState("");

    // Reset when opening
    useEffect(() => {
        if (open) {
            setStudentPickupNote("");
            if (initialResources?.length) {
                clearCart();
                initialResources.forEach(r => addToCart(r));

                // If teacher, they are the staff, so we can go to CATALOG
                // If admin, they MUST identify the borrower first
                if (isTeacher) {
                    setViewState('CATALOG');
                } else {
                    setViewState('CONTEXT');
                }
            } else {
                setViewState('CONTEXT');
            }
        }
    }, [open, initialResources, isTeacher]);

    const { data: categories } = useCategories({ hasResources: true });
    const createLoan = useCreateLoan();

    // Unified Data Loadout (Same as reservation modal)
    const { data: config } = useConfigLoadout();
    const grades = config?.grades;
    const curricularAreas = config?.curricularAreas;
    const sections = config?.sections;

    const gradeName = useMemo(() => state.gradeId 
        ? grades?.find(g => g.id === state.gradeId)?.name.replace('Grado', '').trim() || ''
        : '', [state.gradeId, grades]);

    const sectionName = useMemo(() => state.sectionId 
        ? sections?.find(s => s.id === state.sectionId)?.name || ''
        : '', [state.sectionId, sections]);

    const areaName = useMemo(() => state.curricularAreaId 
        ? curricularAreas?.find(a => a.id === state.curricularAreaId)?.name || 'ÁREA'
        : '', [state.curricularAreaId, curricularAreas]);

    const handleCreate = () => {
        createLoan.mutate(
            {
                staffId: isTeacher ? undefined : state.selectedStaff?.id,
                resourceIds: state.cart.map((r) => r.id),
                gradeId: state.gradeId || undefined,
                sectionId: state.sectionId || undefined,
                curricularAreaId: state.curricularAreaId || undefined,
                studentPickupNote: studentPickupNote.trim() || undefined,
                purpose: state.loanPurpose === 'EVENT' ? state.purposeDetails?.trim() : undefined,
            },
            {
                onSuccess: () => {
                    onOpenChange(false);
                    clearCart();
                    setSelectedCategoryId(null);
                    setSearch("");
                    setStudentPickupNote("");
                    setMetadata({ gradeId: null, sectionId: null, curricularAreaId: null, loanPurpose: 'CLASS', purposeDetails: '' });
                },
                onError: (error: Error) => {
                    alert(`Error al crear el préstamo: ${error.message}`);
                },
            }
        );
    };

    const isReadyToCreate = isTeacher
        ? state.cart.length > 0
        : !!state.selectedStaff && state.cart.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="sm:max-w-[900px] w-[95vw] max-h-[88vh] min-h-[560px] h-auto p-0 flex flex-col overflow-hidden border border-border shadow-none bg-background rounded-md">
                <DialogTitle className="sr-only">Nuevo Pedido de Recursos</DialogTitle>

                {/* Vertical Top-Down Layout */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* 1. Header: Slim Manifest Summary */}
                    <header className="shrink-0 border-b border-border bg-muted/20 px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-primary rounded-full" />
                                <h2 className="text-sm font-black text-foreground tracking-widest uppercase">
                                    {state.viewState === 'CONTEXT' 
                                        ? (isTeacher ? 'Configurar Préstamo' : (state.selectedStaff ? 'Ficha de Préstamo' : 'Identificación del Responsable'))
                                        : 'Selección de Recursos'
                                    }
                                </h2>
                            </div>

                            {/* Live Summary Chips (Persistent in CATALOG mode) */}
                            {state.viewState === 'CATALOG' && (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                                    <div className="h-4 w-px bg-border mx-1" />

                                    {(!isTeacher && !state.selectedStaff) ? (
                                        <button
                                            onClick={() => setViewState('CONTEXT')}
                                            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10 border border-destructive/20 text-[9px] font-bold text-destructive uppercase tracking-widest hover:bg-destructive/20 transition-colors"
                                        >
                                            <User className="h-3 w-3" />
                                            Sin Responsable
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border text-[9px] font-bold text-foreground uppercase tracking-widest">
                                                <User className="h-3 w-3 text-primary" />
                                                {isTeacher ? "Tú (Docente)" : state.selectedStaff?.name}
                                            </div>
                                            {state.curricularAreaId && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border text-[9px] font-bold text-muted-foreground uppercase tracking-widest max-w-[220px]">
                                                    {gradeName && <span className="shrink-0 text-foreground">{gradeName}G</span>}
                                                    {sectionName && <span className="shrink-0 text-foreground">{sectionName}</span>}
                                                    {(gradeName || sectionName) && <span className="shrink-0 text-border">•</span>}
                                                    <span className="truncate" title={areaName}>{areaName}</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setViewState('CONTEXT')}
                                                className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest ml-2"
                                            >
                                                Cambiar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => onOpenChange(false)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-md transition-colors text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </header>

                    {/* 2. Main Discovery Canvas */}
                    <main className="flex-1 flex flex-col bg-background overflow-hidden relative">
                        {state.viewState === 'CONTEXT' ? (
                            <div className="overflow-y-auto p-7 w-full custom-scrollbar animate-in fade-in zoom-in-95 duration-300">
                                {isTeacher ? (
                                    // Teacher View: Show their name and context selection
                                    <div className="space-y-8">
                                        <div className="text-center space-y-3">
                                            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
                                                <User className="h-7 w-7 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Responsable del Préstamo</p>
                                                <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">{user?.name || 'Docente'}</h3>
                                            </div>
                                        </div>
                                        <TeacherContextStep
                                            gradeId={state.gradeId}
                                            sectionId={state.sectionId}
                                            curricularAreaId={state.curricularAreaId}
                                            onGradeChange={(id) => setMetadata({ gradeId: id })}
                                            onSectionChange={(id) => setMetadata({ sectionId: id })}
                                            onCurricularAreaChange={(id) => setMetadata({ curricularAreaId: id })}
                                            loanPurpose={state.loanPurpose}
                                            purposeDetails={state.purposeDetails}
                                            onPurposeChange={(purpose) => setMetadata({ loanPurpose: purpose })}
                                            onPurposeDetailsChange={(details) => setMetadata({ purposeDetails: details })}
                                        />
                                    </div>
                                ) : (
                                    // Admin View: Show staff selection
                                    <div className="flex flex-col gap-5">
                                        {!state.selectedStaff && (
                                            <div className="text-center space-y-2 mb-6 transition-all duration-300">
                                                <div className="mx-auto w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 border border-primary/20 mb-2">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-foreground tracking-tight uppercase mb-1">Identificación del Responsable</h3>
                                                    <p className="text-sm text-muted-foreground font-medium">Busca al docente o personal administrativo que solicita el recurso.</p>
                                                </div>
                                            </div>
                                        )}
                                        <StaffSelectionStep
                                            discovery
                                            selectedStaff={state.selectedStaff}
                                            onSelect={(staff) => {
                                                selectStaff(staff);
                                            }}
                                            gradeId={state.gradeId}
                                            sectionId={state.sectionId}
                                            curricularAreaId={state.curricularAreaId}
                                            loanPurpose={state.loanPurpose}
                                            purposeDetails={state.purposeDetails}
                                            onGradeChange={(id) => setMetadata({ gradeId: id })}
                                            onSectionChange={(id) => setMetadata({ sectionId: id })}
                                            onCurricularAreaChange={(id) => setMetadata({ curricularAreaId: id })}
                                            onPurposeChange={(purpose) => setMetadata({ loanPurpose: purpose })}
                                            onPurposeDetailsChange={(details) => setMetadata({ purposeDetails: details })}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Catalog Controls */}
                                <div className="shrink-0 px-7 py-5 border-b border-border/50 space-y-3">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1 relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <input
                                                autoFocus
                                                className="w-full bg-muted/20 border border-border rounded-md h-12 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all hover:bg-muted/30 focus:bg-background focus:border-primary/30"
                                                placeholder="Buscar por nombre, modelo o ID de recurso..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="md:w-72 relative">
                                            <input
                                                className="w-full bg-muted/20 border border-border rounded-md h-12 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/30"
                                                placeholder="¿Quién recoge? (Opcional)"
                                                value={studentPickupNote}
                                                onChange={(e) => setStudentPickupNote(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Category Filters */}
                                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
                                        <button
                                            onClick={() => setSelectedCategoryId(null)}
                                            className={cn(
                                                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all border",
                                                selectedCategoryId === null
                                                    ? "bg-foreground text-background border-foreground"
                                                    : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                                            )}
                                        >
                                            Todos
                                        </button>
                                        {categories?.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCategoryId(cat.id)}
                                                className={cn(
                                                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all flex items-center gap-2 border",
                                                    selectedCategoryId === cat.id
                                                        ? "bg-foreground text-background border-foreground"
                                                        : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                                                )}
                                            >
                                                <span className="opacity-70">{cat.icon}</span>
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Catalog List */}
                                <div className="flex-1 min-h-0 overflow-y-auto px-7 py-5 custom-scrollbar">
                                    <ResourceSelectionStep
                                        cart={state.cart}
                                        onAdd={addToCart}
                                        onRemove={removeFromCart}
                                        selectedCategoryId={selectedCategoryId}
                                        searchQuery={debouncedSearch}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Action Bar (Fixed footer for both steps) */}
                        <div className="shrink-0 px-7 py-4 bg-background border-t border-border flex items-center justify-between gap-4">
                            {/* Lado Izquierdo: Botón 'Atrás' */}
                            <div>
                                {state.viewState === 'CATALOG' ? (
                                    <Button
                                        variant="ghost"
                                        onClick={() => setViewState('CONTEXT')}
                                        className="font-bold px-4 text-muted-foreground hover:text-foreground gap-1.5"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Atrás
                                    </Button>
                                ) : state.viewState === 'CONTEXT' && state.selectedStaff && !isTeacher ? (
                                    <Button
                                        variant="ghost"
                                        onClick={() => selectStaff(null)}
                                        className="font-bold px-4 text-muted-foreground hover:text-foreground gap-1.5"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Atrás
                                    </Button>
                                ) : null}
                            </div>

                            {/* Lado Derecho: Cancelar + CTA de cada paso */}
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="font-bold px-4 md:px-6 text-muted-foreground hover:text-foreground"
                                >
                                    Cancelar
                                </Button>

                                {state.viewState === 'CONTEXT' ? (() => {
                                    // Validar que se pueda continuar al catálogo
                                    let canProceedToCatalog = false;
                                    if (isTeacher) {
                                        // Teachers must follow same rules as admin
                                        if (state.loanPurpose === 'CLASS') {
                                            // En clase regular, exigimos al menos Sección
                                            canProceedToCatalog = !!state.sectionId;
                                        } else {
                                            // En Evento, exigimos que haya escrito el motivo
                                            canProceedToCatalog = (state.purposeDetails || '').trim().length > 3;
                                        }
                                    } else if (state.selectedStaff) {
                                        if (state.loanPurpose === 'CLASS') {
                                            // En clase regular, exigimos al menos Área, Grado y Sección (o solo Sección si no hay áreas)
                                            canProceedToCatalog = !!state.sectionId;
                                        } else {
                                            // En Evento, exigimos que haya escrito el motivo
                                            canProceedToCatalog = (state.purposeDetails || '').trim().length > 3;
                                        }
                                    }

                                    return (
                                        <Button
                                            disabled={!canProceedToCatalog}
                                            onClick={() => setViewState('CATALOG')}
                                            className="px-6 md:px-10 h-11 font-black uppercase tracking-widest text-xs shadow-none"
                                        >
                                            Continuar al Catálogo
                                            <ChevronRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    );
                                })() : (
                                    <Button
                                        onClick={handleCreate}
                                        disabled={!isReadyToCreate || createLoan.isPending}
                                        className="min-w-[200px] md:min-w-[280px] font-black h-11 text-xs uppercase tracking-widest shadow-none"
                                    >
                                        {createLoan.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            `Confirmar (${state.cart.length})`
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </DialogContent>
        </Dialog>
    );
}
