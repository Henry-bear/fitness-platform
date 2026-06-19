"use client";

import { ReactNode } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import AmbientBackground from "@/components/AmbientBackground";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[#070809] text-white md:flex-row">
            <AmbientBackground variant="overview" />
            <DashboardSidebar />
            <main className="relative z-10 flex-1 p-4 md:ml-60 md:p-8">
                {children}
            </main>
        </div>
    );
}
