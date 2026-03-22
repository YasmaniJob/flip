"use client";

import { QueryProvider } from "@/providers/query-provider";

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <QueryProvider>
            <div className="min-h-screen bg-background">
                {children}
            </div>
        </QueryProvider>
    );
}
