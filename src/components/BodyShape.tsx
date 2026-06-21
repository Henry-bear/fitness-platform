"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Ruler } from "lucide-react";

type Props = { height: number; weight: number; bodyFat: number; bmi: number };
type Figure = "male" | "female";
type FatCategory = "low" | "standard" | "high" | "obese";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const REFERENCE_BODY_PATH = "M 85.7 15.0 L 97.2 15.7 L 102.4 18.8 L 103.8 21.6 L 102.9 28.2 L 104.3 28.2 L 104.3 32.4 L 99.1 39.0 L 100.5 48.4 L 110.5 52.6 L 122.4 55.4 L 129.6 61.3 L 132.5 76.6 L 132.9 87.7 L 138.7 99.2 L 140.1 118.3 L 141.5 122.5 L 141.5 134.0 L 137.2 142.0 L 133.4 144.8 L 132.0 144.4 L 135.3 140.3 L 135.8 136.1 L 132.9 133.3 L 132.5 138.2 L 130.1 138.5 L 130.1 130.9 L 132.9 127.4 L 133.4 123.6 L 124.3 104.4 L 123.4 92.6 L 117.7 79.4 L 116.7 79.4 L 112.4 91.6 L 112.4 111.4 L 117.2 124.6 L 119.1 147.2 L 116.7 159.4 L 112.4 170.9 L 112.4 185.2 L 114.8 192.1 L 115.3 199.8 L 108.6 222.4 L 109.6 225.9 L 108.6 230.7 L 112.4 234.6 L 112.4 236.0 L 107.2 237.0 L 97.2 236.3 L 100.5 218.9 L 96.7 200.8 L 98.1 179.6 L 96.7 160.4 L 93.3 146.9 L 92.9 136.4 L 86.7 136.4 L 86.2 146.9 L 82.8 160.4 L 81.4 179.6 L 82.8 200.8 L 79.5 213.7 L 80.0 228.0 L 82.4 236.3 L 72.3 237.0 L 67.1 236.0 L 67.1 234.6 L 70.9 230.7 L 70.0 228.6 L 70.9 222.7 L 64.2 199.8 L 64.7 192.5 L 67.1 185.2 L 67.1 170.9 L 61.4 153.1 L 60.4 141.3 L 62.3 124.6 L 67.1 111.4 L 67.6 93.3 L 62.8 79.4 L 61.4 80.1 L 56.1 92.6 L 55.2 104.4 L 46.1 123.6 L 46.1 126.3 L 49.4 130.9 L 49.4 138.5 L 47.1 138.2 L 47.1 133.7 L 46.1 133.3 L 43.7 136.1 L 43.7 138.9 L 47.5 144.4 L 46.1 144.8 L 41.8 141.7 L 38.0 134.0 L 40.4 102.0 L 46.6 87.7 L 49.4 62.3 L 51.8 58.8 L 57.1 55.4 L 69.0 52.6 L 79.0 48.4 L 80.5 39.0 L 77.1 34.1 L 75.7 33.8 L 75.2 28.2 L 76.6 28.2 L 75.7 21.6 L 77.1 18.8 L 80.0 16.7 L 85.7 15.0 Z";
const REFERENCE_BODY_POINTS = (REFERENCE_BODY_PATH.match(/-?\d+(?:\.\d+)?/g) || []).reduce<[number, number][]>((points, value, index, values) => {
    if (index % 2 === 0) points.push([Number(value), Number(values[index + 1])]);
    return points;
}, []);

function deformBodyPath(waistAdjustment: number, figure: Figure, leanFactor: number) {
    const points = REFERENCE_BODY_POINTS.map(([x, y]) => {
        const distance = Math.abs(x - 90);
        let scale = 1;
        if (y >= 76 && y <= 178 && distance < 33) {
            const waistInfluence = Math.exp(-(((y - 126) / 28) ** 2));
            const hipInfluence = Math.exp(-(((y - 157) / 25) ** 2));
            scale += waistAdjustment * waistInfluence;
            scale += (figure === "female" ? 0.07 : 0) * hipInfluence;
        }
        if (y >= 48 && y <= 92 && distance >= 18 && distance < 44) {
            const shoulderInfluence = Math.exp(-(((y - 66) / 17) ** 2));
            scale += ((figure === "male" ? 0.025 : -0.035) + leanFactor * 0.035) * shoulderInfluence;
        }
        return [90 + (x - 90) * scale, y];
    });
    return `M ${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`;
}

function getFatCategory(bodyFat: number, figure: Figure): FatCategory {
    const limits = figure === "male" ? [10, 21, 26] : [20, 34, 39];
    if (bodyFat <= limits[0]) return "low";
    if (bodyFat <= limits[1]) return "standard";
    if (bodyFat <= limits[2]) return "high";
    return "obese";
}

export default function BodyShape({ height, weight, bodyFat, bmi }: Props) {
    const [figure, setFigure] = useState<Figure>("male");
    const [showWaistControl, setShowWaistControl] = useState(false);
    const [waistInput, setWaistInput] = useState("");
    const heightInMeters = height / 100;
    const leanMass = weight * (1 - bodyFat / 100);
    const ffmi = leanMass / (heightInMeters ** 2);
    const frameFactor = clamp((bmi - 17) / 14, 0, 1);
    const leanFactor = clamp((ffmi - 14) / 10, 0, 1);
    const fatFactor = clamp((bodyFat - 10) / 27, 0, 1);
    const isMaleFigure = figure === "male";
    const estimatedWaistCm = useMemo(() => Math.round(clamp(height * (0.34 + frameFactor * 0.08 + fatFactor * 0.07), 52, 145)), [height, frameFactor, fatFactor]);
    const waistCm = waistInput === "" ? estimatedWaistCm : clamp(Number(waistInput) || estimatedWaistCm, 45, 160);
    const waistToHeight = waistCm / height;
    const standardFatCenter = isMaleFigure ? 17 : 27;
    const estimatedWaistAdjustment = clamp((bmi - 23) / 45 + (bodyFat - standardFatCenter) / 90, -0.12, 0.22);
    const waistAdjustment = waistInput === "" ? estimatedWaistAdjustment : clamp((waistToHeight - 0.46) * 1.8, -0.18, 0.28);
    const deformedBodyPath = useMemo(() => deformBodyPath(waistAdjustment, figure, leanFactor), [waistAdjustment, figure, leanFactor]);
    const shoulder = (isMaleFigure ? 30 : 27) + leanFactor * (isMaleFigure ? 6 : 4) + frameFactor * 1.5;
    const waist = 19 + clamp((waistToHeight - 0.32) / 0.36, 0, 1) * 11 + (isMaleFigure ? 1 : 0);
    const heightScale = clamp(height / 176, 0.98, 1.02);
    const taperScore = clamp((shoulder - waist - 7) / 20, 0, 1);
    const fatCategory = getFatCategory(bodyFat, figure);
    const fatLabel = { low: "偏低", standard: "標準", high: "微胖", obese: "肥胖" }[fatCategory];
    const bmiLabel = bmi < 18.5 ? "體重過輕" : bmi < 24 ? "健康體位" : bmi < 27 ? "體重過重" : bmi < 30 ? "輕度肥胖" : bmi < 35 ? "中度肥胖" : "重度肥胖";
    const waistLimit = isMaleFigure ? 90 : 80;
    const waistIsHigh = waistInput !== "" && waistCm >= waistLimit;
    const profile = bmi < 18.5
        ? "體重偏輕"
        : bmi >= 27
            ? bmiLabel
            : fatCategory === "obese"
                ? "體脂偏高"
                : waistIsHigh
                    ? "腰圍偏高"
                    : bmi >= 24 && leanFactor > 0.68 && fatCategory === "standard"
                        ? "高除脂體重"
                        : bmi >= 24
                            ? "體重過重"
                            : fatCategory === "high"
                                ? "體脂微胖"
                                : "健康體位";
    const severity = bmi >= 30 || fatCategory === "obese" ? 3 : bmi >= 27 || fatCategory === "high" || waistIsHigh ? 2 : bmi >= 24 || bmi < 18.5 ? 1 : 0;
    const silhouetteColor = ["#22c55e", "#38bdf8", "#f97316", "#ef4444"][severity];
    return (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/55 p-5 text-left shadow-xl shadow-black/20 backdrop-blur-md">
            <div aria-hidden="true" className="absolute -left-16 top-12 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
                <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">Body profile</p><h3 className="mt-1 text-lg font-bold text-white">即時體態輪廓</h3><p className="mt-1 text-xs leading-5 text-zinc-500">依台灣成人體位標準與身體數據塑形</p></div>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold" style={{ color: silhouetteColor }}>{profile}</span>
            </div>

            <div className="relative mt-4 flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl border border-white/10 bg-black/30 p-1" aria-label="選擇體態輪廓">
                    {(["male", "female"] as const).map((option) => <button key={option} type="button" onClick={() => setFigure(option)} aria-pressed={figure === option} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${figure === option ? "bg-orange-500 text-white shadow-lg shadow-orange-950/30" : "text-zinc-500 hover:text-white"}`}>{option === "male" ? "男性輪廓" : "女性輪廓"}</button>)}
                </div>
                <button type="button" onClick={() => setShowWaistControl((current) => !current)} className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${showWaistControl || waistInput ? "border-orange-500/40 bg-orange-500/10 text-orange-300" : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"}`}><Ruler className="h-3.5 w-3.5" />{waistInput ? `腰圍 ${waistCm} cm` : "輸入腰圍"}</button>
            </div>

            {showWaistControl && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="relative mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-center justify-between gap-3"><label htmlFor="body-waist" className="text-xs font-medium text-zinc-400">腰圍（選填）</label><div className="flex items-center gap-2"><span className="text-sm font-bold text-orange-300">{waistInput ? waistCm : estimatedWaistCm} cm</span>{waistInput && <button type="button" onClick={() => setWaistInput("")} className="rounded-lg p-1 text-zinc-500 transition hover:bg-white/5 hover:text-white" aria-label="恢復估算腰圍"><RotateCcw className="h-3.5 w-3.5" /></button>}</div></div>
                <input id="body-waist" type="range" min="45" max="160" step="1" value={waistInput || estimatedWaistCm} onChange={(event) => setWaistInput(event.target.value)} className="mt-3 h-1.5 w-full cursor-pointer accent-orange-500" />
                <p className="mt-2 text-[10px] text-zinc-600">腰圍會納入體位標記；男性 90 cm、女性 80 cm 起列為偏高參考。</p>
            </motion.div>}

            <div className="relative mt-3 grid grid-cols-[minmax(150px,1fr)_auto] items-center gap-4">
                <svg viewBox="0 0 180 250" className="mx-auto h-64 w-full max-w-[205px]" role="img" aria-label={`體態輪廓，${profile}，BMI ${bmi.toFixed(1)}，體脂 ${bodyFat}%`}>
                    <defs>
                        <linearGradient id="natural-body-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={silhouetteColor} stopOpacity="0.94" /><stop offset="0.55" stopColor="#f97316" stopOpacity="0.78" /><stop offset="1" stopColor="#fb923c" stopOpacity="0.5" /></linearGradient>
                        <filter id="natural-body-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    </defs>
                    <g opacity="0.13" fill="none" stroke="#f97316"><ellipse cx="90" cy="127" rx="61" ry="105" strokeDasharray="3 5" /><line x1="90" y1="14" x2="90" y2="238" strokeDasharray="2 7" /></g>
                    <motion.g initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} transform={`translate(90 18) scale(1 ${heightScale}) translate(-90 -18)`} fill="url(#natural-body-fill)" stroke={silhouetteColor} strokeWidth="0.75" strokeLinejoin="round" filter="url(#natural-body-glow)">
                        <motion.path animate={{ d: deformedBodyPath }} transition={{ duration: 0.5, ease: "easeInOut" }} />
                    </motion.g>
                </svg>

                <div className="space-y-2 text-right">
                    <div><p className="text-[11px] text-zinc-500">身高 / 體重</p><p className="font-semibold text-white">{height} cm · {weight} kg</p></div>
                    <div><p className="text-[11px] text-zinc-500">BMI</p><p className="font-semibold" style={{ color: silhouetteColor }}>{bmi.toFixed(1)}</p><p className="text-[10px] text-zinc-500">{bmiLabel}</p></div>
                    <div><p className="text-[11px] text-zinc-500">體脂</p><p className="font-semibold" style={{ color: silhouetteColor }}>{bodyFat}%</p><p className="text-[10px] text-zinc-500">{fatLabel}（18–39歲）</p></div>
                    <div><p className="text-[11px] text-zinc-500">除脂體重</p><p className="font-semibold text-white">{leanMass.toFixed(1)} kg</p><p className="text-[10px] text-zinc-500">FFMI {ffmi.toFixed(1)}</p></div>
                </div>
            </div>

            <div className="relative grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-[11px]"><div className="rounded-xl bg-white/[0.035] px-3 py-2 text-zinc-400"><span className="block text-zinc-600">輪廓特徵</span>{taperScore > 0.55 ? "肩腰差較明顯" : taperScore > 0.3 ? "肩腰比例均衡" : "軀幹線條柔和"}</div><div className="rounded-xl bg-white/[0.035] px-3 py-2 text-zinc-400"><span className="block text-zinc-600">腰圍來源</span>{waistInput ? `${waistCm} cm · ${waistIsHigh ? "偏高" : "範圍內"}` : `系統估算 ${estimatedWaistCm} cm`}</div></div>
            <p className="relative mt-3 text-[10px] leading-4 text-zinc-600">BMI、腰圍及體脂分級參考衛福部國健署；體脂目前採 18–39 歲區間。此圖用於趨勢呈現，不作為醫療診斷。</p>
        </motion.section>
    );
}
