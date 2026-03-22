'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useMeetings } from '@/features/meetings/hooks/use-meetings';
import { Button } from '@/components/atoms/button';
import { Plus, CalendarDays } from 'lucide-react';
import { Meeting } from '@/features/meetings/api/meetings.api';
import { MeetingCard } from '@/features/meetings/components/meeting-card';

const MeetingWizard = dynamic(
    () => import('@/features/meetings/components/meeting-wizard').then(m => m.MeetingWizard),
    { ssr: false }
);

function MeetingCardSkeleton() {
    return (
        <div className="bg-card rounded-lg shadow-none border border-border p-5 animate-pulse">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-muted rounded-md shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-4 bg-muted rounded w-48" />
                    <div className="flex gap-2">
                        <div className="h-5 bg-muted rounded-md w-20" />
                        <div className="h-5 bg-muted rounded-md w-16" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ReunionesClient() {
    const { data: meetings = [], isLoading } = useMeetings();
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header — same pattern as Inventario */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-foreground">Reuniones</h1>
                </div>
                <Button onClick={() => setIsWizardOpen(true)} variant="jira" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Nueva Reunión
                </Button>
            </div>

                {/* Content */}
                {isLoading ? (
                    <div className="grid gap-4">
                        {[1, 2, 3, 4].map(i => <MeetingCardSkeleton key={i} />)}
                    </div>
                ) : meetings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-border rounded-lg bg-muted/20">
                        <div className="h-12 w-12 bg-background rounded-md flex items-center justify-center mb-4 border border-border">
                            <CalendarDays className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium text-foreground">No hay reuniones registradas</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                            Las reuniones y sus acuerdos aparecerán aquí.
                        </p>
                        <Button onClick={() => setIsWizardOpen(true)} variant="jiraOutline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Reunión
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {meetings.map((meeting: Meeting) => (
                            <MeetingCard key={meeting.id} meeting={meeting} />
                        ))}
                    </div>
                )}
            <MeetingWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
            />
        </div>
    );
}
