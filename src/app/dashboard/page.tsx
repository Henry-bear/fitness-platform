"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardHomePage() {
    const [user, authLoading] = useAuthState(auth);
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!authLoading && !roleLoading) {
            if (user && (role === "admin" || role === "groupCoach" || role === "personalTrainer")) {
                setIsAuthorized(true); // 通過驗證，才 render 畫面
            } else {
                router.replace("/"); // 否則跳轉
            }
        }
    }, [authLoading, roleLoading, user, role, router]);

    // 驗證完成前不顯示任何畫面，避免閃爍
    if (authLoading || roleLoading || !isAuthorized) {
        return null;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-orange-500 mb-4">歡迎回來，{role}！</h1>
            <p className="text-gray-700">這裡是你的後台首頁。</p>
        </div>
    );
}