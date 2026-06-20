"use client";

import { motion } from "framer-motion";

type Props = {
    height: number;
    weight: number;
    bodyFat: number;
    bmi: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function BodyShape({ height, weight, bodyFat, bmi }: Props) {
    const bodyFactor = clamp((bmi - 17) / 17, 0, 1);
    const fatFactor = clamp((bodyFat - 10) / 30, 0, 1);
    const widthFactor = bodyFactor * 0.62 + fatFactor * 0.38;
    const shoulder = 38 + widthFactor * 12;
    const waist = 23 + widthFactor * 18;
    const hip = 28 + widthFactor * 15;
    const heightScale = clamp(height / 170, 0.9, 1.08);
    const silhouetteColor = bodyFat < 15 ? "#38bdf8" : bodyFat < 25 ? "#22c55e" : bodyFat < 30 ? "#f97316" : "#ef4444";
    const status = bmi < 18.5 ? "偏輕" : bmi < 24 && bodyFat < 25 ? "標準" : bmi < 27 && bodyFat < 30 ? "略高" : "需留意";
    const bmiLabel = bmi < 18.5 ? "過輕" : bmi < 24 ? "正常" : bmi < 27 ? "過重" : "肥胖";
    const fatLabel = bodyFat < 15 ? "精壯" : bodyFat < 25 ? "標準" : bodyFat < 30 ? "過高" : "肥胖";

    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/55 p-5 text-left shadow-xl shadow-black/20 backdrop-blur-md"
        >
            <div aria-hidden="true" className="absolute -left-16 top-12 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">Body profile</p>
                    <h3 className="mt-1 text-lg font-bold text-white">即時體態輪廓</h3>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">依身高、體重與體脂動態繪製</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold" style={{ color: silhouetteColor }}>{status}</span>
            </div>

            <div className="relative mt-3 grid grid-cols-[minmax(130px,1fr)_auto] items-center gap-4">
                <svg viewBox="0 0 180 250" className="mx-auto h-56 w-full max-w-[190px]" role="img" aria-label={`依目前數據產生的體態輪廓，BMI ${bmi.toFixed(1)}，體脂 ${bodyFat}%`}>
                    <defs>
                        <linearGradient id="body-profile-fill" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor={silhouetteColor} stopOpacity="0.9" />
                            <stop offset="1" stopColor="#fb923c" stopOpacity="0.48" />
                        </linearGradient>
                        <filter id="body-profile-glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>
                    <g opacity="0.2" stroke="#a1a1aa" strokeWidth="0.6">
                        {[45, 85, 125, 165, 205].map((y) => <line key={y} x1="25" y1={y} x2="155" y2={y} />)}
                    </g>
                    <g transform={`translate(90 18) scale(1 ${heightScale}) translate(-90 -18)`} fill="url(#body-profile-fill)" stroke={silhouetteColor} strokeWidth="1.5" filter="url(#body-profile-glow)">
                        <circle cx="90" cy="35" r="15" />
                        <rect x="82" y="49" width="16" height="14" rx="7" />
                        <path d={`M ${90 - shoulder} 69 Q 90 55 ${90 + shoulder} 69 L ${90 + waist} 139 Q 90 151 ${90 - waist} 139 Z`} />
                        <path d={`M ${90 - shoulder + 4} 72 Q ${90 - shoulder - 13} 108 ${90 - hip - 11} 157 Q ${90 - hip - 6} 164 ${90 - hip} 157 L ${90 - waist - 2} 101 Z`} />
                        <path d={`M ${90 + shoulder - 4} 72 Q ${90 + shoulder + 13} 108 ${90 + hip + 11} 157 Q ${90 + hip + 6} 164 ${90 + hip} 157 L ${90 + waist + 2} 101 Z`} />
                        <path d={`M ${90 - waist} 134 Q ${90 - hip} 151 ${90 - hip + 2} 174 L 78 230 Q 84 238 90 229 L 92 171 Q 91 148 90 141 Z`} />
                        <path d={`M ${90 + waist} 134 Q ${90 + hip} 151 ${90 + hip - 2} 174 L 102 230 Q 96 238 90 229 L 88 171 Q 89 148 90 141 Z`} />
                    </g>
                </svg>

                <div className="space-y-2 text-right">
                    <div><p className="text-[11px] text-zinc-500">身高</p><p className="font-semibold text-white">{height} cm</p></div>
                    <div><p className="text-[11px] text-zinc-500">體重</p><p className="font-semibold text-white">{weight} kg</p></div>
                    <div><p className="text-[11px] text-zinc-500">BMI</p><p className="font-semibold" style={{ color: silhouetteColor }}>{bmi.toFixed(1)}</p><p className="text-[10px] text-zinc-500">{bmiLabel}</p></div>
                    <div><p className="text-[11px] text-zinc-500">體脂</p><p className="font-semibold" style={{ color: silhouetteColor }}>{bodyFat}%</p><p className="text-[10px] text-zinc-500">{fatLabel}</p></div>
                </div>
            </div>
            <p className="relative mt-2 border-t border-white/10 pt-3 text-[11px] leading-5 text-zinc-500">輪廓用於呈現數值變化趨勢，不代表醫療或精密體型判定。</p>
        </motion.section>
    );
}
