"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Component } from "react";

type Props = {
    type: "slim" | "normal" | "overweight"
};


const shapeInfo = {
    slim: {
        label: "精壯",
        svg: "/shape-strong.svg",
        color: "text-orange-500",
        desc: "目前精壯，請注意營養均衡。",
    },
    normal: {
        label: "標準",
        svg: "/shape-normal.svg",
        color: "text-green-400",
        desc: "目前體態標準，請持續保持！",
    },
    overweight: {
        label: "偏高",
        svg: "/shape-overweight.svg",
        color: "text-red-400",
        desc: "體脂偏高，建議規律運動與飲食控制。",
    },
};

export default function BodyShape({ type }: Props) {
    const shape = shapeInfo[type];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mt-6"
        >
            <Image
                src={shape.svg}
                alt={shape.label}
                width={160}
                height={160}
                className="mx-auto"
                priority />
            <h3 className={`text-xl font-bold mt-4 ${shape.color}`}>{shape.label}</h3>
            <p className="text-zinc-300 mt-1 text-sm">{shape.desc}</p>
        </motion.div>
    );
}
