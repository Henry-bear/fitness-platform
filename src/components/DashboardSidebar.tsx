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
    groupCoach: [{
        name: "團課管理", path: "/dashboard/coaches"
    }],
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
        <aside className="w-60 h-screen bg-black px-4 py-6 text-white flex flex-col">
            <h2 className="text-xl font-bold text-white mb-8">Fitnessway 管理系統</h2>

            <nav className="flex flex-col gap-2">
                {items.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${isActive
                                ? "bg-orange-500 text-white"
                                : "text-white hover:bg-zinc-800"
                                }`}
                        >
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* 離開後台按鈕固定在最底部 */}
            <div className="mt-auto pt-8">
                <Link
                    href="/"
                    className="w-full flex justify-center items-center gap-2 bg-gray-400 text-white font-semibold rounded-md py-2 hover:bg-orange-600 transition"
                >
                    <span>回到首頁</span>
                </Link>
            </div>
        </aside>
    );
}