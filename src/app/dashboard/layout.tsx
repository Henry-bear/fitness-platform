"use client";

import { ReactNode } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-zinc-900 text-white">
            <DashboardSidebar />
            <main className="flex-1 md:ml-60 p-4 md:p-6">
                {children}
            </main>
        </div>
    );
}
