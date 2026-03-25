"use client";

import { Menu, Search, Filter } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface MobileTopbarProps {
  title: string;
  onMenuClick: () => void;
  showAvatar?: boolean;
  showSearch?: boolean;
  showFilter?: boolean;
  onSearchClick?: () => void;
  onFilterClick?: () => void;
}

export function MobileTopbar({
  title,
  onMenuClick,
  showAvatar = false,
  showSearch = false,
  showFilter = false,
  onSearchClick,
  onFilterClick,
}: MobileTopbarProps) {
  const { data: session } = useSession();

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-card border-b border-border/40 safe-area-pt">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>

        {/* Center: Title */}
        <h1 className="text-[17px] font-medium text-foreground flex-1 text-center px-4">
          {title}
        </h1>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <button
              onClick={onSearchClick}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          {showFilter && (
            <button
              onClick={onFilterClick}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Filtrar"
            >
              <Filter className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          {showAvatar && (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#185FA5] text-white text-xs font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </header>
  );
}
