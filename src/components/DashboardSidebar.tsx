"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";

const navItems = {
    admin: [
        { name: "會員權限管理", path: "/dashboard/users" },
        { name: "團體課程管理", path: "/dashboard/schedule" },
        { name: "體驗預約名單", path: "/dashboard/admin/experience" },
    ],
    groupCoach: [{ name: "團課管理", path: "/dashboard/coaches" }],
    personalTrainer: [
        { name: "我的課表", path: "/dashboard/trainer" },
        { name: "學員名單", path: "/dashboard/students" },
        { name: "體驗預約名單", path: "/dashboard/trainer/experience" },
    ],
};

export default function DashboardSidebar() {
    const [user] = useAuthState(auth);
    const { role } = useCustomClaimRole(user ?? null);
    const pathname = usePathname();
    const items = navItems[role as keyof typeof navItems] || [];

    return (
        <aside className="relative z-20 flex flex-col border-b border-white/10 bg-zinc-950/90 px-4 py-4 text-white backdrop-blur-xl md:fixed md:left-0 md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r md:px-5 md:py-6">
            {/* 標題 */}
            <div className="mb-6 text-center"><h2 className="text-xl font-bold text-white md:text-lg">FitnessWay</h2><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-400">Management</p></div>

            {/* 導覽列 */}
            <nav className="flex flex-col gap-2 text-center">
                {items.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive
                                    ? "border border-orange-500/30 bg-orange-500/15 text-orange-300"
                                    : "border border-transparent text-zinc-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* 回首頁按鈕 */}
            <div className="mt-auto pt-8 text-center">
                <Link
                    href="/"
                    className="inline-block rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                    回首頁
                </Link>
            </div>
        </aside>
    );
}
