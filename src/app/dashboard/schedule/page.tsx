"use client";

import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { query, where, collection, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import NewGroupClassModal from "@/components/NewGroupClassModal";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";
import dayjs from "dayjs";
import { CalendarDays, Clock3, Plus, Trash2, Users } from "lucide-react";

type GroupClass = {
    id: string;
    title: string;
    coach: string;
    date: Timestamp | Date;
    startTime: string;
    endTime: string;
    bookingCount: number;
};

export default function ScheduleAdminPage() {
    const [user, authLoading] = useAuthState(auth);
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const router = useRouter();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scheduleList, setScheduleList] = useState<GroupClass[]>([]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [, setBookingCount] = useState<number>(0);
    const [confirmMessage, setConfirmMessage] = useState<string>("你確定要刪除這堂課嗎？");
    const [expiredClasses, setExpiredClasses] = useState<GroupClass[]>([]);
    const [showExpireDialog, setShowExpireDialog] = useState(false);

    const fetchSchedule = async () => {
        const snapshot = await getDocs(collection(db, "groupSchedule"));

        const scheduleWithCounts: GroupClass[] = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data() as Omit<GroupClass, "id" | "bookingCount">;
                const id = docSnap.id;

                // 查詢該課程的報名人數
                const bookingQuery = query(
                    collection(db, "groupBookings"),
                    where("groupClassId", "==", id)
                );
                const bookings = await getDocs(bookingQuery);

                return {
                    id,
                    ...data,
                    bookingCount: bookings.size,
                };
            })
        );
        setScheduleList(scheduleWithCounts);

        const today = dayjs().startOf("day");
        const expired = scheduleWithCounts.filter((item) =>
            dayjs(item.date instanceof Timestamp ? item.date.toDate() : item.date).isBefore(today)
        );
        setExpiredClasses(expired);

        if (expired.length > 0) {
            setShowExpireDialog(true);
        }
    };

    // 刪除過期課程函式
    const handleDeleteExpiredClasses = async () => {
        try {
            for (const expiredClass of expiredClasses) {
                // 刪除 groupBookings
                const bookingQuery = query(
                    collection(db, "groupBookings"),
                    where("groupClassId", "==", expiredClass.id)
                );
                const bookings = await getDocs(bookingQuery);
                const deletePromises = bookings.docs.map((docSnap) =>
                    deleteDoc(doc(db, "groupBookings", docSnap.id))
                );
                await Promise.all(deletePromises);

                // 刪除 groupSchedule
                await deleteDoc(doc(db, "groupSchedule", expiredClass.id));
            }

            toast.success("已刪除所有過期課程");
            setShowExpireDialog(false);
            fetchSchedule(); // 重新讀取課程
        } catch (error) {
            console.error("刪除過期課程失敗", error);
            toast.error("刪除失敗，請稍後再試");
        }
    }

    const handleConfirmDelete = async () => {
        if (!selectedId) return;
        try {
            // 刪除 groupBookings
            const q = query(
                collection(db, "groupBookings"),
                where("groupClassId", "==", selectedId)
            );
            const snapshot = await getDocs(q);

            const deletePromises = snapshot.docs.map((docSnap) =>
                deleteDoc(doc(db, "groupBookings", docSnap.id))
            );
            await Promise.all(deletePromises);

            // 接著刪除課程本身
            await deleteDoc(doc(db, "groupSchedule", selectedId));

            toast.success("課程與預約資料已刪除！");
            fetchSchedule();
        } catch (error) {
            console.error("刪除課程失敗：", error);
            toast.error("刪除課程失敗，請再試一次");
        } finally {
            setConfirmOpen(false);
            setSelectedId(null);
        }
    };

    useEffect(() => {
        if (authLoading || roleLoading) return;

        if (!user || role !== "admin") {
            router.replace("/");
            return;
        }

        fetchSchedule();
    }, [authLoading, roleLoading, user, role, router]);

    if (authLoading || roleLoading || !user || role !== "admin") {
        return null;
    }

    return (
        <>
            <div className="mx-auto max-w-6xl text-white">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-400"><CalendarDays className="h-4 w-4" />課程營運</div><h1 className="text-2xl font-bold">團體課程管理</h1><p className="mt-1 text-sm text-zinc-400">建立時段、查看預約人數與管理既有課程</p></div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-orange-400"
                    >
                        <Plus className="h-4 w-4" />新增課程
                    </button>

                    <NewGroupClassModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={fetchSchedule}
                    />
                </div>

                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-400"><CalendarDays className="h-5 w-5 text-orange-400" /><span>共 {scheduleList.length} 堂課程</span><span className="ml-auto text-xs">{expiredClasses.length} 堂已過期</span></div>
                {scheduleList.length === 0 ? (
                    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/55 text-center backdrop-blur-md"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-600"><CalendarDays className="h-6 w-6" /></div><p className="mt-4 font-medium text-zinc-300">目前沒有團體課程</p><p className="mt-1 text-sm text-zinc-600">點擊新增課程建立第一個時段</p></div>
                ) : (
                    <div className="grid gap-3">
                        {scheduleList.map((item) => (
                            <article key={item.id} className="grid gap-4 rounded-2xl border border-white/10 bg-zinc-950/55 p-4 shadow-lg shadow-black/20 backdrop-blur-md transition hover:border-white/20 lg:grid-cols-[1.2fr_1fr_1fr_0.7fr_auto] lg:items-center">
                                <div><p className="font-semibold text-white">{item.title}</p><p className="mt-1 text-xs text-zinc-500">{item.coach} 教練</p></div>
                                <div className="flex items-center gap-2 text-sm text-zinc-400"><CalendarDays className="h-4 w-4 text-orange-400" />{dayjs(item.date instanceof Timestamp ? item.date.toDate() : item.date).format("YYYY/MM/DD")}</div>
                                <div className="flex items-center gap-2 text-sm text-zinc-400"><Clock3 className="h-4 w-4 text-orange-400" />{item.startTime} - {item.endTime}</div>
                                <div className="flex items-center gap-2 text-sm text-zinc-400"><Users className="h-4 w-4 text-orange-400" />{item.bookingCount} 人</div>
                                    <button
                                        onClick={async () => {
                                            setSelectedId(item.id);
                                            // 查詢報名人數
                                            const bookingQuery = query(
                                                collection(db, "groupBookings"),
                                                where("groupClassId", "==", item.id)
                                            );
                                            const bookingSnapshot = await getDocs(bookingQuery);
                                            const count = bookingSnapshot.size;
                                            setBookingCount(count);

                                            // 更新對話框訊息
                                            setConfirmMessage(
                                                count > 0
                                                    ? `此課程已有 ${count} 人預約，刪除課程將一併移除預約紀錄，是否確定刪除？`
                                                    : "你確定要刪除這堂課嗎？"
                                            );
                                            setConfirmOpen(true);
                                        }}
                                        className="flex items-center justify-center gap-1.5 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-sm font-medium text-red-300 transition hover:border-red-400/30 hover:bg-red-400/10"
                                    >
                                        <Trash2 className="h-4 w-4" />刪除
                                    </button>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={confirmOpen}
                title="刪除課程"
                message={confirmMessage}
                onCancel={() => {
                    setConfirmOpen(false);
                    setSelectedId(null);
                }}
                onConfirm={handleConfirmDelete}
            />

            <ConfirmDialog
                open={showExpireDialog}
                title="刪除過期課程"
                message={`共有 ${expiredClasses.length} 筆已過期課程，是否要一併刪除？`}
                onCancel={() => setShowExpireDialog(false)}
                onConfirm={handleDeleteExpiredClasses}
            />

        </>
    );
}
