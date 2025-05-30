"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

type Props = {
    user: User;
    onClose?: () => void;
    onSaved?: () => void;
};

export default function WorkoutForm({ user, onClose, onSaved }: Props) {
    const [exercises, setExercises] = useState<Exercise[]>([{
        part: "",
        type: "",
        weight: "",
        sets: "",
        reps: "",
    }]);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
    const [date, setDate] = useState("");
    const today = new Date().toISOString().split("T")[0];

    const handleChange = <K extends keyof Exercise>(index: number, field: K, value: Exercise[K]) => {
        const updated = [...exercises];
        updated[index][field] = value;
        if (field === "part") updated[index].type = "";
        setExercises(updated);
    };

    const addExercise = () => {
        setExercises([...exercises, { part: "", type: "", weight: "", sets: "", reps: "" }]);
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
            setExercises([{ part: "", type: "", weight: "", sets: "", reps: "" }]);
            setDate("");
            setExpandedIndex(0);
        } catch (error) {
            console.error("儲存失敗", error);
            toast.error("儲存失敗，請稍後再試。");
        }
    };

    return (
        <div className="fixed inset-0 z-[999] bg-black/60 flex justify-center items-center overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="bg-zinc-900 text-white p-6 rounded shadow-lg w-[90%] max-w-md"
            >
                <h2 className="text-xl font-bold text-orange-500 border-b border-zinc-700 pb-2 mb-4">
                    新增訓練紀錄
                </h2>

                <form onSubmit={handleSubmit}>
                    {exercises.map((exercise, index) => {
                        const isExpanded = expandedIndex === index;
                        const currentOptions = exercise.part && exercise.part in partOptions ? partOptions[exercise.part as PartKey] : [];
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="mb-3 border border-zinc-700 rounded">
                                <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left flex justify-between items-center bg-zinc-800 hover:bg-zinc-700 rounded-t"
                                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                >
                                    <span>
                                        訓練 #{index + 1}：
                                        {exercise.type ? ` ${exercise.type}（${exercise.weight}kg x ${exercise.sets}組 x ${exercise.reps}下）` : " 尚未填寫"}
                                    </span>
                                    {exercises.length > 1 && (
                                        <span className="text-red-400 text-sm" onClick={(e) => { e.stopPropagation(); removeExercise(index); }}>
                                            刪除
                                        </span>
                                    )}
                                </button>
                                {isExpanded && (
                                    <div className="px-3 py-2 space-y-2">
                                        <select
                                            value={exercise.part}
                                            onChange={(e) => handleChange(index, "part", e.target.value as Exercise["part"])}
                                            className="w-full px-3 py-2 rounded border border-orange-500 bg-black text-white"
                                        >
                                            <option value="">請選擇部位</option>
                                            {Object.keys(partOptions).map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={exercise.type}
                                            onChange={(e) => handleChange(index, "type", e.target.value)}
                                            disabled={!exercise.part}
                                            className="w-full px-3 py-2 rounded border border-orange-500 bg-black text-white"
                                        >
                                            <option value="">請選擇項目</option>
                                            {currentOptions.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>

                                        <input type="number" min="1" value={exercise.weight} onChange={(e) => handleChange(index, "weight", e.target.value)} placeholder="重量（kg）" className="w-full px-3 py-2 rounded border border-orange-500 bg-black text-white placeholder:text-zinc-500" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="number" min="1" value={exercise.sets} onChange={(e) => handleChange(index, "sets", e.target.value)} placeholder="組數" className="w-full px-3 py-2 rounded border border-orange-500 bg-black text-white placeholder:text-zinc-500" />
                                            <input type="number" min="1" value={exercise.reps} onChange={(e) => handleChange(index, "reps", e.target.value)} placeholder="次數" className="w-full px-3 py-2 rounded border border-orange-500 bg-black text-white placeholder:text-zinc-500" />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}

                    <button type="button" onClick={addExercise} className="w-full mb-4 px-3 py-2 text-sm border border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white rounded">
                        + 新增訓練項目
                    </button>

                    <div className="mb-4">
                        <label className="block text-sm mb-1">訓練日期</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today} className="w-full px-3 py-2 rounded border border-orange-500 bg-black text-white" />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded">取消</button>
                        <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded">儲存</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
