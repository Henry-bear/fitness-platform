"use client";

import { useEffect, useMemo, useState } from "react";
import { User } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dumbbell, TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import dayjs from "dayjs";

interface Props {
    user: User;
    refreshTrigger: number;
}

interface Exercise {
    part?: string;
    type?: string;
}

interface TrainingPart {
    part: string;
    count: number;
    details: { date: string; types: string[] }[];
}

const PARTS = ["胸部", "背部", "腿部", "肩部", "腹部", "手臂"];

export default function TrainingRadarChart({ user, refreshTrigger }: Props) {
    const [data, setData] = useState<TrainingPart[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => dayjs().format("YYYY-MM"));

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const snapshot = await getDocs(collection(db, "users", user.uid, "workouts"));
                const counter: Record<string, number> = {};
                const details: Record<string, { date: string; types: string[] }[]> = {};

                snapshot.forEach((snapshotDoc) => {
                    const workout = snapshotDoc.data();
                    if (!workout.date || dayjs(workout.date).format("YYYY-MM") !== selectedMonth) return;

                    const grouped: Record<string, string[]> = {};
                    (workout.exercises || []).forEach((exercise: Exercise) => {
                        const part = exercise.part?.trim();
                        if (!part || !exercise.type || !PARTS.includes(part)) return;
                        counter[part] = (counter[part] || 0) + 1;
                        grouped[part] = [...(grouped[part] || []), exercise.type];
                    });

                    Object.entries(grouped).forEach(([part, types]) => {
                        details[part] = [...(details[part] || []), { date: workout.date, types }];
                    });
                });

                setData(PARTS.map((part) => ({ part, count: counter[part] || 0, details: details[part] || [] })));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user.uid, selectedMonth, refreshTrigger]);

    const monthOptions = useMemo(
        () => Array.from({ length: 6 }, (_, index) => dayjs().subtract(index, "month").format("YYYY-MM")),
        []
    );
    const total = data.reduce((sum, item) => sum + item.count, 0);
    const activeParts = data.filter((item) => item.count > 0);
    const maxCount = Math.max(...data.map((item) => item.count), 1);
    const leadingPart = [...data].sort((a, b) => b.count - a.count)[0];
    const canRenderRadar = activeParts.length >= 3;

    return (
        <section className="relative h-full min-h-[390px] overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/55 p-5 text-left shadow-xl shadow-black/20 backdrop-blur-md">
            <div aria-hidden="true" className="absolute -right-20 bottom-0 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
            <div className="relative flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">Training balance</p>
                    <h3 className="mt-1 text-lg font-bold text-white">訓練部位分布</h3>
                    <p className="mt-1 text-xs text-zinc-500">看見本月訓練是否均衡</p>
                </div>
                <select
                    aria-label="訓練分布月份"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 outline-none focus:border-orange-500/60"
                >
                    {monthOptions.map((month) => <option key={month} value={month}>{month}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="relative mt-6 grid h-64 place-items-center rounded-2xl border border-white/5 bg-white/[0.025] text-sm text-zinc-500">讀取訓練紀錄中...</div>
            ) : total === 0 ? (
                <div className="relative mt-6 flex min-h-[275px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-5 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-500/10 text-orange-400"><Dumbbell className="h-7 w-7" /></div>
                    <h4 className="mt-4 font-semibold text-white">這個月還沒有訓練足跡</h4>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">從「記錄＋」新增第一筆訓練，這裡會自動整理各部位的訓練比例。</p>
                    <div className="mt-5 grid w-full grid-cols-3 gap-2 sm:grid-cols-6">
                        {PARTS.map((part) => <span key={part} className="rounded-lg border border-white/5 bg-white/[0.025] px-2 py-2 text-xs text-zinc-600">{part}</span>)}
                    </div>
                </div>
            ) : canRenderRadar ? (
                <div className="relative mt-3">
                    <ResponsiveContainer width="100%" height={270}>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                            <PolarGrid stroke="#3f3f46" />
                            <PolarAngleAxis dataKey="part" tick={{ fill: "#d4d4d8", fontSize: 12 }} />
                            <Radar name="訓練項目" dataKey="count" stroke="#fb923c" fill="#f97316" fillOpacity={0.34} strokeWidth={2} isAnimationActive />
                            <Tooltip contentStyle={{ background: "#18181b", border: "1px solid rgba(249,115,22,.35)", borderRadius: 12 }} labelStyle={{ color: "#fb923c" }} />
                        </RadarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3 text-xs text-zinc-400">
                        <span>共記錄 {total} 個訓練項目</span>
                        <span className="flex items-center gap-1 text-orange-300"><TrendingUp className="h-3.5 w-3.5" />最多：{leadingPart.part} {leadingPart.count} 次</span>
                    </div>
                </div>
            ) : (
                <div className="relative mt-6">
                    <div className="rounded-2xl border border-orange-500/15 bg-orange-500/[0.045] px-4 py-3 text-sm leading-6 text-zinc-300">已開始累積資料。再訓練其他部位後，會自動切換為完整雷達圖。</div>
                    <div className="mt-5 space-y-3">
                        {data.map((item) => (
                            <div key={item.part} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-3 text-sm">
                                <span className={item.count ? "text-zinc-200" : "text-zinc-600"}>{item.part}</span>
                                <div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-300 transition-[width] duration-500" style={{ width: `${(item.count / maxCount) * 100}%` }} /></div>
                                <span className="text-right text-xs text-zinc-500">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
