"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { User } from "firebase/auth";
import BodyShape from "@/components/BodyShape";
import TrainingRadarChart from "./TrainingRadarChart";
import { CalendarDays } from "lucide-react";

type Props = {
    userId: string;
    user: User;
    refreshTrigger: number;
};

export default function LatestBodyMetric({ userId, user, refreshTrigger }: Props) {
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
            // 儲存基本資料
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
    }, [userId, refreshTrigger]);

    if (!latest) return null;

    const { height, weight, bodyFat } = latest;
    const bmi = weight / ((height / 100) ** 2);
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto w-full max-w-6xl text-white"
        >
            <div className="mb-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
                <h3 className="text-xl font-bold tracking-wide text-orange-400">目前身體數據</h3>
                <p className="flex items-center gap-1.5 text-xs text-zinc-500"><CalendarDays className="h-3.5 w-3.5" />更新於 {latest.date}</p>
            </div>

            <div className="mx-auto mt-4 grid max-w-6xl items-stretch gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <BodyShape height={height} weight={weight} bodyFat={bodyFat} bmi={bmi} />
                <TrainingRadarChart user={user} refreshTrigger={refreshTrigger} />
            </div>
        </motion.div>
    );
}
