"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Activity, Dumbbell, Flame, TrendingUp } from "lucide-react";

export default function MemberHero({ name, quote }: { name: string; quote: string }) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative mb-7 overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 px-6 py-8 text-left shadow-2xl shadow-black/35 backdrop-blur-xl sm:px-9 sm:py-10"
        >
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_right,black,transparent_78%)]" />
            <motion.div
                aria-hidden="true"
                animate={reduceMotion ? undefined : { x: [0, 70, 0], y: [0, -22, 0], opacity: [0.22, 0.42, 0.22] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-24 top-4 h-64 w-64 rounded-full bg-orange-500/30 blur-[90px]"
            />
            <motion.div
                aria-hidden="true"
                animate={reduceMotion ? undefined : { x: [0, -35, 0], scale: [1, 1.12, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-16 bottom-0 h-52 w-52 rounded-full bg-amber-300/10 blur-[80px]"
            />

            <div className="relative z-10 grid items-center gap-8 md:grid-cols-[1fr_18rem]">
                <div>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }} className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/[0.08] px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-orange-300">
                        <Activity className="h-3.5 w-3.5" /> MEMBER PERFORMANCE
                    </motion.div>
                    <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
                        {name}，今天也讓自己
                        <span className="block bg-gradient-to-r from-orange-300 via-orange-500 to-amber-300 bg-clip-text text-transparent">再進步一點。</span>
                    </h1>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">{quote}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                        {[
                            { icon: Dumbbell, label: "持續訓練" },
                            { icon: TrendingUp, label: "追蹤變化" },
                            { icon: Flame, label: "累積狀態" },
                        ].map((item, index) => (
                            <motion.span key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.08 }} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300">
                                <item.icon className="h-3.5 w-3.5 text-orange-400" />{item.label}
                            </motion.span>
                        ))}
                    </div>
                </div>

                <div className="relative mx-auto flex h-44 w-44 items-center justify-center md:h-52 md:w-52">
                    <motion.div aria-hidden="true" animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border border-dashed border-orange-400/25">
                        <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-orange-400 shadow-[0_0_18px_rgba(251,146,60,0.9)]" />
                    </motion.div>
                    <motion.div aria-hidden="true" animate={reduceMotion ? undefined : { rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="absolute inset-5 rounded-full border border-orange-400/15 border-l-orange-400/60 border-r-amber-300/40" />
                    <motion.div animate={reduceMotion ? undefined : { scale: [1, 1.06, 1], boxShadow: ["0 0 20px rgba(249,115,22,.12)", "0 0 42px rgba(249,115,22,.28)", "0 0 20px rgba(249,115,22,.12)"] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} className="flex h-24 w-24 flex-col items-center justify-center rounded-full border border-orange-400/25 bg-orange-500/10 text-center backdrop-blur-md md:h-28 md:w-28">
                        <Dumbbell className="h-6 w-6 text-orange-400 md:h-7 md:w-7" />
                        <span className="mt-2 text-[9px] font-bold tracking-[0.14em] text-orange-200 md:text-[10px] md:tracking-[0.18em]">KEEP MOVING</span>
                    </motion.div>
                    <div className="absolute bottom-1 flex h-8 items-end gap-1" aria-hidden="true">
                        {[12, 22, 16, 29, 19, 25, 13].map((height, index) => (
                            <motion.span key={`${height}-${index}`} animate={reduceMotion ? undefined : { height: [height, Math.max(8, 32 - height), height] }} transition={{ duration: 1.2 + index * 0.08, repeat: Infinity, ease: "easeInOut" }} className="block w-1 rounded-full bg-gradient-to-t from-orange-600 to-amber-300" style={{ height }} />
                        ))}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
