"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";

type Props = {
    user: User;
    onClose?: () => void;
};

export default function WorkoutForm({ user, onClose }: Props) {
    const [type, setType] = useState("");
    const [weight, setWeight] = useState("");
    const [sets, setSets] = useState("");
    const [reps, setReps] = useState("");
    const [date, setDate] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!type || !weight || !sets || !reps || !date) {
            toast.error("請填寫所有欄位");
            return;
        }

        if (Number(weight) <= 0 || Number(sets) <= 0 || Number(reps) <= 0) {
            toast.error("請輸入正確的數值！");
            return;
        }

        try {
            const ref = collection(db, "users", user.uid, "workouts");
            await addDoc(ref, {
                type,
                weight,
                sets,
                reps,
                date,
                createdAt: serverTimestamp(),
            });

            toast.success("訓練紀錄已成功儲存！");
            if (onClose) onClose();

            // 清空表單
            setType("");
            setWeight("");
            setSets("");
            setReps("");
            setDate("");
        } catch (error) {
            console.error("儲存失敗", error);
            toast.error("儲存失敗，請稍後再試。");
        }
    };

    return (
        <div className="fixed inset-0 z-[999] bg-black/60 flex justify-center items-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="bg-zinc-900 text-white p-6 rounded shadow-lg w-[90%] max-w-md"
            >
                <h2 className="text-xl font-bold text-orange-500 border-b border-zinc-700 pb-2 mb-4">
                    新增訓練紀錄
                </h2>

                <form onSubmit={handleSubmit}>
                    {/* 訓練類型 */}
                    <div className="mb-3">
                        <label className="block text-sm mb-1">訓練類型</label>
                        <input
                            type="text"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            placeholder="請輸入訓練名稱 （例如 深蹲）"
                            className="w-full px-3 py-2 rounded border border-orange-500 bg-black text-white placeholder:text-zinc-500"
                        />
                    </div>

                    {/* 重量 */}
                    <div className="mb-3">
                        <label className="block text-sm mb-1">重量（kg）</label>
                        <input
                            type="number"
                            min="1"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="例如 5kg"
                            className="w-full px-3 py-2 rounded border border-orange-500 bg-black text-white placeholder:text-zinc-500"
                        />
                    </div>

                    {/* 組數 + 次數 */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <label className="block text-sm mb-1">組數 sets</label>
                            <input
                                type="number"
                                min="1"
                                value={sets}
                                onChange={(e) => setSets(e.target.value)}
                                placeholder="組數"
                                className="w-full px-3 py-2 rounded border border-orange-500 bg-black text-white placeholder:text-zinc-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">次數 reps</label>
                            <input
                                type="number"
                                min="1"
                                value={reps}
                                onChange={(e) => setReps(e.target.value)}
                                placeholder="次數"
                                className="w-full px-3 py-2 rounded border border-orange-500 bg-black text-white placeholder:text-zinc-500"
                            />
                        </div>
                    </div>

                    {/* 日期 */}
                    <div className="mb-4">
                        <label className="block text-sm mb-1">訓練日期</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 rounded border border-orange-500 bg-black text-white placeholder:text-zinc-500"
                        />
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded"
                        >
                            儲存
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}