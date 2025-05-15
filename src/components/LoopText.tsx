"use client";
import { motion } from "framer-motion";

type Props = {
    text: string;
    className?: string;
};

export default function LoopText({ text, className }: Props) {
    return (
        <motion.p
            className={className}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }} // 先淡入，停留，再淡出
            transition={{
                duration: 4, // 總共 4 秒一輪
                repeat: Infinity, // 無限循環
                ease: "easeInOut",
                repeatDelay: 1.5,
            }}
        >
            {text}
        </motion.p>
    );
}