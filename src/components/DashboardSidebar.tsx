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
        <aside className="bg-black text-white px-4 py-4 md:py-6 md:px-6
                         flex flex-col md:w-60 md:h-screen md:fixed md:top-0 md:left-0">
            {/* 標題 */}
            <h2 className="text-xl md:text-lg font-bold text-white mb-6 text-center">
                Fitnessway 管理系統
            </h2>

            {/* 導覽列 */}
            <nav className="flex flex-col gap-2 text-center">
                {items.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`px-3 py-2 rounded-md transition-colors ${isActive
                                    ? "bg-orange-500 text-white"
                                    : "text-white hover:bg-orange-400"
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
                    className="inline-block px-4 py-2 bg-gray-400 text-white font-semibold rounded-md hover:bg-orange-600 transition"
                >
                    回首頁
                </Link>
            </div>
        </aside>
    );
}
