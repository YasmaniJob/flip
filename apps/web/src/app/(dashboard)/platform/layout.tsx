"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PlatformLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    useEffect(() => {
        if (!isPending && session) {
            const user = session.user as any;
            // Only SuperAdmins can access platform routes
            if (!user.isSuperAdmin) {
                router.push("/dashboard");
            }
        }
    }, [session, isPending, router]);

    if (isPending) return null;

    const user = session?.user as any;
    if (!user?.isSuperAdmin) {
        return null;
    }

    return <>{children}</>;
}
