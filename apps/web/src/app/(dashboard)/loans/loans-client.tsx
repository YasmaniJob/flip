'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useLoans, type Loan } from '@/features/loans/hooks/use-loans';
import { Button } from '@/components/atoms/button';
import { Plus, Clock } from 'lucide-react';
import { LoanCard } from '@/features/loans/components/loan-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserRole } from '@/hooks/use-user-role';

import { Loader2 } from 'lucide-react';

const LoanWizard = dynamic(
    () => import('@/features/loans/components/wizard/loan-wizard').then(m => m.LoanWizard),
    {
        ssr: false,
        loading: () => (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    <p className="text-xs font-medium text-muted-foreground">Cargando...</p>
                </div>
            </div>
        )
    }
);

export function LoansClient() {
    const searchParams = useSearchParams();
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('active');
    const { canManage } = useUserRole();

    // Flags for smart tab logic
    const initialTabSet = useRef(false);
    const prevRejectedCount = useRef(0);

    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setIsWizardOpen(true);
        }
    }, [searchParams]);

    const { data: loansData, isLoading, error } = useLoans();
    const loans = loansData as Loan[] | undefined;

    // Pending — only visible to admins/PIP as a separate tab
    const pendingLoans = canManage
        ? loans?.filter((l: Loan) => l.approvalStatus === 'pending') || []
        : [];

    // Active: not returned, not rejected, not pending (for admin)
    const activeLoans = loans
        ?.filter((l: Loan) => {
            if (l.status === 'returned') return false;
            if (l.approvalStatus === 'rejected') return false;
            if (canManage && l.approvalStatus === 'pending') return false;
            return true;
        })
        .sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime()) || [];

    // History: returned + rejected (everyone)
    const historyLoans = loans
        ?.filter(l => l.status === 'returned' || l.approvalStatus === 'rejected')
        .sort((a, b) =>
            new Date(b.returnDate || b.loanDate).getTime() - new Date(a.returnDate || a.loanDate).getTime()
        ) || [];

    // ─── Smart tab selection ──────────────────────────────────────────────────
    // Admin/PIP: auto-switch to pending whenever new pending loans appear
    useEffect(() => {
        if (canManage && pendingLoans.length > 0) {
            setActiveTab('pending');
        }
    }, [canManage, pendingLoans.length]);

    // All users: on first data load, open the tab with the most recent action
    useEffect(() => {
        if (!loans || initialTabSet.current) return;
        initialTabSet.current = true;

        if (canManage && pendingLoans.length > 0) return;

        const mostRecentActive = activeLoans[0];
        const mostRecentHistory = historyLoans[0];

        if (mostRecentHistory && mostRecentActive) {
            const historyTime = new Date(mostRecentHistory.returnDate || mostRecentHistory.loanDate).getTime();
            const activeTime = new Date(mostRecentActive.loanDate).getTime();
            setActiveTab(historyTime > activeTime ? 'history' : 'active');
        } else if (!mostRecentActive && mostRecentHistory) {
            setActiveTab('history');
        }
    }, [loans]); // intentionally only on first arrival

    // Teacher: auto-switch to Historial when a new rejection appears mid-session
    const rejectedCount = historyLoans.filter(l => l.approvalStatus === 'rejected').length;
    useEffect(() => {
        if (canManage || !initialTabSet.current) return; // skip before initial tab is set
        if (rejectedCount > prevRejectedCount.current) {
            setActiveTab('history');
        }
        prevRejectedCount.current = rejectedCount;
    }, [rejectedCount, canManage]);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando préstamos...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error al cargar los préstamos</div>;

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-foreground">Gestión de Préstamos</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsWizardOpen(true)} variant="jira" size="lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Nuevo Préstamo
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 mb-6">
                    {/* Pending tab — admin/PIP only */}
                    {canManage && (
                        <TabsTrigger
                            value="pending"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 data-[state=active]:bg-transparent px-0 py-2 font-medium"
                        >
                            Pendientes
                            {pendingLoans.length > 0 && (
                                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                                    {pendingLoans.length}
                                </span>
                            )}
                        </TabsTrigger>
                    )}
                    <TabsTrigger
                        value="active"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 py-2 font-medium"
                    >
                        Activos ({activeLoans.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 py-2 font-medium"
                    >
                        Historial
                        {(() => {
                            const rejectedCount = historyLoans.filter(l => l.approvalStatus === 'rejected').length;
                            if (rejectedCount > 0) return (
                                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold">
                                    {rejectedCount}
                                </span>
                            );
                            if (historyLoans.length > 0) return (
                                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                                    {historyLoans.length}
                                </span>
                            );
                            return null;
                        })()}
                    </TabsTrigger>
                </TabsList>

                {/* Pending tab content */}
                {canManage && (
                    <TabsContent value="pending" className="space-y-4 mt-0 focus-visible:ring-0">
                        {pendingLoans.length > 0 ? (
                            <div className="grid gap-4">
                                {pendingLoans.map(loan => (
                                    <LoanCard key={loan.id} loan={loan} canManage readOnly />
                                ))}
                            </div>
                        ) : (
                            <div className="p-16 text-center text-muted-foreground border border-border rounded-lg bg-muted/30">
                                No hay solicitudes pendientes de aprobación.
                            </div>
                        )}
                    </TabsContent>
                )}

                <TabsContent value="active" className="space-y-4 mt-0 focus-visible:ring-0">
                    {activeLoans.length > 0 ? (
                        <div className="grid gap-4">
                            {activeLoans.map(loan => (
                                <LoanCard key={loan.id} loan={loan} canManage={canManage} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-16 text-center border border-border rounded-lg bg-muted/30">
                            <div className="h-12 w-12 bg-background rounded-full flex items-center justify-center mb-4 border border-border">
                                <Clock className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-foreground">No hay préstamos activos</h3>
                            <p className="text-sm text-muted-foreground mt-1">Todo el material está en inventario o ha sido devuelto.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4 mt-0 focus-visible:ring-0">
                    {historyLoans.length > 0 ? (
                        <div className="grid gap-4 opacity-75">
                            {historyLoans.map(loan => (
                                <LoanCard key={loan.id} loan={loan} readOnly />
                            ))}
                        </div>
                    ) : (
                        <div className="p-16 text-center text-muted-foreground border border-border rounded-lg bg-muted/30">
                            No hay historial de préstamos devueltos.
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <LoanWizard
                open={isWizardOpen}
                onOpenChange={setIsWizardOpen}
            />
        </div>
    );
}
