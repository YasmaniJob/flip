"use client";

import { Menu } from "lucide-react";

interface NotionTopbarProps {
  title: string;
  onMenuClick: () => void;
}

export function NotionTopbar({ title, onMenuClick }: NotionTopbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4 lg:hidden border-b border-border/40 bg-background">
      <h1 className="text-xl font-black tracking-tight text-foreground">
        {title}
      </h1>
      <button
        onClick={onMenuClick}
        className="p-2 -mr-2 hover:bg-muted rounded-lg transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>
    </div>
  );
}
