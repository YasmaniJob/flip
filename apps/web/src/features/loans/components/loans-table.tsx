
import { Loan } from '@/features/loans/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/atoms/button';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { ReturnLoanModal } from './return/return-loan-dialog';

interface LoansTableProps {
    loans: Loan[];
    showReturnAction?: boolean;
}

function LoanStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'active':
            return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"><Clock className="w-3 h-3 mr-1" /> Activo</div>;
        case 'returned':
            return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Devuelto</div>;
        case 'overdue':
            return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50"><AlertCircle className="w-3 h-3 mr-1" /> Vencido</div>;
        default:
            return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">{status}</div>;
    }
}

export function LoansTable({ loans, showReturnAction = false }: LoansTableProps) {
    const [selectedLoanForReturn, setSelectedLoanForReturn] = useState<Loan | null>(null);

    return (
        <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b bg-muted/30">
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Responsable</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Recursos</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Fecha Préstamo</th>
                        {showReturnAction && <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {loans.map((loan) => (
                        <tr key={loan.id} className="transition-colors hover:bg-muted/30">
                            <td className="p-4 align-middle font-medium">
                                <div className="flex flex-col">
                                    <span className="text-foreground">{loan.staffName || loan.staffId || 'Desconocido'}</span>
                                    {/* <span className="text-xs text-muted-foreground">Docente</span> */}
                                </div>
                            </td>
                            <td className="p-4 align-middle">
                                <div className="max-w-[200px] truncate" title={loan.resourceNames?.join(', ')}>
                                    {loan.resourceNames?.length ? (
                                        <span className="inline-flex items-center gap-1">
                                            <span className="font-medium">{loan.resourceNames.length} items:</span>
                                            <span className="text-muted-foreground">{loan.resourceNames.join(', ')}</span>
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground italic">Sin recursos</span>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 align-middle">
                                <LoanStatusBadge status={loan.status} />
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">
                                {format(new Date(loan.loanDate), "d 'de' MMM, yyyy", { locale: es })}
                            </td>
                            {showReturnAction && (
                                <td className="p-4 align-middle text-right">
                                    {loan.status === 'active' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                                            onClick={() => setSelectedLoanForReturn(loan)}
                                        >
                                            Devolver
                                        </Button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedLoanForReturn && (
                <ReturnLoanModal
                    open={!!selectedLoanForReturn}
                    loan={selectedLoanForReturn}
                    onClose={() => setSelectedLoanForReturn(null)}
                />
            )}
        </div>
    );
}
