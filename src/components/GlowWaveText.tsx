"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Props = {
    text: string;
    className?: string;
    colorMode?: "white" | "orange";
};

export default function GlowWaveText({ text, className = "", colorMode = "white" }: Props) {
    const [highlightIndex, setHighlightIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setHighlightIndex((prev) => (prev + 1) % text.length);
        }, 420);
        return () => clearInterval(interval);
    }, [text.length]);

    return (
        <p className={`flex flex-wrap justify-center font-semibold tracking-wide ${className}`}>
            {text.split("").map((char, i) => {
                const distance = Math.abs(i - highlightIndex);
                const scale = Math.max(1 - distance * 0.1, 0.9);
                const opacity = Math.max(1 - distance * 0.2, 0.4);

                const color =
                    colorMode === "orange"
                        ? `rgba(255,153,0,${opacity})`
                        : `rgba(255,255,255,${opacity})`;

                return (
                    <motion.span
                        key={i}
                        className="transition-all duration-500 ease-in-out"
                        style={{
                            color,
                            transform: `scale(${scale})`,
                        }}
                    >
                        {char}
                    </motion.span>
                );
            })}
        </p>
    );
}