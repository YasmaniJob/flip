'use client';


import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

// Emojis organizados por grupo
const EMOJI_GROUPS = [
    ['💻', '🖥️', '📱', '🖨️', '📷', '🎧', '🎤', '📡'],
    ['📦', '🔧', '🧰', '📚', '🎬', '🤖', '🎮', '🎨'],
    ['🔒', '💡', '📍', '🎯', '⭐', '✨', '💎', '🎓'],
];

export const CATEGORY_EMOJIS = EMOJI_GROUPS.flat();

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuPortal,
} from '@radix-ui/react-dropdown-menu';

interface EmojiPickerProps {
    value?: string;
    onChange: (emoji: string) => void;
    className?: string;
}

export function EmojiGrid({ value, onChange, className }: EmojiPickerProps) {
    return (
        <div className={cn("space-y-2", className)}>
            {EMOJI_GROUPS.map((group, i) => (
                <div key={i} className="flex flex-wrap gap-2 justify-between">
                    {group.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => onChange(emoji)}
                            className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center text-2xl cursor-pointer outline-none transition-all border-2 active:scale-95',
                                'hover:bg-accent',
                                value === emoji
                                    ? 'border-primary bg-primary/5'
                                    : 'border-transparent hover:border-accent'
                            )}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "h-12 px-4 rounded-xl border border-border bg-card hover:border-border/80 transition-colors flex items-center justify-between gap-3 w-full outline-none focus:ring-2 focus:ring-primary/20",
                        className
                    )}
                >
                    <span className="text-2xl leading-none">{value || '📦'}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent
                    align="end"
                    sideOffset={5}
                    className="z-[9999] min-w-[320px] bg-card rounded-xl border border-border p-3 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                >
                    <EmojiGrid value={value} onChange={onChange} />
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    );
}
