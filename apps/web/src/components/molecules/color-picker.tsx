'use client';


import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

// Paleta de colores compacta
const COLORS = [
    { value: '#3b82f6', name: 'Azul' },
    { value: '#8b5cf6', name: 'Púrpura' },
    { value: '#ec4899', name: 'Rosa' },
    { value: '#f59e0b', name: 'Ámbar' },
    { value: '#10b981', name: 'Esmeralda' },
    { value: '#06b6d4', name: 'Cyan' },
    { value: '#f97316', name: 'Naranja' },
    { value: '#22c55e', name: 'Verde' },
    { value: '#ef4444', name: 'Rojo' },
    { value: '#64748b', name: 'Gris' },
];

interface ColorPickerProps {
    value?: string;
    onChange: (color: string) => void;
    className?: string;
}

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuPortal,
} from '@radix-ui/react-dropdown-menu';

export function ColorGrid({ value, onChange, className }: ColorPickerProps) {
    return (
        <div className={cn("grid grid-cols-5 gap-2", className)}>
            {COLORS.map((color) => (
                <button
                    key={color.value}
                    type="button"
                    onClick={() => onChange(color.value)}
                    title={color.name}
                    className={cn(
                        'h-10 w-full rounded-lg flex items-center justify-center transition-all cursor-pointer border-2',
                        'hover:scale-105 active:scale-95',
                        value === color.value
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent hover:opacity-90'
                    )}
                    style={{ backgroundColor: color.value }}
                >
                    {value === color.value && (
                        <Check className="h-5 w-5 text-white drop-shadow-sm" />
                    )}
                </button>
            ))}
        </div>
    );
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
    const selectedColor = COLORS.find(c => c.value === value);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "h-12 w-full px-4 rounded-xl border border-border bg-card hover:border-border/80 transition-colors flex items-center gap-3 outline-none focus:ring-2 focus:ring-primary/20",
                        className
                    )}
                >
                    <div
                        className="w-6 h-6 rounded-full ring-2 ring-border"
                        style={{ backgroundColor: value || '#64748b' }}
                    />
                    <span className="text-base font-medium text-foreground flex-1 text-left">
                        {selectedColor?.name || 'Color'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent
                    align="start"
                    sideOffset={5}
                    className="z-[9999] w-[var(--radix-dropdown-menu-trigger-width)] min-w-[280px] bg-card rounded-xl border border-border p-3 animate-in fade-in-0 zoom-in-95"
                >
                    <ColorGrid value={value} onChange={onChange} />
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    );
}

export { COLORS as CATEGORY_COLORS };
