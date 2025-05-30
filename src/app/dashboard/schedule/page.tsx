"use client";

import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { query, where, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import NewGroupClassModal from "@/components/NewGroupClassModal";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";

type GroupClass = {
    id: string;
    title: string;
    coach: string;
    date: string;
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
    const [bookingCount, setBookingCount] = useState<number>(0);
    const [confirmMessage, setConfirmMessage] = useState<string>("你確定要刪除這堂課嗎？");


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
    };

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
        fetchSchedule();
    }, []);

    useEffect(() => {
        if (!authLoading && !roleLoading) {
            if (!user || role !== "admin") {
                router.replace("/");
            }
        }
    }, [authLoading, roleLoading, user, role, router]);

    if (authLoading || roleLoading || !user || role !== "admin") {
        return null;
    }

    return (
        <>
            <div className="bg-white text-black p-6 rounded-md">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-orange-500">團體課程排程表</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded cursor-pointer"
                    >
                        + 新增課程
                    </button>

                    <NewGroupClassModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={fetchSchedule}
                    />
                </div>

                <table className="w-full text-sm border border-zinc-200">
                    <thead className="bg-zinc-100">
                        <tr>
                            <th className="p-2 text-left">課程名稱</th>
                            <th className="p-2 text-left">教練</th>
                            <th className="p-2 text-left">日期</th>
                            <th className="p-2 text-left">時間</th>
                            <th className="p-2 text-center">預約人數</th>
                            <th className="p-2 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scheduleList.map((item) => (
                            <tr key={item.id} className="border-t border-zinc-200 hover:bg-zinc-50">
                                <td className="text-zinc-800 p-2 font-medium">{item.title}</td>
                                <td className="text-zinc-800 p-2">{item.coach}</td>
                                <td className="text-zinc-800 p-2">{item.date}</td>
                                <td className="text-zinc-800 p-2">
                                    {item.startTime} - {item.endTime}
                                </td>
                                <td className="text-center text-zinc-800 p-2">
                                    {item.bookingCount} 人
                                </td>
                                <td className="text-center p-2">
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
                                        className="px-3 py-1 rounded border border-red-400 text-red-500 hover:bg-red-100 transition font-medium text-sm cursor-pointer"
                                    >
                                        刪除
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
        </>
    );
}
