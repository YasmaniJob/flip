"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useTheme } from "@/components/theme-provider";
import { useBrandColor } from "@/components/brand-color-provider";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getBrandColor } from "@/lib/brand-color";
import { useInstitution } from "@/hooks/use-institution";
import { createPortal } from "react-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LayoutDashboard,
  Package,
  Users,
  Handshake,
  ClipboardList,
  CalendarDays,
  Settings,
  Building2,
  UserCog,
  BarChart3,
  CreditCard,
  LucideIcon,
  GraduationCap,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  Monitor,
  User,
  Clock,
  LayoutGrid,
  BookOpen,
  School,
} from "lucide-react";
import { InstitutionHeader } from "@/components/institution-header";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  roles?: ("all" | "admin" | "docente" | "superadmin" | "pip")[];
  subItems?: { label: string; href: string; icon?: LucideIcon }[];
}

const menuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
    roles: ["all"],
  },
  {
    icon: Package,
    label: "Inventario",
    href: "/inventario",
    roles: ["admin", "superadmin", "pip"],
  },
  {
    icon: Users,
    label: "Personal",
    href: "/personal",
    roles: ["admin", "superadmin"],
  },
  {
    icon: Handshake,
    label: "Reuniones",
    href: "/reuniones",
    roles: ["admin", "superadmin", "pip"],
  },
  { icon: ClipboardList, label: "Préstamos", href: "/loans", roles: ["all"] },
  {
    icon: CalendarDays,
    label: "Reservaciones",
    href: "/reservaciones",
    roles: ["all"],
  },
  {
    icon: Settings,
    label: "Configuración",
    href: "/settings",
    roles: ["admin", "superadmin"],
    subItems: [
      { label: "Perfil", href: "/settings", icon: User },
      { label: "Horarios", href: "/settings/horarios", icon: Clock },
      { label: "Grados", href: "/settings/grados", icon: LayoutGrid },
      { label: "Áreas", href: "/settings/areas", icon: BookOpen },
      { label: "Aulas", href: "/settings/aulas", icon: School },
      { label: "Categorías", href: "/settings/categorias", icon: Package },
      { label: "Templates", href: "/settings/templates", icon: LayoutGrid },
    ],
  },
];

const platformMenuItems: MenuItem[] = [
  { icon: Building2, label: "Instituciones", href: "/platform/instituciones" },
  { icon: UserCog, label: "Usuarios", href: "/platform/usuarios" },
  { icon: BarChart3, label: "Analytics", href: "/platform/analytics" },
  {
    icon: CreditCard,
    label: "Suscripciones",
    href: "/suscripciones",
  },
];

// ── Tooltip wrapper (Native React Portal) ───────────────────────
function NavTooltip({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!collapsed) return <>{children}</>;

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ x: rect.right + 8, y: rect.top + rect.height / 2 });
    setIsHovered(true);
  };

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </div>
      {isHovered &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[99999] px-2.5 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap shadow-md pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
            style={{
              left: coords.x,
              top: coords.y,
              transform: "translateY(-50%)",
            }}
          >
            {label}
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Nav item ──────────────────────────────────────────────────
function NavItem({
  item,
  isActive,
  collapsed,
  pathname,
}: {
  item: MenuItem;
  isActive: boolean;
  collapsed: boolean;
  pathname: string;
}) {
  const Icon = item.icon;
  const hasSubItems = item.subItems && item.subItems.length > 0;

  const navContent = (
    <>
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-md" />
      )}
      <span
        className={cn(
          "flex-shrink-0 flex items-center justify-center transition-all duration-150",
          collapsed
            ? "w-10 h-10 rounded-md hover:bg-sidebar-accent"
            : "w-7 h-7",
          isActive
            ? "text-primary"
            : "text-sidebar-muted-foreground group-hover:text-sidebar-foreground",
        )}
      >
        <Icon
          className={collapsed ? "h-[18px] w-[18px]" : "h-[16px] w-[16px]"}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </span>
      {!collapsed && (
        <span
          className={cn(
            "leading-none flex-1 truncate transition-all duration-150",
            isActive && "font-semibold",
          )}
        >
          {item.label}
        </span>
      )}
    </>
  );

  const itemClassName = cn(
    "group relative flex items-center gap-3 text-sm font-medium transition-colors duration-150 flex-1 w-full text-left",
    collapsed
      ? "px-0 py-0 justify-center h-10"
      : "px-3 py-2.5 rounded-lg hover:bg-sidebar-accent",
    isActive
      ? "text-sidebar-foreground"
      : "text-sidebar-muted-foreground hover:text-sidebar-foreground",
  );

  if (hasSubItems) {
    return (
      <div className="space-y-1">
        <Popover>
          <div className="group relative flex items-center">
            <NavTooltip label={item.label} collapsed={collapsed}>
              <PopoverTrigger asChild>
                <button type="button" className={itemClassName}>
                  {navContent}
                </button>
              </PopoverTrigger>
            </NavTooltip>
          </div>
          <PopoverContent
            side="right"
            align="start"
            sideOffset={collapsed ? 15 : 10}
            className="w-56 p-2 bg-sidebar border-sidebar-border shadow-none rounded-lg animate-in fade-in slide-in-from-left-2 duration-200"
          >
            <div className="flex flex-col gap-1">
              <div className="px-3 py-2 border-b border-sidebar-border/50 mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-sidebar-muted-foreground/60">
                  {item.label}
                </p>
              </div>
              {item.subItems?.map((subItem) => {
                const pathnameWithoutQuery = pathname.split("?")[0];
                const isSubActive = pathnameWithoutQuery === subItem.href;
                const SubIcon = subItem.icon;

                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    prefetch={false}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-md transition-colors",
                      isSubActive
                        ? "text-primary bg-primary/5"
                        : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                    )}
                  >
                    {SubIcon && <SubIcon className="h-4 w-4" />}
                    {subItem.label}
                  </Link>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="group relative flex items-center">
        <NavTooltip label={item.label} collapsed={collapsed}>
          <Link href={item.href} prefetch={false} className={itemClassName}>
            {navContent}
          </Link>
        </NavTooltip>
      </div>
    </div>
  );
}

// ── Profile Dropdown ───────────────────────────────────────────
function ProfileDropdown({
  user,
  roleLabel,
  collapsed,
}: {
  user: any;
  roleLabel: string;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setTriggerRect(e.currentTarget.getBoundingClientRect());
    setOpen((prev) => !prev);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.push("/login");
  };

  const themeOptions: {
    value: "light" | "dark" | "system";
    label: string;
    icon: LucideIcon;
  }[] = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ];

  const currentThemeLabel =
    themeOptions.find((t) => t.value === theme)?.label ?? "Sistema";
  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun;

  const cycleTheme = () => {
    const next =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  const avatarLetter = user?.name?.charAt(0).toUpperCase();

  return (
    <>
      {collapsed ? (
        <NavTooltip label={`${user?.name} · ${roleLabel}`} collapsed={true}>
          <button onClick={handleOpen} className="w-full flex justify-center">
            <div className="h-9 w-9 rounded-md bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
              {avatarLetter}
            </div>
          </button>
        </NavTooltip>
      ) : (
        <button
          onClick={handleOpen}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors group text-left"
        >
          <div className="h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {avatarLetter}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap">
            <p className="text-sm font-semibold truncate text-sidebar-foreground leading-tight">
              {user?.name}
            </p>
            <p className="text-[11px] text-sidebar-muted-foreground truncate leading-tight mt-0.5">
              {roleLabel}
            </p>
          </div>
          <LogOut className="h-4 w-4 text-sidebar-muted-foreground/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {open &&
        mounted &&
        triggerRect &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[99998]"
              onClick={() => setOpen(false)}
            />

            {/* Dropdown */}
            <div
              className="fixed z-[99999] w-56 rounded-lg border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden"
              style={{
                left: collapsed ? triggerRect.right + 8 : triggerRect.left,
                bottom: `calc(100vh - ${triggerRect.top}px + 6px)`,
              }}
            >
              {/* Header */}
              <div className="px-3 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {user?.email}
                </p>
              </div>

              {/* Menu items */}
              <div className="p-1.5 space-y-0.5">
                <Link
                  href="/settings"
                  prefetch={false}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-foreground hover:bg-accent transition-colors w-full"
                >
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                  Mi perfil
                </Link>

                <button
                  onClick={cycleTheme}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-foreground hover:bg-accent transition-colors w-full"
                >
                  <ThemeIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Tema: {currentThemeLabel}</span>
                </button>
              </div>

              {/* Sign out */}
              <div className="p-1.5 border-t border-border">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

// ── Main sidebar ───────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { brandColor } = useBrandColor();
  const user = session?.user as any;
  const isSuperAdmin = user?.isSuperAdmin;
  const role = user?.role || "docente";

  const { data: institution } = useInstitution();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("flip:sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("flip:sidebar-collapsed", String(next));
      return next;
    });
  };

  const canAccessItem = (item: MenuItem) => {
    if (!item.roles || item.roles.includes("all")) return true;

    // superadmin has access to everything designated for admin or superadmin
    if (
      (role === "superadmin" || isSuperAdmin) &&
      (item.roles.includes("admin") || item.roles.includes("superadmin"))
    )
      return true;

    return item.roles.includes(role);
  };

  const filteredMenuItems = menuItems.filter(canAccessItem);

  const roleLabel =
    isSuperAdmin || role === "superadmin"
      ? "SuperAdmin"
      : role === "admin"
        ? "Administrador"
        : role === "pip"
          ? "PIP (Profesor de innovación pedagógica)"
          : "Docente";

  return (
    <aside
      className={cn(
        "bg-sidebar h-screen sticky top-0 flex flex-col border-r border-sidebar-border transition-all duration-200 ease-in-out shrink-0",
        collapsed ? "w-[60px]" : "w-60",
      )}
    >
      {/* Institution Header */}
      {user?.institutionId && institution && (
        <div className="border-b border-sidebar-border/60">
          <InstitutionHeader
            name={institution.name}
            nivel={institution.nivel}
            logoUrl={institution.settings?.logoUrl}
            brandColor={getBrandColor(brandColor)}
            collapsed={collapsed}
          />
        </div>
      )}

      {/* Logo (when no institution) */}
      {!user?.institutionId && (
        <div
          className={cn(
            "flex items-center justify-center border-b border-sidebar-border/60 transition-all duration-200",
            collapsed ? "py-5" : "py-5 px-4",
          )}
        >
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap
              className="h-5 w-5 text-primary-foreground"
              strokeWidth={2}
            />
          </div>
          {!collapsed && (
            <div className="ml-3 min-w-0 overflow-hidden whitespace-nowrap">
              <span className="text-base font-bold tracking-tight text-sidebar-foreground leading-none block truncate">
                Flip
              </span>
              <span className="text-[10px] text-sidebar-muted-foreground font-medium leading-none block mt-0.5 truncate">
                Gestión Educativa
              </span>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto custom-scrollbar transition-all duration-200",
          collapsed ? "px-[7px] py-3 space-y-1" : "p-3 space-y-0.5",
        )}
      >
        {filteredMenuItems.map((item) => {
          const pathnameWithoutQuery = pathname.split("?")[0];
          const baseMatch =
            pathnameWithoutQuery === item.href ||
            (item.href !== "/dashboard" &&
              pathnameWithoutQuery.startsWith(item.href + "/"));
          const hasActiveSubItem =
            item.subItems?.some(
              (subItem) => pathnameWithoutQuery === subItem.href,
            ) ?? false;
          const isActive = baseMatch || hasActiveSubItem;
          return (
            <NavItem
              key={item.href}
              item={item}
              isActive={isActive}
              collapsed={collapsed}
              pathname={pathname}
            />
          );
        })}

        {isSuperAdmin && (
          <>
            <div className={cn("my-3", collapsed ? "px-1" : "px-3")}>
              <div className="h-px bg-sidebar-border" />
            </div>
            {!collapsed && (
              <div className="px-3 pb-2 overflow-hidden whitespace-nowrap">
                <p className="text-[10px] font-semibold text-sidebar-muted-foreground uppercase tracking-widest truncate">
                  Plataforma
                </p>
              </div>
            )}
            {platformMenuItems.map((item) => {
              const pathnameWithoutQuery = pathname.split("?")[0];
              const isActive =
                pathnameWithoutQuery === item.href ||
                pathnameWithoutQuery.startsWith(item.href + "/");
              return (
                <NavItem
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  collapsed={collapsed}
                  pathname={pathname}
                />
              );
            })}
          </>
        )}
      </nav>

      {/* User card */}
      <div
        className={cn(
          "border-t border-sidebar-border/60 transition-all duration-200",
          collapsed ? "px-[7px] py-3" : "p-3",
        )}
      >
        <ProfileDropdown
          user={user}
          roleLabel={roleLabel}
          collapsed={collapsed}
        />
      </div>

      {/* Toggle button */}
      <div className="px-2 py-1">
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.8} />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.8} />
              <span className="font-medium">Colapsar</span>
            </>
          )}
        </button>
      </div>

      {/* Flip branding footer */}
      <div
        className={cn(
          "border-t border-sidebar-border/40 transition-all duration-200",
          collapsed ? "p-2" : "p-3",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          <div className="flex items-center gap-2 text-sidebar-muted-foreground/60">
            <div className="h-5 w-5 rounded bg-sidebar-accent/50 flex items-center justify-center shrink-0">
              <GraduationCap
                className="h-3 w-3 text-sidebar-muted-foreground/70"
                strokeWidth={2}
              />
            </div>
            {!collapsed && (
              <span className="text-[10px] font-semibold tracking-wide">
                Flip
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="text-[9px] text-sidebar-muted-foreground/40 font-medium">
              v0.0.1
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
