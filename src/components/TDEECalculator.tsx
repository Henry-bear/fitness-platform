"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Calculator, Flame, Ruler, Scale, Target, UserRound } from "lucide-react";

export default function TDEECalculator() {
    const [gender, setGender] = useState("male");
    const [age, setAge] = useState(18);
    const [height, setHeight] = useState(170);
    const [weight, setWeight] = useState(65);
    const [activity, setActivity] = useState(1.2);
    const [tdee, setTdee] = useState<number | null>(null);

    const handleCalculate = () => {
        const bmr =
            gender === "male"
                ? 10 * weight + 6.25 * height - 5 * age + 5
                : 10 * weight + 6.25 * height - 5 * age - 161;
        const total = Math.round(bmr * activity);
        setTdee(total);
    };

    const fieldClass = "w-full bg-transparent text-lg font-semibold text-white outline-none placeholder:text-zinc-700";
    const fieldShellClass = "rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition focus-within:border-orange-500/60 focus-within:bg-orange-500/[0.035]";

    return (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/68 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="border-b border-white/10 px-5 py-5 sm:px-8">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-orange-500/15 p-3 text-orange-400"><Calculator className="h-6 w-6" /></div>
                    <div><h1 className="text-2xl font-bold text-white">TDEE 能量計算</h1><p className="mt-1 text-sm text-zinc-400">估算每日消耗，找到適合你的熱量目標</p></div>
                </div>
            </div>

            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4 p-5 sm:p-8 lg:border-r lg:border-white/10">
                    <div className={fieldShellClass}>
                        <label htmlFor="tdee-gender" className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500"><UserRound className="h-4 w-4 text-orange-400" />生理性別</label>
                    <select
                        id="tdee-gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className={fieldClass}
                    >
                        <option value="male">男性</option>
                        <option value="female">女性</option>
                    </select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                    <div className={fieldShellClass}>
                    <label htmlFor="tdee-age" className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500"><Activity className="h-4 w-4 text-orange-400" />年齡</label>
                    <input
                        id="tdee-age"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className={fieldClass}
                    />
                    </div>
                    <div className={fieldShellClass}>
                    <label htmlFor="tdee-height" className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500"><Ruler className="h-4 w-4 text-orange-400" />身高 cm</label>
                    <input
                        id="tdee-height"
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className={fieldClass}
                    />
                    </div>
                    <div className={fieldShellClass}>
                    <label htmlFor="tdee-weight" className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500"><Scale className="h-4 w-4 text-orange-400" />體重 kg</label>
                    <input
                        id="tdee-weight"
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className={fieldClass}
                    />
                    </div>
                    </div>
                    <div className={fieldShellClass}>
                    <label htmlFor="tdee-activity" className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500"><Flame className="h-4 w-4 text-orange-400" />日常活動程度</label>
                    <select
                        id="tdee-activity"
                        value={activity}
                        onChange={(e) => setActivity(Number(e.target.value))}
                        className={fieldClass}
                    >
                        <option value={1.2}>久坐（幾乎沒有運動）</option>
                        <option value={1.375}>輕度活動（每週1–3天）</option>
                        <option value={1.55}>中度活動（每週3–5天）</option>
                        <option value={1.725}>高度活動（每週6–7天）</option>
                        <option value={1.9}>非常高（每天運動+體力勞動）</option>
                    </select>
                    </div>
                    <button
                        onClick={handleCalculate}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 font-semibold text-white shadow-lg shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-orange-400"
                    >
                        <Calculator className="h-4 w-4" />計算我的 TDEE
                    </button>
                </div>

                <div className="flex min-h-[360px] items-center justify-center bg-gradient-to-br from-orange-500/[0.08] to-transparent p-5 sm:p-8">
                    {tdee ? (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                            <p className="text-sm font-medium text-zinc-400">每日總消耗熱量</p>
                            <div className="mt-2 flex items-end gap-2"><span className="text-5xl font-black tracking-tight text-white">{tdee.toLocaleString()}</span><span className="pb-1 text-sm font-medium text-orange-400">kcal / 日</span></div>
                            <div className="mt-7 space-y-3">
                                {[{ label: "減脂目標", value: tdee - 300, color: "bg-emerald-400" }, { label: "維持體重", value: tdee, color: "bg-orange-400" }, { label: "增肌目標", value: tdee + 300, color: "bg-blue-400" }].map((item) => (
                                    <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><span className={`h-2.5 w-2.5 rounded-full ${item.color}`} /><span className="text-sm text-zinc-400">{item.label}</span><span className="ml-auto font-bold text-white">{item.value.toLocaleString()} kcal</span></div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="max-w-xs text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-orange-500/20 bg-orange-500/10 text-orange-400"><Target className="h-7 w-7" /></div><h2 className="mt-5 text-lg font-semibold text-white">你的能量目標會顯示在這裡</h2><p className="mt-2 text-sm leading-relaxed text-zinc-500">完成左側資料後計算，即可取得減脂、維持與增肌三種建議。</p></div>
                    )}
                </div>
            </div>
        </section>
    );
}
