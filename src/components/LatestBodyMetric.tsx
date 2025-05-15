"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";
import { motion } from "framer-motion";
import ProgressRow from "@/components/ProgressRow";
import BodyShape from "@/components/BodyShape";


type Props = {
    userId: string;
};

export default function LatestBodyMetric({ userId }: Props) {
    const [latest, setLatest] = useState<{
        height: number;
        weight: number;
        bodyFat: number;
        date: string;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const q = query(
                collection(db, "users", userId, "bodyMetrics"),
                orderBy("createdAt", "desc"),
                limit(1)
            );
            const snapshot = await getDocs(q);
            const doc = snapshot.docs[0];
            if (doc) {
                const d = doc.data();
                setLatest({
                    height: Number(d.height),
                    weight: Number(d.weight),
                    bodyFat: Number(d.bodyFat),
                    date: d.createdAt?.toDate().toLocaleDateString() || "未知",
                });
            }
        };
        fetchData();
    }, [userId]);

    if (!latest) return null;

    const { height, weight, bodyFat } = latest;
    const bmi = weight / ((height / 100) ** 2);
    const shapeType =
        bodyFat >= 30
            ? "overweight"
            : bodyFat < 15
                ? "slim"
                : "normal";
    const bmiLabel =
        bmi < 18.5
            ? "過輕"
            : bmi < 24
                ? "正常"
                : bmi < 27
                    ? "過重"
                    : "肥胖";

    const fatLabel =
        bodyFat < 15
            ? "精壯"
            : bodyFat < 25
                ? "標準"
                : bodyFat < 30
                    ? "過高"
                    : "肥胖";

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-orange-500 rounded-xl p-6 w-full max-w-3xl mx-auto text-white shadow-lg"
        >
            <h3 className="text-xl font-bold text-orange-400 mb-6 text-center tracking-wide">
                目前身體數據
            </h3>

            <div className="space-y-6">
                <ProgressRow
                    label="身高"
                    value={height}
                    unit="cm"
                    percent={(height - 100) / 100 * 100}
                    color="bg-yellow-400"
                />
                <ProgressRow
                    label="體重"
                    value={weight}
                    unit="kg"
                    percent={(weight - 30) / 100 * 100}
                    color="bg-orange-400"
                />
                <div className="flex items-center justify-between text-sm text-zinc-300">
                    <span>BMI 指數</span>
                    <span className="font-bold text-white">
                        {bmi.toFixed(1)} ({bmiLabel})
                    </span>
                </div>
                <ProgressRow
                    label="體脂"
                    value={bodyFat}
                    unit="%"
                    percent={bodyFat}
                    color={bodyFat >= 25 ? "bg-red-500" : "bg-yellow-400"}
                />
                <div className="flex items-center justify-between text-sm text-zinc-300">
                    <span>體脂分類</span>
                    <span className="font-bold text-white">{fatLabel}</span>
                </div>
            </div>
            <BodyShape type={shapeType} />
        </motion.div>
    );
}