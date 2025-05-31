"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./MobileMenu.module.css";

type Props = {
    onAddWorkout?: () => void;
    onAddMetric?: () => void;
    onLogout?: () => void;
    onLogin?: () => void;
    onRegister?: () => void;
    user?: { displayName: string | null };
    closeMenu: () => void;
    menuOpen: boolean;
    isVisible: boolean;
    className?: string;
};

type MenuItem = {
    label: string;
    onClick?: () => void;
    link?: string;
    delay: number;
    variant?: "solid" | "outline" | "yellow" | "orange";
};

export default function MobileMenu({
    onAddWorkout,
    onAddMetric,
    onLogout,
    onLogin,
    onRegister,
    user,
    closeMenu,
    menuOpen,
    className = "",
}: Props) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        if (menuOpen) {
            setIsVisible(true);
            setIsLeaving(false);
        } else {
            setIsLeaving(true);
            setTimeout(() => {
                setIsVisible(false);
                setIsLeaving(false);
            }, 600);
        }
    }, [menuOpen]);

    const items: MenuItem[] = user
        ? [
            { label: "團體課程", link: "/group-classes", delay: 0, variant: "orange" },
            { label: "訓練記錄", onClick: onAddWorkout, delay: 100 },
            { label: "數值記錄", onClick: onAddMetric, delay: 200, variant: "yellow" },
            { label: user.displayName || "訪客", link: "/member", delay: 300 },
            { label: "登出", onClick: onLogout, delay: 400 },
        ]
        : [
            { label: "登入", onClick: onLogin, delay: 0, variant: "outline" },
            { label: "註冊", onClick: onRegister, delay: 100, variant: "solid" },
        ];

    return (
        <div
            className={`absolute top-full left-0 w-full bg-zinc-900 bg-opacity-95 z-40 px-6 py-4 shadow-md transition-all duration-300 ${className}`}
        >
            {isVisible && (
                <div className="flex flex-col items-center gap-3">
                    {items.map((item, index) => {
                        const style = {
                            animationDelay: `${item.delay}ms`,
                        } as React.CSSProperties;

                        const animationClass = isLeaving
                            ? styles["menu-item-leave"]
                            : styles["menu-item"];

                        const isYellow = item.variant === "yellow";
                        const isOutline = item.variant === "outline";
                        const isOrange = item.variant === "orange";

                        const buttonClass = `${animationClass} w-full max-w-[200px] px-4 py-2 rounded text-sm font-medium ${isYellow
                            ? "bg-yellow-500 text-white hover:bg-yellow-600"
                            : isOutline
                                ? "border border-orange-400 text-orange-400 bg-transparent hover:bg-orange-500 hover:text-white"
                                : isOrange
                                    ? "bg-orange-400 text-white hover:bg-orange-500"
                                    : "bg-orange-500 text-white hover:bg-orange-600"
                            }`;

                        return item.link ? (
                            <Link
                                href={item.link}
                                key={index}
                                onClick={closeMenu}
                                style={style}
                                className={// 使用者名稱樣式（純文字 Link）
                                    item.label === (user?.displayName || "訪客")
                                        ? `${animationClass} w-full max-w-[200px] text-white text-center hover:underline`
                                        // 其他 Link 例如課程表 → 使用按鈕樣式
                                        : `${animationClass} w-full max-w-[200px] px-4 py-2 rounded text-sm font-medium text-center ${isYellow
                                            ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                            : isOutline
                                                ? "border border-orange-400 text-orange-400 bg-transparent hover:bg-orange-500 hover:text-white"
                                                : isOrange
                                                    ? "bg-orange-400 text-white hover:bg-orange-500"
                                                    : "bg-orange-500 text-white hover:bg-orange-600"
                                        }`}
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <button
                                key={index}
                                onClick={() => {
                                    item.onClick?.();
                                    closeMenu();
                                }}
                                style={style}
                                className={buttonClass}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}