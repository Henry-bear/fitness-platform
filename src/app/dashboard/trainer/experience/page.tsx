"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import {
    collection,
    getDocs,
    query,
    where,
    Timestamp,
    updateDoc,
    doc,
} from "firebase/firestore";
import { toast } from "sonner";
import PurchaseModal from "@/components/PurchaseModal";
import { CalendarClock, CheckCircle2, CircleDollarSign, Inbox, Mail, PhoneCall, Sparkles, UserRound } from "lucide-react";

type Booking = {
    id: string;
    userId: string;
    userName: string;
    email: string;
    preferredTime: string;
    status: "assigned" | "contacted" | "attended";
    createdAt: Timestamp;
    assignedTrainerId?: string;
};

export default function TrainerExperiencePage() {
    const [user, authLoading] = useAuthState(auth);
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Booking | null>(null);

    // 開啟 modal 的函式
    const markAsPurchased = (booking: Booking) => {
        setSelectedStudent(booking);
        setShowPurchaseModal(true);
    };

    // 權限驗證
    useEffect(() => {
        if (!authLoading && !roleLoading) {
            if (!user || role !== "personalTrainer") {
                router.replace("/");
            }
        }
    }, [authLoading, roleLoading, user, role, router]);

    // 載入體驗課資料
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const q = query(
                    collection(db, "experienceBookings"),
                    where("assignedTrainerId", "==", user.uid)
                );
                const snapshot = await getDocs(q);
                const list: Booking[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as Omit<Booking, "id">),
                }));
                setBookings(list);
            } catch (err) {
                console.error("讀取錯誤", err);
                toast.error("無法載入資料");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // 標記為已聯繫
    const markAsContacted = async (bookingId: string) => {
        try {
            await updateDoc(doc(db, "experienceBookings", bookingId), {
                status: "contacted",
            });
            setBookings((prev) =>
                prev.map((b) =>
                    b.id === bookingId ? { ...b, status: "contacted" } : b
                )
            );
            toast.success("已標記為已聯繫");
        } catch (err) {
            console.error("更新錯誤", err);
            toast.error("標記失敗");
        }
    };

    // 標記為已體驗
    const markAsAttended = async (bookingId: string) => {
        try {
            await updateDoc(doc(db, "experienceBookings", bookingId), {
                status: "attended",
            });
            setBookings((prev) =>
                prev.map((b) =>
                    b.id === bookingId ? { ...b, status: "attended" } : b
                )
            );
            toast.success("已標記為已體驗");
        } catch (err) {
            console.error("更新錯誤", err);
            toast.error("標記失敗");
        }
    };

    if (authLoading || roleLoading || loading) {
        return <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-zinc-950/55 p-6 text-zinc-400">載入體驗學生資料中...</div>;
    }

    if (!user || role !== "personalTrainer") return null;

    const statusMeta = {
        assigned: { label: "待聯繫", className: "border-orange-400/20 bg-orange-400/10 text-orange-300" },
        contacted: { label: "已聯繫", className: "border-blue-400/20 bg-blue-400/10 text-blue-300" },
        attended: { label: "已體驗", className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" },
    } as const;

    return (
        <div className="mx-auto max-w-6xl text-white">
            <div className="mb-6"><div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-400"><Sparkles className="h-4 w-4" />教練工作台</div><h1 className="text-2xl font-bold">體驗課學生</h1><p className="mt-1 text-sm text-zinc-400">追蹤聯繫進度、完成體驗並協助學生購買課程</p></div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 backdrop-blur-md"><div className="flex items-center gap-2 text-xs text-zinc-500"><Inbox className="h-4 w-4 text-orange-400" />待聯繫</div><p className="mt-2 text-2xl font-bold">{bookings.filter((booking) => booking.status === "assigned").length}<span className="ml-1 text-sm font-normal text-zinc-500">位</span></p></div>
                <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 backdrop-blur-md"><div className="flex items-center gap-2 text-xs text-zinc-500"><PhoneCall className="h-4 w-4 text-blue-400" />已聯繫</div><p className="mt-2 text-2xl font-bold">{bookings.filter((booking) => booking.status === "contacted").length}<span className="ml-1 text-sm font-normal text-zinc-500">位</span></p></div>
                <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 backdrop-blur-md"><div className="flex items-center gap-2 text-xs text-zinc-500"><CheckCircle2 className="h-4 w-4 text-emerald-400" />已體驗</div><p className="mt-2 text-2xl font-bold">{bookings.filter((booking) => booking.status === "attended").length}<span className="ml-1 text-sm font-normal text-zinc-500">位</span></p></div>
            </div>

            {bookings.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/55 text-center backdrop-blur-md"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-600"><Inbox className="h-6 w-6" /></div><p className="mt-4 font-medium text-zinc-300">目前沒有指派的體驗學生</p><p className="mt-1 text-sm text-zinc-600">管理員指派後會顯示在這裡</p></div>
            ) : (
                <div className="grid gap-3">
                    {bookings.map((booking) => {
                        const meta = statusMeta[booking.status];
                        return (
                            <article key={booking.id} className="grid gap-4 rounded-2xl border border-white/10 bg-zinc-950/55 p-4 shadow-lg shadow-black/20 backdrop-blur-md transition hover:border-orange-400/20 lg:grid-cols-[1.1fr_1fr_1fr_auto] lg:items-center">
                                <div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400"><UserRound className="h-5 w-5" /></div><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate font-semibold">{booking.userName}</h2><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.className}`}>{meta.label}</span></div><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-zinc-500"><Mail className="h-3.5 w-3.5" />{booking.email}</p></div></div>
                                <div className="flex items-center gap-2 text-sm text-zinc-400"><CalendarClock className="h-4 w-4 text-orange-400" />{booking.preferredTime}</div>
                                <div className="text-xs text-zinc-500">申請於 {booking.createdAt.toDate().toLocaleString("zh-TW")}</div>
                                {booking.status === "assigned" && <button onClick={() => markAsContacted(booking.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-orange-400"><PhoneCall className="h-4 w-4" />標記已聯繫</button>}
                                {booking.status === "contacted" && <button onClick={() => markAsAttended(booking.id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-2.5 text-sm font-semibold text-blue-300 transition hover:border-blue-400/35 hover:bg-blue-400/15"><CheckCircle2 className="h-4 w-4" />完成體驗</button>}
                                {booking.status === "attended" && <button onClick={() => markAsPurchased(booking)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/35 hover:bg-emerald-400/15"><CircleDollarSign className="h-4 w-4" />購買課程</button>}
                            </article>
                        );
                    })}
                </div>
            )}
            {showPurchaseModal && selectedStudent && (
                <PurchaseModal
                    open={showPurchaseModal}
                    student={selectedStudent}
                    onClose={() => setShowPurchaseModal(false)}
                />
            )}
        </div>
    );
}
