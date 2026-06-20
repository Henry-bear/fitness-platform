"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Activity, ChevronDown, Percent, Ruler, Weight, X } from "lucide-react";
import ModalPortal from "./ModalPortal";




type Props = {
    userId: string;
    onClose: () => void;
    onSaved: () => void;
}

const createOptions = (min: number, max: number, step: number) =>
    Array.from({ length: Math.round((max - min) / step) + 1 }, (_, index) => {
        const value = min + index * step;
        return Number.isInteger(value) ? String(value) : value.toFixed(1);
    });

const heightOptions = createOptions(120, 220, 1);
const weightOptions = createOptions(30, 250, 0.5);
const bodyFatOptions = createOptions(3, 60, 0.5);

export default function BodyMetricModal({ userId, onClose, onSaved }: Props) {
    const [height, setHeight] = useState("170");
    const [weight, setWeight] = useState("65");
    const [bodyFat, setBodyFat] = useState("20");
    const [hasPreviousMetric, setHasPreviousMetric] = useState(false);

    useEffect(() => {
        let active = true;
        const loadPreviousMetric = async () => {
            try {
                const snapshot = await getDocs(query(
                    collection(db, "users", userId, "bodyMetrics"),
                    orderBy("createdAt", "desc"),
                    limit(1),
                ));
                const previous = snapshot.docs[0]?.data();
                if (!active || !previous) return;
                setHeight(String(Math.round(Number(previous.height))));
                setWeight((Math.round(Number(previous.weight) * 2) / 2).toString());
                setBodyFat((Math.round(Number(previous.bodyFat) * 2) / 2).toString());
                setHasPreviousMetric(true);
            } catch {
                // 預設值仍可讓使用者直接調整，不阻擋記錄流程。
            }
        };
        loadPreviousMetric();
        return () => {
            active = false;
        };
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId) throw new Error("無法取得使用者 ID");

        if (Number(height) < 100 || Number(height) > 250 ||
            Number(weight) < 25 || Number(weight) > 350 ||
            Number(bodyFat) < 2 || Number(bodyFat) > 70
        ) {
            toast.error("請輸入正確的數值！");
            return;
        }

        try {
            await addDoc(collection(db, "users", userId, "bodyMetrics"), {
                height: Number(height),
                weight: Number(weight),
                bodyFat: Number(bodyFat),
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
            className="fixed inset-0 z-[999] flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/75 p-2 backdrop-blur-md sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="body-metric-title"
        >
            <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ duration: 0.22 }}
                className="relative max-h-[92dvh] w-full max-w-md overflow-x-hidden overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950/95 p-4 text-white shadow-2xl shadow-black/60 sm:p-6"
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
                        <p className="mt-0.5 text-sm text-zinc-400">上下滑動選擇，快速更新今日狀態</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="relative space-y-3">
                    {hasPreviousMetric && <p className="rounded-xl border border-orange-400/15 bg-orange-400/[0.06] px-3 py-2 text-xs text-orange-200">已帶入上一筆數值，只需調整有變化的項目。</p>}

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition focus-within:border-orange-500/70 focus-within:bg-orange-500/[0.04]">
                        <label htmlFor="metric-height" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                            <Ruler className="h-4 w-4 text-orange-400" />身高
                        </label>
                        <div className="relative flex items-center gap-3">
                        <select
                            id="metric-height"
                            className="min-w-0 flex-1 appearance-none bg-transparent py-1 text-2xl font-semibold text-white outline-none"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                        >
                            {heightOptions.map((value) => <option key={value} value={value}>{value} cm</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none h-5 w-5 text-orange-400" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition focus-within:border-orange-500/70 focus-within:bg-orange-500/[0.04]">
                        <label htmlFor="metric-weight" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                            <Weight className="h-4 w-4 text-orange-400" />體重
                        </label>
                        <div className="relative flex items-center gap-3">
                        <select
                            id="metric-weight"
                            className="min-w-0 flex-1 appearance-none bg-transparent py-1 text-2xl font-semibold text-white outline-none"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                        >
                            {weightOptions.map((value) => <option key={value} value={value}>{value} kg</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none h-5 w-5 text-orange-400" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition focus-within:border-orange-500/70 focus-within:bg-orange-500/[0.04]">
                        <label htmlFor="metric-fat" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                            <Percent className="h-4 w-4 text-orange-400" />體脂
                        </label>
                        <div className="relative flex items-center gap-3">
                        <select
                            id="metric-fat"
                            className="min-w-0 flex-1 appearance-none bg-transparent py-1 text-2xl font-semibold text-white outline-none"
                            value={bodyFat}
                            onChange={(e) => setBodyFat(e.target.value)}
                        >
                            {bodyFatOptions.map((value) => <option key={value} value={value}>{value}%</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none h-5 w-5 text-orange-400" />
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
