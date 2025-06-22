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
import { Ruler, Weight } from "lucide-react";

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
    function getShapeType(bmi: number, fat: number): "slim" | "normal" | "overweight" {
        if (bmi < 18.5 || fat < 12) return "slim";             // 偏瘦或精壯
        if (bmi >= 27 || fat >= 25) return "overweight";       // 過重或體脂偏高
        return "normal";                                       // 介於中間者
    }

    const shapeType = getShapeType(bmi, bodyFat);
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
            className="w-full max-w-4xl mx-auto text-white"
        >
            <h3 className="text-xl font-bold text-orange-400 mb-4 text-center tracking-wide">
                目前身體數據
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-white">
                <div className="bg-zinc-900 border border-orange-500 rounded-xl p-4 shadow flex flex-col items-center justify-center min-h-[180px] sm:min-h-[200px] transition duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-orange-300">
                    <Ruler className="w-12 h-12 text-orange-400 mb-2" />
                    <div className="text-sm text-orange-400 font-medium">身高</div>
                    <div className="text-2xl font-bold">{height} cm</div>
                </div>
                <div className="bg-zinc-900 border border-orange-500 rounded-xl p-4 shadow flex flex-col items-center justify-center min-h-[180px] sm:min-h-[200px] transition duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-orange-300">
                    <Weight className="w-12 h-12 text-orange-400 mb-2" />
                    <div className="text-sm text-orange-400 font-medium">體重</div>
                    <div className="text-2xl font-bold">{weight} kg</div>
                </div>
                <div className="bg-zinc-900 border border-orange-500 rounded-xl p-4 text-center shadow flex flex-col items-center justify-center min-h-[180px] sm:min-h-[200px] transition duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-orange-300">
                    <div className="w-[70%]">
                        <CircularProgressbar
                            value={animatedBmi}
                            maxValue={40}
                            text={`${bmi.toFixed(1)}`}
                            styles={buildStyles({
                                textColor: "#fff",
                                textSize: "16px",
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
                    <div className="text-sm mt-2 text-orange-400 font-medium">BMI</div>
                    <div className={`text-xs font-semibold ${getBmiColor(animatedBmi)}`}>
                        {bmiLabel}
                    </div>
                </div>
                <div className="bg-zinc-900 border border-orange-500 rounded-xl p-4 text-center shadow flex flex-col items-center justify-center min-h-[180px] sm:min-h-[200px] transition duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-orange-300">
                    <div className="w-[70%]">
                        <CircularProgressbar
                            value={animatedFat}
                            maxValue={60}
                            text={`${bodyFat}%`}
                            styles={buildStyles({
                                textColor: "#fff",
                                textSize: "16px",
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
                    <div className="text-sm mt-2 text-orange-400 font-medium">體脂</div>
                    <div className={`text-xs font-semibold ${getFatColor(animatedFat)}`}>
                        {fatLabel}
                    </div>
                </div>
            </div>

            <div className="mt-10 flex flex-col md:flex-row items-center gap-6 max-w-5xl mx-auto">
                {/* 左側：圖片 */}
                <div className="w-full md:w-1/2">
                    <BodyShape type={shapeType} />
                </div>

                {/* 右側：雷達圖 */}
                <div className="w-full md:w-1/2">
                    <TrainingRadarChart user={user} refreshTrigger={refreshTrigger} />
                </div>
            </div>
        </motion.div>
    );
}