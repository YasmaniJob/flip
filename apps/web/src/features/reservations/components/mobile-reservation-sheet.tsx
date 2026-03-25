"use client";

import { ReservationSlot } from "@/features/reservations/api/reservations.api";
import { X, User, Clock, BookOpen, Users as UsersIcon, Calendar, Check, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MobileReservationSheetProps {
  slot: ReservationSlot | null;
  open: boolean;
  onClose: () => void;
  onViewDetails?: () => void;
  onMarkAttendance?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  canManage: boolean;
}

export function MobileReservationSheet({ 
  slot, 
  open, 
  onClose,
  onViewDetails,
  onMarkAttendance,
  onReschedule,
  onCancel,
  canManage
}: MobileReservationSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!slot) return null;

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'class':
        return {
          bg: 'rgba(24, 95, 165, 0.08)',
          border: '#185FA5',
          text: 'text-[#185FA5]'
        };
      case 'workshop':
        return {
          bg: 'rgba(34, 197, 94, 0.08)',
          border: '#22c55e',
          text: 'text-emerald-600'
        };
      case 'management':
        return {
          bg: 'rgba(251, 146, 60, 0.08)',
          border: '#fb923c',
          text: 'text-amber-600'
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.08)',
          border: '#94a3b8',
          text: 'text-slate-600'
        };
    }
  };

  const colors = getBlockColor(slot.type);
  const isPast = new Date(slot.date) < new Date();

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/30 z-[60] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 bg-card z-[60] transition-all duration-300 ease-out shadow-2xl rounded-t-[20px] overflow-hidden",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{ 
          maxHeight: isExpanded ? '95vh' : '70vh',
          height: isExpanded ? '95vh' : 'auto'
        }}
      >
        {/* Handle - Draggable */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex justify-center pt-3 pb-2 bg-card cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted"
          aria-label={isExpanded ? "Contraer" : "Expandir"}
        >
          <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
        </button>

        {/* Scrollable Content */}
        <div 
          className="overflow-y-auto" 
          style={{ 
            maxHeight: isExpanded ? 'calc(95vh - 28px)' : 'calc(70vh - 28px)'
          }}
        >
          {/* Header */}
          <div className="px-4 pb-4 border-b border-border/40 bg-card sticky top-0 z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">
                  {slot.title || slot.pedagogicalHour.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {slot.pedagogicalHour.startTime} - {slot.pedagogicalHour.endTime}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Type Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: colors.bg,
                  borderLeft: `3px solid ${colors.border}`
                }}
              >
                <span className={colors.text}>
                  {slot.type === 'class' ? 'Sesión de Clase' : 
                   slot.type === 'workshop' ? 'Proyecto/Taller' : 
                   'Gestión'}
                </span>
              </div>

              {/* Status Badge */}
              {isPast && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  Pendiente
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Staff */}
            {slot.staff && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Docente</p>
                  <p className="text-sm font-semibold text-foreground truncate">{slot.staff.name}</p>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(slot.date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
            </div>

            {/* Grade & Section */}
            {slot.grade && (
              <div className="flex items-center gap-3">
                <UsersIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Grado y Sección</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {slot.grade.name} {slot.section?.name}
                  </p>
                </div>
              </div>
            )}

            {/* Curricular Area */}
            {slot.curricularArea && (
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Área</p>
                  <p className="text-sm font-semibold text-foreground truncate">{slot.curricularArea.name}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {canManage && (
              <div className="space-y-2 pt-3 pb-4 border-t border-border/40 mt-4">
                {/* Mark Attendance - For all types */}
                {onMarkAttendance && (
                  <button
                    onClick={() => {
                      onMarkAttendance();
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors active:scale-[0.98]"
                  >
                    <Check className="h-4 w-4" />
                    Marcar asistencia
                  </button>
                )}

                {/* Reschedule - Always show */}
                {onReschedule && (
                  <button
                    onClick={() => {
                      onReschedule();
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-muted text-foreground rounded-lg font-semibold text-sm hover:bg-muted/80 transition-colors active:scale-[0.98]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reprogramar
                  </button>
                )}

                {/* Cancel - Always show */}
                {onCancel && (
                  <button
                    onClick={() => {
                      onCancel();
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-transparent text-destructive rounded-lg font-semibold text-sm hover:bg-destructive/10 transition-colors border border-destructive/20 active:scale-[0.98]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Cancelar reserva
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
