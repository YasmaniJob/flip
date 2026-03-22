'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: any;
    href?: string;
    color?: 'blue' | 'violet' | 'emerald' | 'amber' | 'red' | 'indigo';
    status?: 'normal' | 'critical';
    trend?: 'up' | 'down' | 'neutral';
    delta?: string | number;
}

export function StatCard({
    label, value, delta, trend, status = 'normal', icon: Icon, href, color = 'blue'
}: StatCardProps) {
    const router = useRouter();
    const handleClick = href ? () => router.push(href) : undefined;

    const colorMap: Record<string, any> = {
        blue: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20', num: 'text-info' },
        violet: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', num: 'text-primary' },
        emerald: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', num: 'text-success' },
        amber: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', num: 'text-warning' },
        red: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', num: 'text-destructive' },
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20', num: 'text-indigo-600' },
    };

    const colors = colorMap[color] || colorMap.blue;
    const isCritical = status === 'critical';
    const c = isCritical ? colorMap.red : colors;

    return (
        <div
            onClick={handleClick}
            className={cn(
                'group relative bg-card rounded-lg border p-5 flex flex-col gap-4 transition-all duration-300',
                handleClick ? 'cursor-pointer hover:bg-accent/40 hover:border-primary/30' : '',
                isCritical && 'border-destructive/30 bg-destructive/[0.02]'
            )}
        >
            {isCritical && (
                <div className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60">{label}</span>
                    <div className="flex items-baseline gap-2">
                        <span className={cn('text-3xl font-black tabular-nums tracking-tight transition-colors group-hover:text-foreground', c.num)}>{value}</span>
                        {delta !== undefined && (
                            <span className={cn(
                                "text-xs font-bold",
                                trend === 'up' ? "text-success" : trend === 'down' ? "text-destructive" : "text-muted-foreground"
                            )}>
                                {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{delta}
                            </span>
                        )}
                    </div>
                </div>
                <div className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-500',
                    c.bg, c.text,
                    'group-hover:scale-105'
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}
