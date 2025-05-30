"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, Timestamp, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function NewGroupClassModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; }) {
    const [title, setTitle] = useState("");
    const [coach, setCoach] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [loading, setLoading] = useState(false);

    const courseOptions = ["Zumba", "Yoga", "有氧拳擊", "飛輪", "核心訓練"];
    const [groupCoaches, setGroupCoaches] = useState<{ id: string; name: string }[]>([]);

    const timeSlots = Array.from({ length: (23 - 8 + 1) * 2 }, (_, i) => {
        const hour = 8 + Math.floor(i / 2);
        const minute = i % 2 === 0 ? "00" : "30";
        return `${String(hour).padStart(2, "0")}:${minute}`;
    });

    useEffect(() => {
        const fetchCoaches = async () => {
            const q = query(collection(db, "users"), where("role", "==", "groupCoach"));
            const snapshot = await getDocs(q);
            const coaches = snapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name || "未命名教練",
            }));
            setGroupCoaches(coaches);
        };
        fetchCoaches();
    }, []);

    const handleSubmit = async () => {
        if (!title || !coach || !date || !startTime || !endTime) {
            alert("請填寫完整欄位");
            return;
        }

        if (endTime <= startTime) {
            toast.error("結束時間必須晚於開始時間");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "groupSchedule"), {
                title,
                coach,
                date,
                startTime,
                endTime,
                createdAt: Timestamp.now(),
            });
            onSuccess();
            onClose();
            setTitle("");
            setCoach("");
            setDate("");
            setStartTime("");
            setEndTime("");
            toast.success("新增課程成功！");
        } catch (err) {
            toast.error("儲存失敗，請再試一次");
            console.error("新增課程錯誤:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-white text-black rounded-lg w-full max-w-md p-6"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <h2 className="text-xl font-bold mb-4">預約團體課程</h2>
                    <div className="space-y-4">
                        <select
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border p-2 rounded"
                        >
                            <option value="">請選擇課程名稱</option>
                            {courseOptions.map((course) => (
                                <option key={course} value={course}>{course}</option>
                            ))}
                        </select>

                        <select
                            value={coach}
                            onChange={(e) => setCoach(e.target.value)}
                            className="w-full border p-2 rounded"
                        >
                            <option value="">請選擇教練</option>
                            {groupCoaches.map((c) => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>

                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full border p-2 rounded"
                            min={new Date().toISOString().split("T")[0]}
                        />

                        <div className="flex gap-2">
                            <select
                                value={startTime}
                                onChange={(e) => {
                                    const selectedStart = e.target.value;
                                    setStartTime(selectedStart);
                                    const [h, m] = selectedStart.split(":").map(Number);
                                    const endHour = h + 1;
                                    const adjustedEnd = `${String(endHour).padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
                                    setEndTime(adjustedEnd);
                                }}
                                className="w-full border p-2 rounded"
                            >
                                <option value="">開始時間</option>
                                {timeSlots.map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>

                            <select
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full border p-2 rounded"
                            >
                                <option value="">結束時間</option>
                                {timeSlots.map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-black cursor-pointer"
                            disabled={loading}
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 rounded bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
                            disabled={loading}
                        >
                            {loading ? "儲存中..." : "儲存課程"}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
