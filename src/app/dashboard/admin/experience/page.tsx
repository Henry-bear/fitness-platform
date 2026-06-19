"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, Timestamp, updateDoc, doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PrivacyUnlockDialog from "@/components/PrivacyUnlockDialog";
import { CalendarClock, Eye, EyeOff, Inbox, Mail, ShieldCheck, UserRound } from "lucide-react";

type Booking = {
    id: string;
    userId: string;
    userName: string;
    email: string;
    preferredTime: string;
    status: string;
    createdAt: Timestamp;
    assignedTrainerId?: string;
};

export default function AdminExperienceBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [user, authLoading] = useAuthState(auth);
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);
    const router = useRouter();
    const [emailVisible, setEmailVisible] = useState(false);
    const [showPrivacyUnlock, setShowPrivacyUnlock] = useState(false);

    useEffect(() => {
        if (!emailVisible) return;
        const timer = window.setTimeout(() => setEmailVisible(false), 5 * 60 * 1000);
        return () => window.clearTimeout(timer);
    }, [emailVisible]);

    useEffect(() => {
        if (!authLoading && !roleLoading) {
            if (!user || role !== "admin") {
                router.replace("/"); // 不符合 admin 身份直接跳轉首頁
            }
        }
    }, [user, role, authLoading, roleLoading, router]);

    // 指派私人教練
    const handleAssignTrainer = async (bookingId: string, userId: string, trainerId: string) => {
        try {
            // 更新預約紀錄
            await updateDoc(doc(db, "experienceBookings", bookingId), {
                assignedTrainerId: trainerId,
                status: "assigned",
            });


            // 同步更新 users 資料
            await updateDoc(doc(db, "users", userId), {
                assignedTrainerId: trainerId,
            });

            // 更新前端狀態
            setBookings((prev) =>
                prev.map((b) =>
                    b.id === bookingId ? { ...b, assignedTrainerId: trainerId } : b
                )
            );

            toast.success("已成功指派教練！");
        } catch (err) {
            console.error("指派失敗", err);
            toast.error("指派教練失敗，請稍後再試");
        }
    };

    useEffect(() => {
        if (authLoading || roleLoading || !user || role !== "admin") return;

        const fetchTrainers = async () => {
            try {
                const snapshot = await getDocs(
                    query(collection(db, "users"), where("role", "==", "personalTrainer"))
                );
                const list = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    name: doc.data().name || "未命名教練",
                }));
                setTrainers(list);
            } catch (error) {
                console.error("載入教練資料錯誤", error);
                toast.error("無法載入教練資料");
            }
        };
        fetchTrainers();
    }, [authLoading, roleLoading, user, role]);

    useEffect(() => {
        if (authLoading || roleLoading || !user || role !== "admin") return;

        const fetchBookings = async () => {
            try {
                const q = query(
                    collection(db, "experienceBookings"),
                    where("status", "==", "pending")
                );
                const snapshot = await getDocs(q);
                const list: Booking[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as Omit<Booking, "id">),
                }));
                setBookings(list);
            } catch (error) {
                console.error("載入預約錯誤", error);
            } finally {
                setDataLoading(false);
            }
        };

        fetchBookings();
    }, [authLoading, roleLoading, user, role]);

    if (authLoading || roleLoading) {
        return <div className="text-white p-4">驗證中...</div>;
    }

    if (!user || role !== "admin") {
        return null;
    }

    const maskEmail = (email: string) => {
        if (!email) return "未提供";
        const [name = "", domain = ""] = email.split("@");
        const suffix = domain.includes(".") ? `.${domain.split(".").pop()}` : "";
        return `${name.slice(0, 2) || "••"}${"•".repeat(Math.min(Math.max(name.length - 2, 4), 8))}@••••${suffix}`;
    };

    return (
        <div className="mx-auto max-w-6xl text-white">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-400"><ShieldCheck className="h-4 w-4" />管理員專區</div><h1 className="text-2xl font-bold">體驗預約管理</h1><p className="mt-1 text-sm text-zinc-400">處理新預約並指派合適的私人教練</p></div><button type="button" onClick={() => emailVisible ? setEmailVisible(false) : setShowPrivacyUnlock(true)} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${emailVisible ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-white/10 bg-white/5 text-zinc-300 hover:border-orange-500/40 hover:text-orange-300"}`}>{emailVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{emailVisible ? "遮蔽 Email" : "驗證後顯示 Email"}</button></div>
            {dataLoading ? (
                <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-6 text-zinc-400">載入預約資料中...</div>
            ) : bookings.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/55 text-center backdrop-blur-md"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-600"><Inbox className="h-6 w-6" /></div><p className="mt-4 font-medium text-zinc-300">目前沒有待處理預約</p><p className="mt-1 text-sm text-zinc-600">新的體驗申請會顯示在這裡</p></div>
            ) : (
                <div className="grid gap-3">
                            {bookings.map((booking) => (
                                <article key={booking.id} className="grid gap-4 rounded-2xl border border-white/10 bg-zinc-950/55 p-4 shadow-lg shadow-black/20 backdrop-blur-md transition hover:border-white/20 lg:grid-cols-[1fr_1.3fr_1.2fr_1fr] lg:items-center">
                                    <div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400"><UserRound className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate font-semibold text-white">{booking.userName}</p><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-zinc-500"><Mail className="h-3.5 w-3.5" />{emailVisible ? booking.email : maskEmail(booking.email)}</p></div></div>
                                    <div className="flex items-center gap-2 text-sm text-zinc-400"><CalendarClock className="h-4 w-4 text-orange-400" />{booking.preferredTime}</div>
                                    <div className="text-sm text-zinc-500">申請於 {booking.createdAt.toDate().toLocaleString()}</div>
                                    <label className="text-xs font-medium text-zinc-500">指派教練
                                        <select
                                            value={booking.assignedTrainerId || ""}
                                            onChange={(e) =>
                                                handleAssignTrainer(booking.id, booking.userId, e.target.value)
                                            }
                                            className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-orange-500/60"
                                        >
                                            <option value="">尚未指派</option>
                                            {trainers.map((trainer) => (
                                                <option key={trainer.id} value={trainer.id}>
                                                    {trainer.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </article>
                            ))}
                </div>
            )}
            <PrivacyUnlockDialog open={showPrivacyUnlock} onClose={() => setShowPrivacyUnlock(false)} onVerified={() => setEmailVisible(true)} />
        </div>
    );
}
