"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { motion } from "framer-motion";

type Props = {
    userId: string;
    onClose: () => void;
}

export default function BodyMetricModal({ userId, onClose }: Props) {
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [bodyFat, setBodyFat] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId) throw new Error("無法取得使用者 ID");

        if (!height || !weight || !bodyFat ||
            Number(height) <= 0 || Number(weight) <= 0 || Number(bodyFat) <= 0
        ) {
            toast.error("請輸入正確的數值！");
            return;
        }

        try {
            await addDoc(collection(db, "users", userId, "bodyMetrics"), {
                height,
                weight,
                bodyFat,
                createdAt: serverTimestamp(),
            });

            toast.success("身體數值已成功儲存！");
            onClose();
        } catch (err) {
            console.error("儲存身體數據失敗！", err)
            toast.error("身體數據儲存失敗！")
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
                <h2 className="text-xl font-bold mb-4 text-orange-500">新增身體數值</h2>
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label className="block text-sm font-medium mb-1">身高 (cm)</label>
                        <input
                            type="number"
                            min="130"
                            step="0"
                            placeholder="請輸入身高 (cm)"
                            className="w-full px-3 py-2 rounded border border-orange-500 bg-zinc-900 text-white placeholder:text-zinc-500"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">體重 (kg)</label>
                        <input
                            type="number"
                            placeholder="請輸入體重 (kg)"
                            min="5"
                            step="0"
                            className="w-full px-3 py-2 rounded border border-orange-500 bg-zinc-900 text-white placeholder:text-zinc-500"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">體脂 (%)</label>
                        <input
                            type="number"
                            placeholder="請輸入體脂 (%)"
                            min="0"
                            step="0"
                            className="w-full px-3 py-2 rounded border border-orange-500 bg-zinc-900 text-white placeholder:text-zinc-500"
                            value={bodyFat}
                            onChange={(e) => setBodyFat(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded"
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
        </div >
    );
}