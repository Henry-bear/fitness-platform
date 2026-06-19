"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type AmbientVariant = "overview" | "trends" | "tdee" | "classes" | "experience";

type Props = {
    variant: AmbientVariant;
};

const palettes: Record<AmbientVariant, string> = {
    overview:
        "bg-[radial-gradient(circle_at_14%_10%,rgba(249,115,22,0.20),transparent_30%),radial-gradient(circle_at_86%_42%,rgba(251,146,60,0.08),transparent_34%),linear-gradient(180deg,#0b0b0d_0%,#050506_100%)]",
    trends:
        "bg-[radial-gradient(circle_at_82%_12%,rgba(249,115,22,0.18),transparent_28%),radial-gradient(circle_at_20%_62%,rgba(194,65,12,0.12),transparent_36%),linear-gradient(160deg,#08090c_0%,#0d0907_48%,#040405_100%)]",
    tdee:
        "bg-[radial-gradient(circle_at_50%_18%,rgba(249,115,22,0.22),transparent_28%),radial-gradient(circle_at_82%_70%,rgba(234,88,12,0.10),transparent_34%),linear-gradient(165deg,#08090c_0%,#100a07_52%,#040405_100%)]",
    classes:
        "bg-[radial-gradient(ellipse_at_12%_28%,rgba(249,115,22,0.17),transparent_32%),radial-gradient(ellipse_at_88%_68%,rgba(194,65,12,0.13),transparent_36%),linear-gradient(145deg,#07080b_0%,#0d0907_52%,#040405_100%)]",
    experience:
        "bg-[radial-gradient(circle_at_72%_28%,rgba(249,115,22,0.26),transparent_28%),linear-gradient(90deg,rgba(4,4,5,0.88)_0%,rgba(4,4,5,0.48)_55%,rgba(4,4,5,0.72)_100%)]",
};

export default function AmbientBackground({ variant }: Props) {
    const reduceMotion = useReducedMotion();

    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <AnimatePresence mode="sync" initial={false}>
                <motion.div
                    key={variant}
                    className={`absolute inset-0 ${palettes[variant]}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.7, ease: "easeInOut" }}
                />
            </AnimatePresence>

            <motion.div
                className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl sm:h-96 sm:w-96"
                animate={reduceMotion ? undefined : {
                    x: [0, 54, 12, 0],
                    y: [0, -24, 42, 0],
                    scale: [1, 1.12, 0.96, 1],
                    opacity: [0.45, 0.7, 0.5, 0.45],
                }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute -right-28 top-[38%] h-80 w-80 rounded-full bg-amber-500/[0.07] blur-3xl sm:h-[28rem] sm:w-[28rem]"
                animate={reduceMotion ? undefined : {
                    x: [0, -48, -8, 0],
                    y: [0, 46, -20, 0],
                    scale: [1, 0.94, 1.1, 1],
                    opacity: [0.4, 0.62, 0.48, 0.4],
                }}
                transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
            />

            {variant !== "experience" && (
                <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
            )}
        </div>
    );
}
