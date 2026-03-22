'use client';

import { format, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/atoms/button';
import { BookOpen, RotateCcw, Monitor, AlertTriangle, GraduationCap, Lightbulb, Clock, Check, X, User } from 'lucide-react';
import { cn, formatResourceId } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ReturnLoanModal } from './return/return-loan-dialog';
import { Loan } from '../types';
import { useState } from 'react';
import { useApproveLoan, useRejectLoan } from '../hooks/use-loans';
import { toast } from 'sonner';

interface LoanCardProps {
    loan: Loan;
    onReturn?: (loan: Loan) => void;
    readOnly?: boolean;
    canManage?: boolean;
}

// ─── Status logic ─────────────────────────────────────────────────────────────
type LoanStatus = 'active' | 'overdue' | 'returned';

const STATUS_STYLES: Record<LoanStatus, {
    border: string;
    leftBar: string;
    dateBlock: string;
    dateMonth: string;
    dateDay: string;
}> = {
    active: {
        border: 'border-border',
        leftBar: 'bg-primary/60',
        dateBlock: 'bg-muted border-border text-foreground',
        dateMonth: 'text-muted-foreground',
        dateDay: 'text-foreground',
    },
    overdue: {
        border: 'border-destructive/30',
        leftBar: 'bg-destructive',
        dateBlock: 'bg-destructive/10 border-destructive/30',
        dateMonth: 'text-destructive/70',
        dateDay: 'text-destructive',
    },
    returned: {
        border: 'border-border',
        leftBar: 'bg-success/60',
        dateBlock: 'bg-success/10 border-success/20',
        dateMonth: 'text-success/70',
        dateDay: 'text-success',
    },
};

export function LoanCard({ loan, onReturn: _onReturn, readOnly = false, canManage = false }: LoanCardProps) {
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const approveLoan = useApproveLoan();
    const rejectLoan = useRejectLoan();

    const status = loan.status as LoanStatus;
    const styles = STATUS_STYLES[status] ?? STATUS_STYLES.active;
    const isOverdue = status === 'overdue';
    const daysOverdue = isOverdue ? differenceInCalendarDays(new Date(), new Date(loan.loanDate)) : 0;
    const isPending = loan.approvalStatus === 'pending';
    const isRejected = loan.approvalStatus === 'rejected';

    return (
        <>
            <div className={cn(
                'bg-card rounded-lg border overflow-hidden transition-colors duration-200 flex shadow-none',
                isRejected ? 'border-destructive/30 opacity-75' : isPending ? 'border-amber-200 dark:border-amber-800/50' : styles.border
            )}>
                {/* Left status bar */}
                <div className={cn(
                    'w-1 shrink-0 transition-colors duration-300',
                    isRejected ? 'bg-destructive/60' : isPending ? 'bg-amber-400' : styles.leftBar
                )} />

                {/* Card body */}
                <div className="flex-1 min-w-0 px-5 py-4 flex items-start gap-4">
                    {/* Date badge */}
                    <div className={cn(
                        'shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-md border transition-colors duration-300 shadow-none',
                        isRejected ? 'bg-destructive/5 border-destructive/20' : isPending ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50' : styles.dateBlock
                    )}>
                        <span className={cn('text-[9px] font-bold uppercase tracking-wider leading-none', isRejected ? 'text-destructive/60' : isPending ? 'text-amber-500' : styles.dateMonth)}>
                            {format(new Date(loan.loanDate), 'MMM', { locale: es })}
                        </span>
                        <span className={cn('text-lg font-bold leading-tight tabular-nums', isRejected ? 'text-destructive/80' : isPending ? 'text-amber-600' : styles.dateDay)}>
                            {format(new Date(loan.loanDate), 'd')}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Meta row: time + status badges */}
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-muted-foreground">
                                {format(new Date(loan.loanDate), 'h:mm a', { locale: es })}
                            </span>
                            {isRejected && (
                                <>
                                    <span className="text-muted-foreground/30 text-xs">·</span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive">
                                        <X className="h-3 w-3" />
                                        Solicitud rechazada
                                    </span>
                                </>
                            )}
                            {isPending && !isRejected && (
                                <>
                                    <span className="text-muted-foreground/30 text-xs">·</span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                                        <Clock className="h-3 w-3" />
                                        Pendiente de aprobación
                                    </span>
                                </>
                            )}
                            {isOverdue && !isPending && !isRejected && (
                                <>
                                    <span className="text-muted-foreground/30 text-xs">·</span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-destructive/15 text-destructive">
                                        <AlertTriangle className="h-3 w-3" />
                                        Vencido · {daysOverdue} días
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Name — the title */}
                        <h3 className="text-sm font-semibold text-foreground leading-snug">
                            {loan.staffName || 'Docente Desconocido'}
                        </h3>

                        {/* Metadata pills */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {loan.curricularAreaName && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-muted-foreground">
                                    <BookOpen className="h-3 w-3" />
                                    {loan.curricularAreaName}
                                </span>
                            )}
                            {(loan.gradeName || loan.sectionName) && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-muted-foreground">
                                    <GraduationCap className="h-3 w-3" />
                                    {[loan.gradeName, loan.sectionName].filter(Boolean).join(' ')}
                                </span>
                            )}
                            {/* Student pickup note */}
                            {loan.studentPickupNote && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                                    <User className="h-3 w-3" />
                                    Recoge: {loan.studentPickupNote}
                                </span>
                            )}
                        </div>

                        {/* Resources */}
                        {loan.resources && loan.resources.length > 0 && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2">
                                <span className="text-xs font-semibold text-foreground">
                                    {loan.resources.length} {loan.resources.length === 1 ? 'Recurso' : 'Recursos'}:
                                </span>
                                {loan.resources.map((resource) => (
                                    <span key={resource.id} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                        <Monitor className="w-3.5 h-3.5" />
                                        {resource.name}
                                        {resource.internalId && (
                                            <span className="text-muted-foreground/60 ml-0.5">
                                                {formatResourceId(resource.internalId)}
                                            </span>
                                        )}

                                        {/* Damage report indicator */}
                                        {loan.damageReports?.[resource.id] && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        className="inline-flex ml-0.5 p-0.5 rounded-full hover:bg-destructive/10 transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/20"
                                                        title="Ver reporte de daños"
                                                    >
                                                        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80 p-0" align="start">
                                                    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2">
                                                        <h4 className="font-semibold text-destructive text-sm flex items-center gap-2">
                                                            <AlertTriangle className="w-4 h-4" />
                                                            Reporte de Daños
                                                        </h4>
                                                    </div>
                                                    <div className="p-4 space-y-3">
                                                        {loan.damageReports[resource.id].commonProblems?.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {loan.damageReports[resource.id].commonProblems.map((problem: string) => (
                                                                    <span key={problem} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/15 text-destructive">
                                                                        {problem}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {loan.damageReports[resource.id].otherNotes && (
                                                            <div className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded-md border border-border">
                                                                &ldquo;{loan.damageReports[resource.id].otherNotes}&rdquo;
                                                            </div>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}

                                        {/* Suggestion report indicator */}
                                        {loan.suggestionReports?.[resource.id] && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        className="inline-flex ml-0.5 p-0.5 rounded-full hover:bg-warning/10 transition-colors focus:outline-none focus:ring-2 focus:ring-warning/20"
                                                        title="Ver sugerencias"
                                                    >
                                                        <Lightbulb className="w-3.5 h-3.5 text-warning" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80 p-0" align="start">
                                                    <div className="bg-warning/10 border-b border-warning/20 px-4 py-2">
                                                        <h4 className="font-semibold text-warning-foreground text-sm flex items-center gap-2">
                                                            <Lightbulb className="w-4 h-4 text-warning" />
                                                            Sugerencia
                                                        </h4>
                                                    </div>
                                                    <div className="p-4 space-y-3">
                                                        {loan.suggestionReports[resource.id].commonSuggestions?.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {loan.suggestionReports[resource.id].commonSuggestions.map((suggestion: string) => (
                                                                    <span key={suggestion} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning/15 text-warning-foreground">
                                                                        {suggestion}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {loan.suggestionReports[resource.id].otherNotes && (
                                                            <div className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded-md border border-border">
                                                                &ldquo;{loan.suggestionReports[resource.id].otherNotes}&rdquo;
                                                            </div>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="shrink-0 self-center flex flex-col gap-2">
                        {/* Admin/PIP: approve pending loans */}
                        {canManage && isPending && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="jira"
                                    className="gap-1.5"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        approveLoan.mutate(loan.id, {
                                            onSuccess: () => toast.success(`Préstamo de ${loan.staffName || 'docente'} aprobado`),
                                            onError: () => toast.error('Error al aprobar el préstamo'),
                                        });
                                    }}
                                    disabled={approveLoan.isPending || rejectLoan.isPending}
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Aprobar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-1.5"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        rejectLoan.mutate(loan.id, {
                                            onSuccess: () => toast.success(`Solicitud de ${loan.staffName || 'docente'} rechazada`),
                                            onError: () => toast.error('Error al rechazar la solicitud'),
                                        });
                                    }}
                                    disabled={approveLoan.isPending || rejectLoan.isPending}
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Rechazar
                                </Button>
                            </div>
                        )}
                        {/* Return button — only when active/overdue and not pending/rejected */}
                        {!readOnly && !isPending && !isRejected && (
                            <Button
                                size="sm"
                                variant={isOverdue ? "destructive" : "jira"}
                                className="shadow-none"
                                onClick={() => setIsReturnModalOpen(true)}
                            >
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                {isOverdue ? 'Registrar Devolución' : 'Devolver'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>


            {isReturnModalOpen && (
                <ReturnLoanModal
                    open={isReturnModalOpen}
                    loan={loan}
                    onClose={() => setIsReturnModalOpen(false)}
                />
            )}
        </>
    );
}
