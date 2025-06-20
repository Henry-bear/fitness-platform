"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection, Timestamp, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import { toast } from "sonner";

type Props = {
    user: User;
    onClose: () => void;
};

export default function ExperienceBookingModal({ user, onClose }: Props) {
    const [preferredTime, setPreferredTime] = useState("");
    const [loading, setLoading] = useState(false);

    const handleBooking = async () => {
        try {
            setLoading(true);

            if (!preferredTime) {
                toast.error("請選擇您偏好的體驗時間");
                setLoading(false);
                return;
            }
            // 檢查是否為正式會員
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().isFormalMember) {
                toast.error("您已體驗過，建議您詢問所屬教練。");
                setLoading(false);
                return;
            }

            // 檢查是否已有未完成的預約
            const existingQuery = query(
                collection(db, "experienceBookings"),
                where("userId", "==", user.uid),
                where("status", "in", ["pending", "assigned"])
            );
            const existing = await getDocs(existingQuery);
            if (!existing.empty) {
                toast.error("您已預約過體驗課，請等待聯繫！");
                setLoading(false);
                return;
            }

            await addDoc(collection(db, "experienceBookings"), {
                userId: user.uid,
                userName: user.displayName || "匿名使用者",
                email: user.email || "",
                preferredTime,
                status: "pending",
                assignedTrainerId: "",
                createdAt: Timestamp.now(),
            });
            toast.success("預約成功，我們將盡快與您聯繫！");
            onClose();
        } catch (error) {
            console.error("預約錯誤", error);
            toast.error("預約失敗，請稍後再試");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center">
            <div className="bg-zinc-900 p-6 rounded-xl w-[90%] max-w-md text-white shadow-lg">
                <h2 className="text-xl font-bold text-orange-400 mb-4 text-center">
                    預約體驗教練課程
                </h2>

                <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                >
                    <option value="">請選擇偏好時間</option>
                    <option value="平日早上 (09:00–12:00)">平日早上 (09:00–12:00)</option>
                    <option value="平日下午 (13:00–17:00)">平日下午 (13:00–17:00)</option>
                    <option value="平日晚上 (18:00–21:00)">平日晚上 (18:00–21:00)</option>
                    <option value="週末早上 (09:00–12:00)">週末早上 (09:00–12:00)</option>
                    <option value="週末下午 (13:00–17:00)">週末下午 (13:00–17:00)</option>
                    <option value="週末晚上 (18:00–21:00)">週末晚上 (18:00–21:00)</option>
                </select>

                <div className="pt-2 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 rounded"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleBooking}
                        disabled={loading}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold disabled:opacity-50"
                    >
                        {loading ? "送出中..." : "立即預約"}
                    </button>
                </div>
            </div>
        </div>
    );
}
