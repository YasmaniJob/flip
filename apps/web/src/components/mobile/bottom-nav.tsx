"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Plus, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  showCenterButton?: boolean;
  onCenterButtonClick?: () => void;
  hidden?: boolean;
}

export function BottomNav({ showCenterButton = false, onCenterButtonClick, hidden = false }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Inicio" },
    { href: "/inventario", icon: Package, label: "Inventario" },
    { href: "/reservaciones", icon: Calendar, label: "Reservas" },
    { href: "/personal", icon: Users, label: "Personal" },
  ];

  return (
    <nav 
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/40",
        hidden && "pointer-events-none opacity-0"
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-end justify-around h-16 px-2">
        {/* First 2 items */}
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname.startsWith(item.href) && item.href !== "#";
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors",
                isActive
                  ? "text-[#185FA5]"
                  : "text-muted-foreground"
              )}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn(
                "text-[10px]",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Center Button */}
        {showCenterButton ? (
          <div className="flex flex-col items-center justify-end min-w-[64px] h-full pb-2">
            <button
              onClick={onCenterButtonClick}
              className="w-[46px] h-[46px] rounded-[14px] bg-[#185FA5] flex items-center justify-center -mt-5 border-[3.5px] border-background shadow-lg"
              aria-label="Nuevo"
            >
              <Plus className="text-white w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          // 5th item when no center button
          <Link
            href="/loans"
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors",
              pathname.startsWith("/loans")
                ? "text-[#185FA5]"
                : "text-muted-foreground"
            )}
            aria-label="Préstamos"
          >
            <Package className="h-5 w-5" strokeWidth={pathname.startsWith("/loans") ? 2.5 : 2} />
            <span className={cn(
              "text-[10px]",
              pathname.startsWith("/loans") ? "font-semibold" : "font-medium"
            )}>
              Préstamos
            </span>
          </Link>
        )}

        {/* Last 2 items */}
        {navItems.slice(2).map((item) => {
          const isActive = pathname.startsWith(item.href) && item.href !== "#";
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors",
                isActive
                  ? "text-[#185FA5]"
                  : "text-muted-foreground"
              )}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn(
                "text-[10px]",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
