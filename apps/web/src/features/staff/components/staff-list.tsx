"use client";

import { useState, useEffect, useDeferredValue, lazy, Suspense, memo } from "react";
import { Plus, Search, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStaff } from "../hooks/use-staff";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

// Lazy load dialogs
const AddStaffDialog = lazy(() => import("./add-staff-dialog").then(m => ({ default: m.AddStaffDialog })));
const ImportStaffDialog = lazy(() => import("./import-staff-dialog").then(m => ({ default: m.ImportStaffDialog })));
const ConfirmDeleteDialog = lazy(() => import("@/components/molecules/confirm-delete-dialog").then(m => ({ default: m.ConfirmDeleteDialog })));

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffMember {
    id: string;
    name: string;
    dni?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    area?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TH = "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60";

function roleLabel(role?: string | null) {
    if (!role) return "Docente";
    const r = role.toLowerCase();
    switch (r) {
        case "superadmin": return "Superadmin";
        case "admin":      return "Admin";
        case "pip":        return "PIP";
        default:           return "Docente";
    }
}

// ─── Skeleton Component ───────────────────────────────────────────────────────

const TableSkeleton = memo(() => (
    <>
        {[...Array(5)].map((_, i) => (
            <tr key={i} className="animate-pulse">
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-muted/50" />
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-muted/50" />
                            <div className="h-3 w-20 bg-muted/30" />
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4"><div className="h-3 w-16 bg-muted/50" /></td>
                <td className="px-6 py-4"><div className="h-3 w-32 bg-muted/50" /></td>
                <td className="px-6 py-4"><div className="h-3 w-20 bg-muted/50" /></td>
                <td className="px-6 py-4"><div className="h-8 w-16 bg-muted/50 ml-auto" /></td>
            </tr>
        ))}
    </>
));
TableSkeleton.displayName = "TableSkeleton";

// ─── Staff Row Component ──────────────────────────────────────────────────────

interface StaffRowProps {
    person: StaffMember;
    onEdit: (person: StaffMember) => void;
    onDelete: (person: StaffMember) => void;
}

const StaffRow = memo(({ person, onEdit, onDelete }: StaffRowProps) => (
    <tr className="group hover:bg-muted/20 transition-colors">
        <td className="px-6 py-4">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 border border-border bg-muted/30 flex items-center justify-center text-xs font-black text-foreground/60 shrink-0">
                    {person.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="text-sm font-black text-foreground uppercase tracking-tight">
                        {person.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border border-border text-muted-foreground/60">
                            {roleLabel(person.role)}
                        </span>
                        {person.area && (
                            <span className="text-[10px] text-muted-foreground/50">
                                · {person.area}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </td>
        <td className="px-6 py-4 font-mono text-[10px] text-foreground/60">
            {person.dni ?? "—"}
        </td>
        <td className="px-6 py-4 text-xs text-muted-foreground/70">
            {person.email ?? "—"}
        </td>
        <td className="px-6 py-4 font-mono text-[10px] text-foreground/60">
            {person.phone ?? "—"}
        </td>
        <td className="px-6 py-4 text-right">
            <div className="flex justify-end gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none border border-transparent hover:border-border hover:bg-background text-muted-foreground hover:text-foreground"
                    title="Editar"
                    onClick={() => onEdit(person)}
                >
                    <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none border border-transparent hover:border-destructive/20 hover:bg-destructive/5 text-muted-foreground hover:text-destructive"
                    title="Eliminar"
                    onClick={() => onDelete(person)}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </td>
    </tr>
));
StaffRow.displayName = "StaffRow";

// ─── Component ────────────────────────────────────────────────────────────────

export function StaffList() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);

    // Reset page when search changes
    useEffect(() => {
        setPage(1);
    }, [deferredSearch]);

    const { staff, meta, isLoading, deleteStaff } = useStaff({ 
        page, 
        limit: 10, 
        search: deferredSearch,
        includeAdmins: true 
    });

    const openAdd = () => { setEditingStaff(null); setIsAddOpen(true); };
    const openEdit = (person: StaffMember) => { setEditingStaff(person); setIsAddOpen(true); };

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">

            <PageHeader
                title="Personal"
                primaryAction={{
                    label: "Nuevo Personal",
                    onClick: openAdd
                }}
                secondaryActions={[
                    {
                        label: "Importar",
                        onClick: () => setIsImportOpen(true),
                        variant: "outline"
                    }
                ]}
            />

            {/* Toolbar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 z-10" />
                <Input
                    type="search"
                    placeholder="Buscar por nombre, DNI, email, teléfono, área o rol..."
                    className="pl-9 h-9 rounded-none border-border bg-background font-medium placeholder:text-muted-foreground/40 focus-visible:ring-primary"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-card border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border">
                                <th className={TH}>Nombre</th>
                                <th className={TH}>DNI</th>
                                <th className={TH}>Email</th>
                                <th className={TH}>Teléfono</th>
                                <th className={cn(TH, "text-right")}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoading ? (
                                <TableSkeleton />
                            ) : staff?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-12 w-12 border border-dashed border-border flex items-center justify-center text-muted-foreground/30">
                                                <Plus className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground uppercase tracking-tight">
                                                    Sin personal registrado
                                                </p>
                                                <p className="text-xs text-muted-foreground/60 mt-1">
                                                    Comienza agregando docentes o administrativos
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={openAdd}>
                                                <Plus className="h-3.5 w-3.5 mr-2" />
                                                Agregar el primero
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                staff?.map((person: StaffMember) => (
                                    <StaffRow
                                        key={person.id}
                                        person={person}
                                        onEdit={openEdit}
                                        onDelete={setDeletingStaff}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta && meta.totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-card">
                        <span className="text-xs text-muted-foreground/60 font-bold uppercase tracking-widest">
                            Página{" "}
                            <span className="text-foreground">{meta.page}</span>
                            {" "}de{" "}
                            <span className="text-foreground">{meta.totalPages}</span>
                        </span>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={!meta.hasPreviousPage}
                                className="h-7 px-3 rounded-none border border-border text-xs font-bold"
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={!meta.hasNextPage}
                                className="h-7 px-3 rounded-none border border-border text-xs font-bold"
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dialogs - Lazy loaded */}
            <Suspense fallback={null}>
                {isAddOpen && (
                    <AddStaffDialog
                        open={isAddOpen}
                        onOpenChange={open => { setIsAddOpen(open); if (!open) setEditingStaff(null); }}
                        initialData={editingStaff as any}
                    />
                )}
                {isImportOpen && (
                    <ImportStaffDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
                )}
                {deletingStaff && (
                    <ConfirmDeleteDialog
                        open={!!deletingStaff}
                        onOpenChange={open => !open && setDeletingStaff(null)}
                        onConfirm={async () => { if (deletingStaff) { await deleteStaff.mutateAsync(deletingStaff.id); setDeletingStaff(null); } }}
                        title="¿Eliminar personal?"
                        description={<span>Vas a eliminar a <span className="font-bold">{deletingStaff?.name}</span> del sistema. Esta acción no se puede deshacer.</span>}
                        isLoading={deleteStaff.isPending}
                    />
                )}
            </Suspense>
        </div>
    );
}
