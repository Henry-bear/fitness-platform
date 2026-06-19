"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { User } from "firebase/auth";
import BodyShape from "@/components/BodyShape";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import TrainingRadarChart from "./TrainingRadarChart";
import { CalendarDays, Ruler, Weight } from "lucide-react";

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
    const [animatedBmi, setAnimatedBmi] = useState(0);
    const [animatedFat, setAnimatedFat] = useState(0);

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
                const height = Number(d.height);
                const weight = Number(d.weight);
                const bodyFat = Number(d.bodyFat);
                const bmiValue = weight / ((height / 100) ** 2);
                setLatest({
                    height: Number(d.height),
                    weight: Number(d.weight),
                    bodyFat: Number(d.bodyFat),
                    date: d.createdAt?.toDate().toLocaleDateString() || "未知",
                });
                // 動畫 BMI & BodyFat
                let i = 0;
                const steps = 20;
                const interval = setInterval(() => {
                    i += 1;
                    setAnimatedBmi(Math.min(i * (bmiValue / steps), bmiValue));
                    setAnimatedFat(Math.min(i * (bodyFat / steps), bodyFat));
                    if (i >= steps) clearInterval(interval);
                }, 20);
            }
        };
        fetchData();
    }, [userId, refreshTrigger]);

    if (!latest) return null;

    const { height, weight, bodyFat } = latest;
    const bmi = weight / ((height / 100) ** 2);
    const bmiLabel =
        bmi < 18.5 ? "過輕" : bmi < 24 ? "正常" : bmi < 27 ? "過重" : "肥胖";
    const fatLabel =
        bodyFat < 15 ? "精壯" : bodyFat < 25 ? "標準" : bodyFat < 30 ? "過高" : "肥胖";

    const getBmiColor = (value: number) => {
        if (value < 18.5) return "text-blue-400";
        if (value < 24) return "text-green-400";
        if (value < 27) return "text-yellow-400";
        return "text-red-400";
    };

    const getFatColor = (value: number) => {
        if (value < 15) return "text-blue-400";
        if (value < 25) return "text-green-400";
        if (value < 30) return "text-orange-400";
        return "text-red-400";
    };

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

            <div className="grid grid-cols-2 gap-3 text-white sm:grid-cols-4 sm:gap-4">
                <div className="flex min-h-[126px] min-w-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/70 p-3 shadow-lg shadow-black/20 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-orange-400/50 hover:shadow-orange-500/10">
                    <Ruler className="mb-2 h-7 w-7 text-orange-400" />
                    <div className="text-sm text-orange-400 font-medium">身高</div>
                    <div className="mt-1 text-xl font-bold">{height} <span className="text-xs font-medium text-zinc-500">cm</span></div>
                </div>
                <div className="flex min-h-[126px] min-w-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/70 p-3 shadow-lg shadow-black/20 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-orange-400/50 hover:shadow-orange-500/10">
                    <Weight className="mb-2 h-7 w-7 text-orange-400" />
                    <div className="text-sm text-orange-400 font-medium">體重</div>
                    <div className="mt-1 text-xl font-bold">{weight} <span className="text-xs font-medium text-zinc-500">kg</span></div>
                </div>
                <div className="flex min-h-[126px] min-w-0 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 p-3 text-center shadow-lg shadow-black/20 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-orange-400/50 hover:shadow-orange-500/10">
                    <div className="w-[74px] shrink-0">
                        <CircularProgressbar
                            value={animatedBmi}
                            maxValue={40}
                            text={`${bmi.toFixed(1)}`}
                            styles={buildStyles({
                                textColor: "#fff",
                                textSize: "18px",
                                pathColor: bmi < 18.5
                                    ? "#3b82f6"
                                    : bmi < 24
                                        ? "#22c55e"
                                        : bmi < 27
                                            ? "#f97316"
                                            : "#ef4444",
                                trailColor: "#1f2937",
                            })}
                        />
                    </div>
                    <div className="text-left"><div className="text-sm text-orange-400 font-medium">BMI</div><div className={`mt-1 text-xs font-semibold ${getBmiColor(animatedBmi)}`}>{bmiLabel}</div></div>
                </div>
                <div className="flex min-h-[126px] min-w-0 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 p-3 text-center shadow-lg shadow-black/20 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-orange-400/50 hover:shadow-orange-500/10">
                    <div className="w-[74px] shrink-0">
                        <CircularProgressbar
                            value={animatedFat}
                            maxValue={60}
                            text={`${bodyFat}%`}
                            styles={buildStyles({
                                textColor: "#fff",
                                textSize: "18px",
                                pathColor: bodyFat < 15
                                    ? "#3b82f6"   // 精壯
                                    : bodyFat < 25
                                        ? "#22c55e"   // 標準
                                        : bodyFat < 30
                                            ? "#f97316"   // 過高
                                            : "#ef4444",  // 肥胖
                                trailColor: "#1f2937",
                            })}
                        />
                    </div>
                    <div className="text-left"><div className="text-sm text-orange-400 font-medium">體脂</div><div className={`mt-1 text-xs font-semibold ${getFatColor(animatedFat)}`}>{fatLabel}</div></div>
                </div>
            </div>

            <div className="mx-auto mt-5 grid max-w-6xl items-stretch gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <BodyShape height={height} weight={weight} bodyFat={bodyFat} bmi={bmi} />
                <TrainingRadarChart user={user} refreshTrigger={refreshTrigger} />
            </div>
        </motion.div>
    );
}
