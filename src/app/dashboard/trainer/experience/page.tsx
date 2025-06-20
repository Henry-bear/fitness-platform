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
        return <p className="text-white p-4">載入中...</p>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-orange-500 mb-4">體驗課學生名單</h1>
            <div className="bg-white text-black rounded shadow p-4">
                {bookings.length === 0 ? (
                    <p className="text-gray-700">目前沒有學生預約</p>
                ) : (
                    <ul>
                        {bookings.map((b) => (
                            <li key={b.id} className="border-b py-3">
                                <div className="font-semibold">{b.userName}</div>
                                <div className="text-sm text-gray-600">{b.email}</div>
                                <div className="text-sm text-gray-600">偏好時間：{b.preferredTime}</div>
                                <div className="text-sm text-gray-600">
                                    建立時間：{b.createdAt.toDate().toLocaleString()}
                                </div>
                                <div className="mt-1 text-sm">
                                    狀態：{" "}
                                    {b.status === "attended" ? (
                                        <span className="text-blue-600 font-medium">已體驗</span>
                                    ) : b.status === "contacted" ? (
                                        <span className="text-green-600 font-medium">已聯繫</span>
                                    ) : (
                                        <span className="text-orange-500 font-medium">尚未聯繫</span>
                                    )}
                                </div>

                                {b.status === "assigned" && (
                                    <div className="mt-2">
                                        <button
                                            onClick={() => markAsContacted(b.id)}
                                            className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm"
                                        >
                                            標記已聯繫
                                        </button>
                                    </div>
                                )}

                                {b.status === "contacted" && (
                                    <div className="mt-2">
                                        <button
                                            onClick={() => markAsAttended(b.id)}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                                        >
                                            標記已體驗
                                        </button>
                                    </div>
                                )}

                                {b.status === "attended" && (
                                    <div className="mt-2 space-x-2">
                                        <button
                                            onClick={() => markAsPurchased(b)}
                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                                        >
                                            購買課程
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
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