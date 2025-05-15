"use client";
import { motion } from "framer-motion";

type Props = {
    label: string;
    value: number;
    unit: string;
    percent: number;
    color: string;
};

export default function ProgressRow({ label, value, unit, percent, color }: Props) {
    return (
        <div>
            <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-white font-semibold">
                    {value} {unit}
                </span>
            </div>
            <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percent, 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className={`h-full ${color} rounded-full`}
                />
            </div>
        </div>
    );
}