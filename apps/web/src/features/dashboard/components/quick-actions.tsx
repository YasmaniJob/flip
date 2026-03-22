'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/button';
import { CalendarRange, Handshake, MonitorSmartphone } from 'lucide-react';
import { useSession } from '@/lib/auth-client';

export function QuickActions() {
    const router = useRouter();
    const { data: session } = useSession();
    const user = session?.user as any;
    const isDocente = user?.role === 'docente' && !user?.isSuperAdmin;

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button
                variant="jira"
                size="sm"
                className="gap-2 h-9 px-4 text-xs tracking-wide"
                onClick={() => router.push(isDocente ? '/loans?new=true' : '/inventario?new=true')}
            >
                <MonitorSmartphone className="h-4 w-4" />
                Prestar Equipo
            </Button>

            <Button
                variant="jiraOutline"
                size="sm"
                className="gap-2 h-9 px-4 text-xs tracking-wide text-foreground"
                onClick={() => router.push('/reservaciones?new=true')}
            >
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                Agendar AIP
            </Button>

            {!isDocente && (
                <Button
                    variant="jiraOutline"
                    size="sm"
                    className="gap-2 h-9 px-4 text-xs tracking-wide text-foreground"
                    onClick={() => router.push('/reuniones?new=true')}
                >
                    <Handshake className="h-4 w-4 text-muted-foreground" />
                    Nueva Reunión
                </Button>
            )}
        </div>
    );
}
