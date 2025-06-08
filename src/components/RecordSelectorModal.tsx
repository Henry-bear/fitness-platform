"use client";

import { motion } from "framer-motion";
import { Dumbbell, Ruler } from "lucide-react";

type Props = {
    onClose: () => void;
    onSelectWorkout?: () => void;
    onSelectMetric?: () => void;
};

export default function RecordSelectorModal({ onClose, onSelectWorkout, onSelectMetric }: Props) {
    return (
        <div className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="bg-transparent w-[90%] max-w-sm text-white"
            >
                <h2 className="text-xl font-bold text-orange-400 mb-6 text-center">選擇項目</h2>
                <div className="flex justify-center gap-4 mb-6">
                    <button
                        onClick={() => {
                            onSelectWorkout?.();
                            onClose();
                        }}
                        className="flex flex-col items-center justify-center w-36 h-32 bg-orange-500 hover:bg-orange-600 rounded-2xl shadow transition"
                    >
                        <Dumbbell className="w-8 h-8 text-white mb-2" />
                        <span className="text-white font-semibold">訓練記錄</span>
                    </button>
                    <button
                        onClick={() => {
                            onSelectMetric?.();
                            onClose();
                        }}
                        className="flex flex-col items-center justify-center w-36 h-32 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl shadow transition"
                    >
                        <Ruler className="w-8 h-8 text-white mb-2" />
                        <span className="font-semibold">數值記錄</span>
                    </button>
                </div>
                <div className="text-center">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded"
                    >
                        取消
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
