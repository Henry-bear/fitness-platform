"use client";

import { useEffect, useState, useMemo } from "react";
import { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
    TooltipProps, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, Text
} from "recharts";

interface Props {
    user: User;
    refreshTrigger: number;
}

interface TooltipData {
    part: string;
    count: number;
    details?: { date: string; types: string[] }[];
}

export default function TrainingRadarChart({ user, refreshTrigger }: Props) {
    const [data, setData] = useState<TooltipData[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return now.toISOString().slice(0, 7);
    });

    const allParts = useMemo(() => ["胸部", "背部", "腿部", "肩部", "腹部", "手臂"], []);

    // ✅ 最初版的 Tooltip：只顯示訓練次數與前三筆記錄
    const CustomRadarTooltip = ({ active, payload }: TooltipProps<string, string>) => {
        if (active && payload?.length) {
            const { part, count, details } = payload[0].payload;
            return (
                <div className="bg-zinc-900 border border-orange-500 rounded px-3 py-2 text-sm text-white shadow-lg w-64">
                    <div className="font-semibold text-orange-400 mb-1">{part}</div>
                    <div className="mb-2 text-zinc-300">訓練次數：{count} 次</div>
                    {details?.length > 0 && (
                        <div className="space-y-1 text-xs">
                            {details.slice(0, 7).map((d: { date: string; types: string[] }, idx: number) => (
                                <div key={idx} className="flex justify-between">
                                    <span className="text-orange-300 w-[70px] shrink-0">{d.date}</span>
                                    <span className="text-zinc-100 text-right w-[150px] break-words">{d.types.join("、")}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    useEffect(() => {
        const fetchData = async () => {
            const snapshot = await getDocs(collection(db, "users", user.uid, "workouts"));
            const counter: Record<string, number> = {};
            const detail: Record<string, { date: string; types: string[] }[]> = {};

            snapshot.forEach((doc) => {
                const workout = doc.data();
                if (workout.date && workout.date.startsWith(selectedMonth)) {
                    const date = workout.date;
                    const exercises = workout.exercises || [];
                    const grouped: Record<string, string[]> = {};

                    exercises.forEach((ex: any) => {
                        const part = ex.part?.trim();
                        const type = ex.type;
                        if (part && type && allParts.includes(part)) {
                            counter[part] = (counter[part] || 0) + 1;
                            if (!grouped[part]) grouped[part] = [];
                            grouped[part].push(type);
                        }
                    });

                    Object.entries(grouped).forEach(([part, types]) => {
                        if (!detail[part]) detail[part] = [];
                        detail[part].push({ date, types });
                    });
                }
            });

            const formatted = allParts.map((part) => ({
                part,
                count: counter[part] || 0,
                details: detail[part] || []
            }));
            setData(formatted);
        };

        fetchData();
    }, [user.uid, selectedMonth, refreshTrigger, allParts]);

    const monthOptions = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(); // 每次都 new 一次新的 Date 物件
        date.setDate(1);
        date.setMonth(date.getMonth() - (5 - i));
        return date.toISOString().slice(0, 7);
    }).reverse(); // 從 2025-05 → 2024-12;


    const hasData = data.some((d) => d.count > 0);

    const renderRadiusTick = ({ payload, x, y }: {
        payload: { value: number };
        x: number;
        y: number;
    }) => {
        return (
            <Text
                x={x}
                y={y}
                dx={0}
                dy={-4}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#f97316"
                fontSize={10}
            >
                {payload.value}
            </Text>
        );
    };

    const renderAngleTick = ({ payload, x, y, cx, cy }: {
        payload: { value: string };
        x: number;
        y: number;
        cx: number;
        cy: number;
    }) => {
        const radiusOffset = 12;
        const angleRad = Math.atan2(y - cy, x - cx);
        const offsetX = Math.cos(angleRad) * radiusOffset;
        const offsetY = Math.sin(angleRad) * radiusOffset;

        return (
            <Text
                x={x + offsetX}
                y={y + offsetY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#f97316"
                fontSize={13}
            >
                {payload.value}
            </Text>
        );
    };

    return (
        <div className="mt-10 max-w-3xl mx-auto">
            <h3 className="text-lg font-bold text-orange-400 mb-2 text-center">訓練部位分布</h3>

            <div className="text-center mb-4">
                <label className="mr-2 text-sm text-white">月份：</label>
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-2 py-1 rounded bg-zinc-800 border border-orange-500 text-orange-400"
                >
                    {monthOptions.map((month) => (
                        <option key={month} value={month}>{month}</option>
                    ))}
                </select>
            </div>

            <ResponsiveContainer width="100%" height={360}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#f97316" />
                    <PolarAngleAxis dataKey="part" stroke="#f97316" tick={renderAngleTick} />
                    <PolarRadiusAxis axisLine={false} domain={[0, "auto"]} tick={renderRadiusTick} />
                    <Radar
                        name="訓練次數"
                        dataKey="count"
                        stroke="#fb923c"
                        fill="#fdba74"
                        fillOpacity={0.7}
                    />
                    <Tooltip content={<CustomRadarTooltip />} />
                </RadarChart>
            </ResponsiveContainer>

            <div className="min-h-[2rem] text-center mt-4 text-sm">
                {!hasData && <p className="text-zinc-400">此月份尚未有訓練紀錄</p>}
            </div>
        </div>
    );
}