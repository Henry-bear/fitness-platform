"use client";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import CoachScheduleList from "./CoachScheduleList";


export default function CoachPage() {
    const [user, loading] = useAuthState(auth);
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const router = useRouter();

    useEffect(() => {
        if (!loading && !roleLoading) {
            if (!user || role !== "groupCoach") {
                router.replace("/"); // 不是團課教練就踢出
            }
        }
    }, [user, loading, role, roleLoading, router]);

    // 載入中 or 非團課教練都不顯示畫面
    if (loading || roleLoading || !user || role !== "groupCoach") {
        return null;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-orange-500 mb-4">
                我的課程
            </h1>
            <CoachScheduleList user={user} />
        </div>
    );
}
