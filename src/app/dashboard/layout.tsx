"use client";

import { ReactNode } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-zinc-900 text-white">
            <DashboardSidebar />
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    );
}