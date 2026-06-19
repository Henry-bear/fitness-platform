"use client";

import Link from "next/link";
import { useState } from "react";
import RecordSelectorModal from "./RecordSelectorModal";
import { motion } from "framer-motion";

type Props = {
    onAddWorkout?: () => void;
    onAddMetric?: () => void;
    onLogout?: () => void;
    onLogin?: () => void;
    onRegister?: () => void;
    user?: { displayName: string | null };
    role?: string | null;
    closeMenu: () => void;
};

type MenuItem = {
    label: string;
    onClick?: () => void;
    link?: string;
    variant?: "solid" | "outline" | "yellow" | "orange" | "indigo" | "dashboard";
};

const menuVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.22, staggerChildren: 0.06 },
    },
    exit: {
        opacity: 0,
        y: -6,
        scale: 0.98,
        transition: { duration: 0.18, staggerChildren: 0.03, staggerDirection: -1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
};

export default function MobileMenu({
    onAddWorkout,
    onAddMetric,
    onLogout,
    onLogin,
    onRegister,
    user,
    role,
    closeMenu,
}: Props) {
    const [showRecordModal, setShowRecordModal] = useState(false);

    let items: MenuItem[] = [];

    if (user) {
        items = [
            { label: "體驗教練課程", link: "/experience", variant: "yellow" },
            { label: "團體課程", link: "/group-classes", variant: "orange" },
            { label: "TDEE計算", link: "/tdee", variant: "indigo" },
            { label: "記錄+", onClick: () => setShowRecordModal(true) },
            { label: user.displayName || "訪客", link: "/member" },
        ];

        // admin / groupCoach / personalTrainer 才加入後台選單
        if (role === "admin" || role === "groupCoach" || role === "personalTrainer") {
            items.push({
                label: "後台管理",
                link: "/dashboard",
                variant: "dashboard",
            });
        }

        items.push({ label: "登出", onClick: onLogout });
    } else {
        items = [
            { label: "登入", onClick: onLogin, variant: "outline" },
            { label: "註冊", onClick: onRegister, variant: "solid" },
        ];
    }

    return (
        <>
            <motion.nav
                id="mobile-menu"
                aria-label="手機版主選單"
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-3 top-[calc(100%+0.5rem)] z-40 w-[min(19rem,calc(100vw-1.5rem))] origin-top-right rounded-2xl border border-white/10 bg-zinc-950/88 p-3 shadow-2xl shadow-black/55 backdrop-blur-xl"
            >
                <div className="flex flex-col items-stretch gap-1.5">
                    {items.map((item) => {
                            const isYellow = item.variant === "yellow";
                            const isOutline = item.variant === "outline";
                            const isOrange = item.variant === "orange";
                            const isIndigo = item.variant === "indigo";
                            const isDashboard = item.variant === "dashboard";

                            const itemClass = `w-full rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition ${isYellow
                                ? "border-amber-400/20 bg-amber-400/[0.07] text-amber-300 hover:border-amber-400/40 hover:bg-amber-400/[0.12]"
                                : isOutline
                                    ? "border-white/10 bg-white/[0.04] text-zinc-200 hover:border-orange-500/40 hover:text-orange-300"
                                    : isOrange
                                        ? "border-orange-400/20 bg-orange-400/[0.07] text-orange-300 hover:border-orange-400/40 hover:bg-orange-400/[0.12]"
                                        : isIndigo
                                            ? "border-sky-400/20 bg-sky-400/[0.07] text-sky-300 hover:border-sky-400/40 hover:bg-sky-400/[0.12]"
                                            : isDashboard
                                                ? "border-zinc-600 bg-zinc-900/70 text-zinc-200 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-300"
                                                : "border-orange-500 bg-orange-500 text-white hover:bg-orange-400"
                                }`;

                            const buttonClass = item.label === "登出"
                                ? "mt-1 w-full rounded-xl border border-red-400/15 bg-red-400/[0.05] px-4 py-2.5 text-left text-sm font-medium text-red-300 transition hover:border-red-400/30 hover:bg-red-400/10"
                                : itemClass;

                        return <motion.div key={item.label} variants={itemVariants} className="flex w-full">
                            {item.link ? (
                                <Link
                                    href={item.link}
                                    onClick={closeMenu}
                                    className={
                                        item.label === (user?.displayName || "訪客")
                                            ? "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                                            : itemClass
                                    }

                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <button
                                    onClick={() => {
                                        item.onClick?.();
                                        if (item.label !== "記錄+") {
                                            closeMenu();
                                        }
                                    }}
                                    className={buttonClass}
                                >
                                    {item.label}
                                </button>
                            )}
                        </motion.div>;
                    })}
                </div>
            </motion.nav>

            {showRecordModal && (
                <RecordSelectorModal
                    onClose={() => setShowRecordModal(false)}
                    onSelectWorkout={onAddWorkout}
                    onSelectMetric={onAddMetric}
                />
            )}
        </>
    );
}
