"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, Timestamp, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import dayjs from "dayjs";
import { CalendarPlus } from "lucide-react";
import ModalShell from "./ModalShell";

export default function NewGroupClassModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; }) {
    const [title, setTitle] = useState("");
    const [coach, setCoach] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [repeatWeekly, setRepeatWeekly] = useState(false);
    const [repeatCount, setRepeatCount] = useState(4); // 預設重複 4 週
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
            const baseDate = dayjs(date);
            const batchCount = repeatWeekly ? repeatCount : 1;

            for (let i = 0; i < batchCount; i++) {
                const targetDate = baseDate.add(i, "week").toDate();
                const startOfDay = dayjs(targetDate).startOf("day").toDate();
                const endOfDay = dayjs(targetDate).endOf("day").toDate();

                // 防呆查詢
                const duplicateQuery = query(
                    collection(db, "groupSchedule"),
                    where("coach", "==", coach),
                    where("date", ">=", Timestamp.fromDate(startOfDay)),
                    where("date", "<=", Timestamp.fromDate(endOfDay)),
                    where("startTime", "==", startTime)
                );
                const duplicateSnapshot = await getDocs(duplicateQuery);

                if (!duplicateSnapshot.empty) {
                    toast.error("已有相同教練、時間的課程，請檢查。");
                    setLoading(false);
                    return;
                }

                await addDoc(collection(db, "groupSchedule"), {
                    title,
                    coach,
                    date: targetDate,
                    startTime,
                    endTime,
                    createdAt: Timestamp.now(),
                });
            }


            onSuccess();
            onClose();
            setTitle("");
            setCoach("");
            setDate("");
            setStartTime("");
            setEndTime("");
            setRepeatWeekly(false);
            setRepeatCount(4);
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
        <ModalShell open={isOpen} onClose={onClose} title="新增團體課程" description="設定課程、教練與授課時段" icon={<CalendarPlus className="h-5 w-5" />} titleId="new-group-class-title">
                    <div className="space-y-4">
                        <select
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-orange-500/70"
                        >
                            <option value="">請選擇課程名稱</option>
                            {courseOptions.map((course) => (
                                <option key={course} value={course}>{course}</option>
                            ))}
                        </select>

                        <select
                            value={coach}
                            onChange={(e) => setCoach(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-orange-500/70"
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
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-orange-500/70 [color-scheme:dark]"
                            min={dayjs().format("YYYY-MM-DD")}
                        />

                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-zinc-300">
                            <input
                                type="checkbox"
                                checked={repeatWeekly}
                                onChange={(e) => setRepeatWeekly(e.target.checked)}
                            />
                            <label>每週重複</label>
                            {repeatWeekly && (
                                <input
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={repeatCount}
                                    onChange={(e) => setRepeatCount(Number(e.target.value))}
                                    className="ml-auto w-20 rounded-lg border border-white/10 bg-zinc-900 p-2 text-white outline-none"
                                    placeholder="週數"
                                />
                            )}
                        </div>

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
                                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-orange-500/70"
                            >
                                <option value="">開始時間</option>
                                {timeSlots.map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>

                            <select
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-orange-500/70"
                            >
                                <option value="">結束時間</option>
                                {timeSlots.map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                        <button
                            onClick={onClose}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-zinc-300 transition hover:bg-white/10"
                            disabled={loading}
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "儲存中..." : "儲存課程"}
                        </button>
                    </div>
        </ModalShell>
    );
}
