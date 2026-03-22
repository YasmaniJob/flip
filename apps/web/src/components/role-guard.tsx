"use client";

import { useSession } from "@/lib/auth-client";
import { UserRole } from "@flip/shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
    children: React.ReactNode;
    roles: UserRole[];
    fallback?: React.ReactNode;
    redirect?: string;
}

export function RoleGuard({ children, roles, fallback = null, redirect }: RoleGuardProps) {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    const userRole = (session?.user as any)?.role as UserRole;
    const hasAccess = userRole && roles.includes(userRole);

    useEffect(() => {
        if (!isPending && !hasAccess && redirect) {
            router.push(redirect);
        }
    }, [isPending, hasAccess, redirect, router]);

    if (isPending) return null;

    if (!userRole || !hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
