"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Package,
  HandCoins,
  Calendar,
  Users,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";

interface NotionMenuProps {
  open: boolean;
  onClose: () => void;
}

export function NotionMenu({ open, onClose }: NotionMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const menuItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/inventario", icon: Package, label: "Inventario" },
    { href: "/loans", icon: HandCoins, label: "Préstamos" },
    { href: "/reservaciones", icon: Calendar, label: "Reservas" },
    { href: "/reuniones", icon: Users, label: "Reuniones" },
    { href: "/personal", icon: Users, label: "Personal" },
  ];

  const handleSignOut = async () => {
    onClose();
    await signOut();
    router.push("/login");
  };

  const roleLabel =
    user?.isSuperAdmin || user?.role === "superadmin"
      ? "SuperAdmin"
      : user?.role === "admin"
        ? "Administrador"
        : user?.role === "pip"
          ? "PIP"
          : "Docente";

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/30 z-50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Menu Sheet */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 right-0 bg-card z-50 transition-transform duration-300 ease-out shadow-2xl rounded-b-[20px]",
          open ? "translate-y-0" : "translate-y-[-100%]"
        )}
      >
        {/* Header */}
        <div className="px-4 pt-6 pb-4 border-b border-border/40">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {user?.name || "Usuario"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {roleLabel}
              </p>
              {user?.institution?.name && (
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {user.institution.name}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="py-2">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors",
                  isActive
                    ? "text-[#185FA5] bg-[#185FA5]/5"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Icon
                  className={cn("h-5 w-5", isActive && "text-[#185FA5]")}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn("text-sm", isActive && "font-semibold")}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Separator */}
          <div className="my-2 mx-4 h-px bg-border" />

          {/* Settings */}
          <Link
            href="/settings"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-colors",
              pathname.startsWith("/settings")
                ? "text-[#185FA5] bg-[#185FA5]/5"
                : "text-foreground hover:bg-muted"
            )}
          >
            <Settings className="h-5 w-5" strokeWidth={2} />
            <span className="text-sm">Configuración</span>
          </Link>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Cerrar sesión</span>
          </button>
        </nav>
      </div>
    </>
  );
}
