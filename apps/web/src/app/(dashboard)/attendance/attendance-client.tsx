'use client';

import { useMyTodayReservations, useMarkAttendance } from '@/features/reservations/hooks/use-reservations';
import { Button } from '@/components/atoms/button';
import { Check, Clock, Loader2, QrCode } from 'lucide-react';

export function AttendanceClient() {
    const { data: slots, isLoading, error } = useMyTodayReservations();
    const markAttendanceMutation = useMarkAttendance();

    const handleMarkAttendance = async (slotId: string) => {
        await markAttendanceMutation.mutateAsync({ slotId, attended: true });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">Cargando tus reservas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="text-center max-w-md">
                    <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <QrCode className="h-8 w-8 text-destructive" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground">Error</h1>
                    <p className="text-muted-foreground mt-2">{error.message}</p>
                </div>
            </div>
        );
    }

    const pendingSlots = slots?.filter(s => !s.attended) || [];
    const attendedSlots = slots?.filter(s => s.attended) || [];

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <QrCode className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Registro de Asistencia</h1>
                </div>

                {/* No reservations */}
                {slots?.length === 0 && (
                    <div className="bg-card rounded-2xl p-8 text-center border border-border">
                        <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <h2 className="font-medium text-foreground">No tienes reservas para hoy</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Puedes crear una reserva desde la sección de Reservaciones
                        </p>
                    </div>
                )}

                {/* Pending slots */}
                {pendingSlots.length > 0 && (
                    <div className="space-y-3 mb-6">
                        <h2 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
                            Pendientes de asistencia
                        </h2>
                        {pendingSlots.map(slot => (
                            <div
                                key={slot.id}
                                className="bg-card rounded-2xl p-4 border border-border"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-foreground">
                                            {slot.pedagogicalHour.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {slot.pedagogicalHour.startTime} - {slot.pedagogicalHour.endTime}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleMarkAttendance(slot.id)}
                                        disabled={markAttendanceMutation.isPending}
                                        className="rounded-full gap-2"
                                    >
                                        {markAttendanceMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                        Asistí
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Attended slots */}
                {attendedSlots.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
                            Asistencia registrada
                        </h2>
                        {attendedSlots.map(slot => (
                            <div
                                key={slot.id}
                                className="bg-success/5 rounded-2xl p-4 border border-success/20"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-foreground">
                                            {slot.pedagogicalHour.name}
                                        </div>
                                        <div className="text-sm text-success flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {slot.pedagogicalHour.startTime} - {slot.pedagogicalHour.endTime}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-success text-sm font-medium">
                                        <Check className="h-4 w-4" />
                                        Asistió
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
