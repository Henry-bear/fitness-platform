"use client";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import CoachScheduleList from "./CoachScheduleList";
import { CalendarDays } from "lucide-react";


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
        <div className="mx-auto max-w-6xl text-white">
            <div className="mb-6">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-400">
                    <CalendarDays className="h-4 w-4" />教練工作台
                </div>
                <h1 className="text-2xl font-bold">我的團體課程</h1>
                <p className="mt-1 text-sm text-zinc-400">查看授課時段與即時預約人數</p>
            </div>
            <CoachScheduleList user={user} />
        </div>
    );
}
