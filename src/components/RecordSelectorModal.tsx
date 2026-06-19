"use client";

import { Dumbbell, Plus, Ruler } from "lucide-react";
import ModalShell from "./ModalShell";

type Props = {
    onClose: () => void;
    onSelectWorkout?: () => void;
    onSelectMetric?: () => void;
};

export default function RecordSelectorModal({ onClose, onSelectWorkout, onSelectMetric }: Props) {
    return (
        <ModalShell open onClose={onClose} title="新增一筆紀錄" description="選擇這次要記錄的內容" icon={<Plus className="h-5 w-5" />} titleId="record-selector-title" maxWidth="sm">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => {
                            onSelectWorkout?.();
                            onClose();
                        }}
                        className="flex h-32 flex-col items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-400/10 transition hover:-translate-y-0.5 hover:border-orange-400/40 hover:bg-orange-400/15"
                    >
                        <Dumbbell className="w-8 h-8 text-white mb-2" />
                        <span className="text-white font-semibold">訓練記錄</span>
                    </button>
                    <button
                        onClick={() => {
                            onSelectMetric?.();
                            onClose();
                        }}
                        className="flex h-32 flex-col items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-white transition hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-amber-400/15"
                    >
                        <Ruler className="w-8 h-8 text-white mb-2" />
                        <span className="font-semibold">數值記錄</span>
                    </button>
                </div>
                <div className="mt-4 text-center">
                    <button
                        onClick={onClose}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-300 transition hover:bg-white/10 hover:text-white"
                    >
                        取消
                    </button>
                </div>
        </ModalShell>
    );
}
