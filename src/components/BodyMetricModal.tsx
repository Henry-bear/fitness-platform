"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Activity, Percent, Ruler, Weight, X } from "lucide-react";
import ModalPortal from "./ModalPortal";




type Props = {
    userId: string;
    onClose: () => void;
    onSaved: () => void;
}

export default function BodyMetricModal({ userId, onClose, onSaved }: Props) {
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
            onSaved();
            onClose();
        } catch (err) {
            console.error("儲存身體數據失敗！", err)
            toast.error("身體數據儲存失敗！")
        }
    };

    return (
        <ModalPortal>
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="body-metric-title"
        >
            <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ duration: 0.22 }}
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/90 p-6 text-white shadow-2xl shadow-black/60"
            >
                <div aria-hidden="true" className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-500/15 blur-3xl" />
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="關閉身體數值視窗"
                    className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="relative mb-6 flex items-center gap-3">
                    <div className="rounded-2xl bg-orange-500/15 p-3 text-orange-400">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 id="body-metric-title" className="text-xl font-bold text-white">新增身體數值</h2>
                        <p className="mt-0.5 text-sm text-zinc-400">記錄今天，看看長期變化</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="relative space-y-3">

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition focus-within:border-orange-500/70 focus-within:bg-orange-500/[0.04]">
                        <label htmlFor="metric-height" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                            <Ruler className="h-4 w-4 text-orange-400" />身高
                        </label>
                        <div className="flex items-center gap-3">
                        <input
                            id="metric-height"
                            type="number"
                            min="130"
                            step="0.1"
                            placeholder="175"
                            className="min-w-0 flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder:text-zinc-700"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                        />
                        <span className="text-sm font-medium text-zinc-500">cm</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition focus-within:border-orange-500/70 focus-within:bg-orange-500/[0.04]">
                        <label htmlFor="metric-weight" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                            <Weight className="h-4 w-4 text-orange-400" />體重
                        </label>
                        <div className="flex items-center gap-3">
                        <input
                            id="metric-weight"
                            type="number"
                            placeholder="70"
                            min="5"
                            step="0.1"
                            className="min-w-0 flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder:text-zinc-700"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                        />
                        <span className="text-sm font-medium text-zinc-500">kg</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition focus-within:border-orange-500/70 focus-within:bg-orange-500/[0.04]">
                        <label htmlFor="metric-fat" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                            <Percent className="h-4 w-4 text-orange-400" />體脂
                        </label>
                        <div className="flex items-center gap-3">
                        <input
                            id="metric-fat"
                            type="number"
                            placeholder="20"
                            min="0"
                            max="100"
                            step="0.1"
                            className="min-w-0 flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder:text-zinc-700"
                            value={bodyFat}
                            onChange={(e) => setBodyFat(e.target.value)}
                        />
                        <span className="text-sm font-medium text-zinc-500">%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-950/40 transition hover:-translate-y-0.5 hover:bg-orange-400"
                        >
                            儲存
                        </button>
                    </div>
                </form>
            </motion.div>
        </div >
        </ModalPortal>
    );
}
