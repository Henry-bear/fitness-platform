"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, Timestamp, updateDoc, doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

    // 讀取私人教練函式
    useEffect(() => {
        const fetchTrainers = async () => {
            const snapshot = await getDocs(
                query(collection(db, "users"), where("role", "==", "personalTrainer"))
            );
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name || "未命名教練",
            }));
            setTrainers(list);
        };
        fetchTrainers();
    }, []);

    // 載入體驗預約函式
    useEffect(() => {
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
    }, []);

    if (authLoading || roleLoading) {
        return <div className="text-white p-4">驗證中...</div>;
    }

    if (!user || role !== "admin") {
        return null;
    }

    return (
        <div className="bg-white p-6 rounded shadow-sm">
            <h1 className="text-2xl font-bold text-orange-500 mb-4">體驗課預約名單</h1>
            {dataLoading ? (
                <p className="text-gray-600">載入中...</p>
            ) : bookings.length === 0 ? (
                <p className="text-gray-600">目前沒有待處理的預約。</p>
            ) : (
                <table className="min-w-full text-sm text-gray-800 border border-gray-200 rounded-lg">
                    <thead className="bg-orange-100 text-orange-600">
                        <tr>
                            <th className="px-4 py-2 text-left">姓名</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">偏好時間</th>
                            <th className="px-4 py-2 text-left">建立時間</th>
                            <th className="px-4 py-2 text-left">指派教練</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr
                                key={booking.id}
                                className="border-t border-gray-200 hover:bg-orange-50 transition-colors"
                            >
                                <td className="px-4 py-2">{booking.userName}</td>
                                <td className="px-4 py-2">{booking.email}</td>
                                <td className="px-4 py-2">{booking.preferredTime}</td>
                                <td className="px-4 py-2">
                                    {booking.createdAt.toDate().toLocaleString()}
                                </td>
                                <td className="px-4 py-2">
                                    <select
                                        value={booking.assignedTrainerId || ""}
                                        onChange={(e) => handleAssignTrainer(booking.id, booking.userId, e.target.value)}
                                        className="bg-white border border-orange-400 text-orange-600 rounded px-2 py-1 focus:outline-orange-400"
                                    >
                                        <option value="">尚未指派</option>
                                        {trainers.map((trainer) => (
                                            <option key={trainer.id} value={trainer.id}>
                                                {trainer.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
