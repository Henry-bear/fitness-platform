"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection, Timestamp, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CalendarClock, Sparkles, X } from "lucide-react";

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
        <motion.div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="experience-booking-title"
        >
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 p-6 text-white shadow-2xl shadow-black/60"
            >
                <div aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
                <button type="button" onClick={onClose} aria-label="關閉體驗預約視窗" className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white">
                    <X className="h-4 w-4" />
                </button>
                <div className="relative mb-6 flex items-center gap-3">
                    <div className="rounded-2xl bg-orange-500/15 p-3 text-orange-400"><Sparkles className="h-6 w-6" /></div>
                    <div>
                        <h2 id="experience-booking-title" className="text-xl font-bold text-white">預約體驗教練課程</h2>
                        <p className="mt-0.5 text-sm text-zinc-400">選一個方便聯繫的時段</p>
                    </div>
                </div>

                <label htmlFor="preferred-time" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300"><CalendarClock className="h-4 w-4 text-orange-400" />偏好時段</label>
                <select
                    id="preferred-time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15"
                >
                    <option value="">請選擇偏好時間</option>
                    <option value="平日早上 (09:00–12:00)">平日早上 (09:00–12:00)</option>
                    <option value="平日下午 (13:00–17:00)">平日下午 (13:00–17:00)</option>
                    <option value="平日晚上 (18:00–21:00)">平日晚上 (18:00–21:00)</option>
                    <option value="週末早上 (09:00–12:00)">週末早上 (09:00–12:00)</option>
                    <option value="週末下午 (13:00–17:00)">週末下午 (13:00–17:00)</option>
                    <option value="週末晚上 (18:00–21:00)">週末晚上 (18:00–21:00)</option>
                </select>

                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleBooking}
                        disabled={loading}
                        className="rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-950/40 transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:translate-y-0 disabled:opacity-50"
                    >
                        {loading ? "送出中..." : "立即預約"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
