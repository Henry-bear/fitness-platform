"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CalendarDays, ChevronDown, Dumbbell, Minus, Plus, Save, Trash2, X } from "lucide-react";
import ModalPortal from "./ModalPortal";

const partOptions = {
    腿部: [
        "深蹲", "腿推", "箭步蹲", "腿屈伸", "腿後彎",
        "保加利亞分腿蹲", "相撲硬舉", "羅馬尼亞硬舉"
    ],
    胸部: [
        "平板臥推", "上斜臥推", "下斜臥推",
        "啞鈴飛鳥", "機械推胸", "啞鈴胸推", "滑輪夾胸"
    ],
    背部: [
        "硬舉", "划船", "高位下拉", "滑輪拉背", "單手划船",
        "T槓划船", "引體向上", "反手引體向上"
    ],
    肩部: [
        "肩推", "啞鈴肩推", "側平舉", "前平舉",
        "後三角飛鳥", "阿諾肩推", "機械肩推"
    ],
    腹部: [
        "仰臥起坐", "捲腹", "仰臥抬腿", "俄羅斯轉體",
        "登山者", "腹肌輪", "反向捲腹", "棒式支撐"
    ],
    手臂: [
        "二頭彎舉", "槌式彎舉", "三頭下推", "三頭臂屈伸",
        "集中彎舉", "Z槓彎舉", "繩索彎舉", "繩索三頭伸展"
    ]
} as const;


type PartKey = keyof typeof partOptions;

interface Exercise {
    part: PartKey | "";
    type: string;
    weight: string;
    sets: string;
    reps: string;
}

const createExercise = (): Exercise => ({
    part: "",
    type: "",
    weight: "20",
    sets: "3",
    reps: "10",
});

const toDateValue = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

function NumericStepper({ label, unit, value, step, min, max, onChange }: {
    label: string;
    unit: string;
    value: string;
    step: number;
    min: number;
    max: number;
    onChange: (value: string) => void;
}) {
    const update = (direction: -1 | 1) => {
        const current = Number(value) || min;
        const next = Math.min(max, Math.max(min, current + direction * step));
        onChange(Number.isInteger(next) ? String(next) : next.toFixed(1));
    };

    return (
        <div className="min-w-0 rounded-2xl border border-white/10 bg-zinc-900/75 p-2.5 text-center">
            <p className="text-[11px] font-medium text-zinc-500">{label}</p>
            <div className="mt-2 flex items-center justify-between gap-1">
                <button type="button" onClick={() => update(-1)} aria-label={`減少${label}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-orange-400/40 hover:text-orange-300"><Minus className="h-4 w-4" /></button>
                <div className="min-w-0">
                    <span className="block truncate text-lg font-bold text-white">{value}</span>
                    <span className="block text-[10px] text-zinc-600">{unit}</span>
                </div>
                <button type="button" onClick={() => update(1)} aria-label={`增加${label}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-orange-400/40 hover:text-orange-300"><Plus className="h-4 w-4" /></button>
            </div>
        </div>
    );
}

type Props = {
    user: User;
    onClose?: () => void;
    onSaved?: () => void;
};

export default function WorkoutForm({ user, onClose, onSaved }: Props) {
    const [exercises, setExercises] = useState<Exercise[]>([createExercise()]);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
    const [date, setDate] = useState(() => toDateValue(new Date()));
    const today = toDateValue(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = toDateValue(yesterdayDate);
    const formattedDate = new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric", weekday: "short" }).format(new Date(`${date}T12:00:00`));

    const handleChange = <K extends keyof Exercise>(index: number, field: K, value: Exercise[K]) => {
        const updated = [...exercises];
        updated[index][field] = value;
        if (field === "part") updated[index].type = "";
        setExercises(updated);
    };

    const addExercise = () => {
        setExercises([...exercises, createExercise()]);
        setExpandedIndex(exercises.length);
    };

    const removeExercise = (index: number) => {
        const updated = exercises.filter((_, i) => i !== index);
        setExercises(updated);
        if (expandedIndex === index) setExpandedIndex(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || exercises.some(e => !e.part || !e.type || !e.weight || !e.sets || !e.reps)) {
            toast.error("請填寫所有欄位");
            return;
        }
        if (exercises.some(e => Number(e.weight) <= 0 || Number(e.sets) <= 0 || Number(e.reps) <= 0)) {
            toast.error("請輸入正確的數值");
            return;
        }
        try {
            const ref = collection(db, "users", user.uid, "workouts");
            await addDoc(ref, {
                date,
                exercises,
                createdAt: serverTimestamp(),
            });
            toast.success("訓練紀錄已成功儲存！");
            if (onClose) onClose();
            if (onSaved) onSaved();
            setExercises([createExercise()]);
            setDate(today);
            setExpandedIndex(0);
        } catch (error) {
            console.error("儲存失敗", error);
            toast.error("儲存失敗，請稍後再試。");
        }
    };

    return (
        <ModalPortal>
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/75 p-2 backdrop-blur-md sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workout-form-title"
        >
            <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ duration: 0.22 }}
                className="relative max-h-[92dvh] min-w-0 w-full max-w-2xl overflow-x-hidden overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950/95 p-4 text-white shadow-2xl shadow-black/60 sm:p-6"
            >
                <div aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
                <button type="button" onClick={onClose} aria-label="關閉訓練紀錄視窗" className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white">
                    <X className="h-4 w-4" />
                </button>

                <div className="relative mb-6 flex items-center gap-3">
                    <div className="rounded-2xl bg-orange-500/15 p-3 text-orange-400"><Dumbbell className="h-6 w-6" /></div>
                    <div>
                        <h2 id="workout-form-title" className="text-xl font-bold text-white">新增訓練紀錄</h2>
                        <p className="mt-0.5 text-sm text-zinc-400">選擇動作，快速記錄。</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="relative min-w-0 max-w-full">
                    <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300"><CalendarDays className="h-4 w-4 text-orange-400" />訓練日期</label>
                            <span className="text-xs font-medium text-orange-300">{formattedDate}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button type="button" onClick={() => setDate(today)} className={`rounded-xl px-2 py-2.5 text-sm font-semibold transition ${date === today ? "bg-orange-500 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"}`}>今天</button>
                            <button type="button" onClick={() => setDate(yesterday)} className={`rounded-xl px-2 py-2.5 text-sm font-semibold transition ${date === yesterday ? "bg-orange-500 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"}`}>昨天</button>
                            <label className={`relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl px-2 py-2.5 text-sm font-semibold transition ${date !== today && date !== yesterday ? "bg-orange-500 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"}`}>
                                選日期
                                <input aria-label="選擇其他訓練日期" type="date" value={date} onChange={(event) => setDate(event.target.value)} max={today} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                            </label>
                        </div>
                    </div>
                    {exercises.map((exercise, index) => {
                        const isExpanded = expandedIndex === index;
                        const currentOptions = exercise.part && exercise.part in partOptions ? partOptions[exercise.part as PartKey] : [];
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                layout
                                className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition hover:border-white/20">
                                <div className="flex items-center gap-2 p-2">
                                    <button type="button" className="flex min-w-0 flex-1 items-center justify-between rounded-xl px-2 py-2 text-left hover:bg-white/5" onClick={() => setExpandedIndex(isExpanded ? null : index)}>
                                    <span className="truncate text-sm font-medium text-zinc-200">
                                        訓練 #{index + 1}：
                                        {exercise.type ? ` ${exercise.type}（${exercise.weight}kg x ${exercise.sets}組 x ${exercise.reps}下）` : " 尚未填寫"}
                                    </span>
                                    <motion.span animate={{ rotate: isExpanded ? 180 : 0 }}><ChevronDown className="h-4 w-4 text-zinc-500" /></motion.span>
                                    </button>
                                    {exercises.length > 1 && (
                                        <button type="button" aria-label={`刪除訓練 ${index + 1}`} className="rounded-xl p-2.5 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400" onClick={() => removeExercise(index)}><Trash2 className="h-4 w-4" /></button>
                                    )}
                                </div>
                                {isExpanded && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 border-t border-white/10 px-3 pb-4 pt-3">
                                        <div>
                                            <p className="mb-2 text-xs font-medium text-zinc-500">1. 選擇訓練部位</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(Object.keys(partOptions) as PartKey[]).map((part) => {
                                                    const selected = exercise.part === part;
                                                    return <button key={part} type="button" onClick={() => handleChange(index, "part", part)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${selected ? "border-orange-400/60 bg-orange-500/15 text-orange-300" : "border-white/10 bg-zinc-900/70 text-zinc-400 hover:border-white/20 hover:text-white"}`}><span className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]" : "bg-zinc-700"}`} />{part}</button>;
                                                })}
                                            </div>
                                        </div>

                                        {exercise.part && (
                                            <div>
                                                <p className="mb-2 text-xs font-medium text-zinc-500">2. 點選訓練項目</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {currentOptions.map((type) => <button key={type} type="button" onClick={() => handleChange(index, "type", type)} className={`min-h-11 rounded-xl border px-2 py-2 text-sm font-medium leading-tight transition ${exercise.type === type ? "border-orange-400/60 bg-orange-500 text-white shadow-lg shadow-orange-950/25" : "border-white/10 bg-zinc-900/70 text-zinc-300 hover:border-orange-400/30 hover:bg-orange-500/10"}`}>{type}</button>)}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <p className="mb-2 text-xs font-medium text-zinc-500">3. 需要時再微調</p>
                                            <div className="grid min-w-0 grid-cols-3 gap-2">
                                                <NumericStepper label="重量" unit="kg" value={exercise.weight} step={2.5} min={2.5} max={350} onChange={(value) => handleChange(index, "weight", value)} />
                                                <NumericStepper label="組數" unit="組" value={exercise.sets} step={1} min={1} max={20} onChange={(value) => handleChange(index, "sets", value)} />
                                                <NumericStepper label="次數" unit="下" value={exercise.reps} step={1} min={1} max={100} onChange={(value) => handleChange(index, "reps", value)} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}

                    <button type="button" onClick={addExercise} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-500/60 px-3 py-3 text-sm font-medium text-orange-400 transition hover:border-orange-400 hover:bg-orange-500/10">
                        <Plus className="h-4 w-4" />新增訓練項目
                    </button>

                    <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                        <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white">取消</button>
                        <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-950/40 transition hover:-translate-y-0.5 hover:bg-orange-400"><Save className="h-4 w-4" />儲存</button>
                    </div>
                </form>
            </motion.div>
        </div>
        </ModalPortal>
    );
}
