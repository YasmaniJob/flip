'use client';

import { useState, useRef } from 'react';
import { Meeting } from '../api/meetings.api';
import { parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
    Users,
    GraduationCap,
    Briefcase,
    Sparkles,
    ChevronDown,
    Trash2,
    Calendar,
    User,
    Loader2,
    Clock,
    CheckCircle2,
    Circle,
} from 'lucide-react';
import { useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/use-meetings';

interface MeetingCardProps {
    meeting: Meeting;
}

const ACTOR_ICONS: Record<string, any> = {
    'docentes': GraduationCap,
    'director(a)': Briefcase,
    'sub-director(a)': Users,
    'coordinadores': Users,
    'otros': Sparkles,
};

// ─── Status logic ────────────────────────────────────────────────────────────
type MeetingStatus = 'no-agreements' | 'pending' | 'done';

function getMeetingStatus(total: number, completed: number): MeetingStatus {
    if (total === 0) return 'no-agreements';
    if (completed === total) return 'done';
    return 'pending';
}

const STATUS_STYLES = {
    'no-agreements': {
        border: 'border-border',
        leftBar: 'bg-border',
        dateBlock: 'bg-muted border-border text-foreground',
        dateMonth: 'text-muted-foreground',
        dateDay: 'text-foreground',
        badge: null,
    },
    'pending': {
        border: 'border-amber-200 dark:border-amber-900/50',
        leftBar: 'bg-amber-400',
        dateBlock: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
        dateMonth: 'text-amber-600 dark:text-amber-400',
        dateDay: 'text-amber-700 dark:text-amber-300',
        badge: { label: 'pendientes', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
    },
    'done': {
        border: 'border-emerald-200 dark:border-emerald-900/50',
        leftBar: 'bg-emerald-400',
        dateBlock: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
        dateMonth: 'text-emerald-600 dark:text-emerald-400',
        dateDay: 'text-emerald-700 dark:text-emerald-300',
        badge: { label: 'Completo', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
    },
} as const;

export function MeetingCard({ meeting }: MeetingCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [draftText, setDraftText] = useState('');
    const draftRef = useRef<HTMLInputElement>(null);

    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();

    const total = meeting.tasks?.length || 0;
    const completed = meeting.tasks?.filter(t => t.status === 'completed').length || 0;
    const pending = total - completed;
    const status = getMeetingStatus(total, completed);
    const styles = STATUS_STYLES[status];

    const getActorIcon = (actor: string) => {
        const key = actor.toLowerCase().split(':')[0].trim();
        return ACTOR_ICONS[key] || Users;
    };

    const handleToggleTask = (taskId: string, currentStatus: string) => {
        updateTask.mutate({
            taskId,
            task: { status: currentStatus === 'completed' ? 'pending' : 'completed' }
        });
    };


    const handleDelete = (taskId: string) => {
        deleteTask.mutate(taskId);
    };

    // Strip time/timezone before parsing so "2026-02-21T05:00:00.000Z" → "2026-02-21" → local midnight
    const meetingDate = parseISO(meeting.date.slice(0, 10));

    return (
        <div
            className={cn(
                'bg-card rounded-lg border shadow-none overflow-hidden transition-colors duration-200',
                'flex',
                styles.border
            )}
        >
            {/* Left status bar */}
            <div className={cn('w-1 shrink-0 transition-colors duration-300', styles.leftBar)} />

            {/* Card body — fully clickable header */}
            <div className="flex-1 min-w-0">
                {/* Clickable header row */}
                <button
                    className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-muted/30 transition-colors duration-150"
                    onClick={() => setExpanded(v => !v)}
                    aria-expanded={expanded}
                >
                    {/* Date block */}
                    <div className={cn(
                        'shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-lg border transition-colors duration-300',
                        styles.dateBlock
                    )}>
                        <span className={cn('text-[9px] font-bold uppercase tracking-wider leading-none', styles.dateMonth)}>
                            {format(meetingDate, 'MMM', { locale: es })}
                        </span>
                        <span className={cn('text-lg font-bold leading-tight tabular-nums', styles.dateDay)}>
                            {format(meetingDate, 'd')}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Meta row: time + status badge */}
                        <div className="flex items-center gap-2 mb-0.5">
                            {meeting.startTime && (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {meeting.startTime}
                                </span>
                            )}
                            {total > 0 && (
                                <>
                                    <span className="text-muted-foreground/30 text-xs">·</span>
                                    {status === 'done' ? (
                                        <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md', styles.badge?.bg)}>
                                            <CheckCircle2 className="h-3 w-3" />
                                            {styles.badge?.label}
                                        </span>
                                    ) : (
                                        <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md', styles.badge?.bg)}>
                                            <Circle className="h-3 w-3" />
                                            {pending} {styles.badge?.label} · {completed}/{total}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-semibold text-foreground leading-snug truncate">
                            {meeting.title}
                        </h3>

                        {/* Actors */}
                        {meeting.involvedActors.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {meeting.involvedActors.map((actor) => {
                                    const Icon = getActorIcon(actor);
                                    return (
                                        <span
                                            key={actor}
                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-muted-foreground"
                                        >
                                            <Icon className="h-3 w-3" />
                                            {actor}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <ChevronDown className={cn(
                        'h-4 w-4 text-muted-foreground/40 transition-transform duration-200 shrink-0 mt-0.5',
                        expanded && 'rotate-180'
                    )} />
                </button>

                {/* Expandable body — outside the button */}
                {expanded && (
                    <div className="border-t border-border">
                        {/* Agreement list */}
                        <div className="px-5 py-3 space-y-0.5">
                            {meeting.tasks && meeting.tasks.length > 0 ? (
                                meeting.tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleToggleTask(task.id, task.status)}
                                        onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? handleToggleTask(task.id, task.status) : null}
                                        className="group/task w-full text-left flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                                    >
                                        {/* Visual-only checkbox indicator — no nested button */}
                                        <span className={cn(
                                            'mt-0.5 h-4 w-4 rounded shrink-0 border flex items-center justify-center transition-colors',
                                            task.status === 'completed'
                                                ? 'bg-emerald-500 border-emerald-500'
                                                : 'border-amber-300 dark:border-amber-700 bg-transparent'
                                        )}>
                                            {task.status === 'completed' && (
                                                <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
                                                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </span>

                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                'text-sm leading-snug',
                                                task.status === 'completed'
                                                    ? 'text-muted-foreground line-through'
                                                    : 'text-foreground'
                                            )}>
                                                {task.description}
                                            </p>
                                            {(task.assignedStaffName || task.dueDate) && (
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    {task.assignedStaffName && (
                                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {task.assignedStaffName}
                                                        </span>
                                                    )}
                                                    {task.dueDate && (
                                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(parseISO(task.dueDate), 'd MMM', { locale: es })}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDelete(task.id); } }}
                                            className="opacity-0 group-hover/task:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive p-1 -mr-1 rounded shrink-0"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-3">
                                    Aún no hay acuerdos registrados.
                                </p>
                            )}
                        </div>

                        {/* Inline row-based editor — same pattern as wizard AgreementsEditor */}
                        <div className="px-5 pb-4">
                            <div
                                className="flex items-center gap-2 py-1.5 group"
                                onClick={() => draftRef.current?.focus()}
                            >
                                <span className="text-xs font-mono w-5 text-right shrink-0 select-none text-muted-foreground/40 group-focus-within:text-muted-foreground transition-colors">
                                    +
                                </span>
                                <input
                                    ref={draftRef}
                                    type="text"
                                    value={draftText}
                                    onChange={(e) => setDraftText(e.target.value)}
                                    placeholder="Agregar acuerdo..."
                                    className="flex-1 py-1.5 px-2 text-sm rounded-lg border outline-none transition-all border-transparent bg-transparent text-muted-foreground placeholder:text-muted-foreground/30 focus:border-amber-200 focus:bg-amber-50/30 dark:focus:bg-amber-950/20 focus:text-foreground"
                                    onKeyDown={(e) => {
                                        if ((e.key === 'Enter' || e.key === 'Tab') && draftText.trim()) {
                                            e.preventDefault();
                                            createTask.mutate(
                                                { meetingId: meeting.id, task: { description: draftText.trim(), status: 'pending', assignedStaffId: null, dueDate: null } },
                                                { onSuccess: () => { setDraftText(''); setTimeout(() => draftRef.current?.focus(), 50); } }
                                            );
                                        }
                                        if (e.key === 'Escape') {
                                            setDraftText('');
                                            draftRef.current?.blur();
                                        }
                                    }}
                                />
                                {createTask.isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/40 shrink-0" />}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
