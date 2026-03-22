'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/atoms/button';
import { useCancelSlot, useMarkAttendance, ReservationSlot } from '../hooks/use-reservations';
import { Check, X, Calendar, BookOpen, Clock, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafe, formatDateLocal } from '../utils/date-utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RescheduleDialog } from './reschedule-dialog';
import { useUserRole } from '@/hooks/use-user-role';

interface ReservationPopoverProps {
    slot: ReservationSlot;
    children: React.ReactNode;
}

export function ReservationPopover({ slot, children }: ReservationPopoverProps) {
    const [open, setOpen] = useState(false);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const { isTeacher } = useUserRole();

    const cancelMutation = useCancelSlot();
    const attendanceMutation = useMarkAttendance();

    const handleMarkAttendance = async () => {
        try {
            await attendanceMutation.mutateAsync({
                slotId: slot.id,
                attended: !slot.attended,
            });
            setOpen(false);
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleCancel = async () => {
        try {
            await cancelMutation.mutateAsync(slot.id);
            setConfirmCancelOpen(false);
            setOpen(false);
        } catch (error) {
            // Error handled by mutation
        }
    };

    const slotDate = parseDateSafe(slot.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // It's considered "past" if the day is strictly before today
    const isPastDay = slotDate < today;

    // We allow cancelling/rescheduling if it's NOT a past day 
    // OR if it's a past day but no attendance has been recorded yet.
    const canManage = !isPastDay || !slot.attended;

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    {children}
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100">
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${slot.attended ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                            <span className="text-xs font-medium text-slate-500">
                                {slot.attended ? 'Asistencia confirmada' : 'Pendiente'}
                            </span>
                        </div>
                        <h3 className="font-semibold text-slate-900">{slot.staff?.name || 'Sin docente'}</h3>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600">
                                {formatDateLocal(slotDate)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600">
                                {slot.pedagogicalHour.name}
                            </span>
                        </div>
                        {slot.grade && (
                            <div className="flex items-center gap-3 text-sm">
                                <BookOpen className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-600">
                                    {slot.grade.name} {slot.section?.name || ''}
                                </span>
                            </div>
                        )}
                        {slot.curricularArea && (
                            <div className="flex items-center gap-3 text-sm">
                                <BookOpen className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-600">
                                    Área: {slot.curricularArea.name}
                                </span>
                            </div>
                        )}
                        {slot.purpose && (
                            <div className="pt-2 border-t border-slate-100">
                                <p className="text-xs text-slate-500">{slot.purpose}</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-3 border-t border-slate-100 bg-slate-50 space-y-2">
                        {/* Attendance Toggle - visible for all roles */}
                        <Button
                            variant={slot.attended ? 'outline' : 'default'}
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={handleMarkAttendance}
                            disabled={attendanceMutation.isPending}
                        >
                            {slot.attended ? (
                                <>
                                    <X className="h-4 w-4" />
                                    Desmarcar asistencia
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Marcar asistencia
                                </>
                            )}
                        </Button>

                        {/* Reschedule - admin only */}
                        {!isTeacher && canManage && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                    setOpen(false);
                                    setRescheduleOpen(true);
                                }}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reprogramar
                            </Button>
                        )}

                        {/* Cancel - admin only */}
                        {!isTeacher && canManage && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setConfirmCancelOpen(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                                Cancelar reserva
                            </Button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La reserva de {slot.staff?.name}
                            para el {format(slotDate, "d 'de' MMMM", { locale: es })} será cancelada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={cancelMutation.isPending}
                        >
                            {cancelMutation.isPending ? 'Cancelando...' : 'Sí, cancelar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reschedule Dialog */}
            <RescheduleDialog
                slot={slot}
                open={rescheduleOpen}
                onOpenChange={setRescheduleOpen}
            />
        </>
    );
}

