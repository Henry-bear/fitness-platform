"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import MobileMenu from "./MobileMenu";
import RecordSelectorModal from "./RecordSelectorModal";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Calculator, LayoutDashboard, LogIn, LogOut, Plus, Sparkles, UserPlus, UserRound } from "lucide-react";


type Props = {
    onLogin?: () => void;
    onRegister?: () => void;
    onLogout?: () => void;
    onAddMetric?: () => void;
    onAddWorkout?: () => void;
    user?: { displayName: string | null };
    setUser?: (user: null) => void;
    authLoading?: boolean;
    className?: string;
    role?: string | null;
    roleLoading?: boolean;
    menuOpen: boolean;
    setMenuOpen: (open: boolean) => void;
};

export default function Navbar({
    onLogin,
    onRegister,
    onAddWorkout,
    onAddMetric,
    user,
    setUser,
    authLoading,
    role,
    menuOpen,
    setMenuOpen
}: Props) {
    const router = useRouter();
    const [showRecordSelector, setShowRecordSelector] = useState(false);
    const roleLabel = role === "admin" ? "管理員" : role === "groupCoach" ? "團課教練" : role === "personalTrainer" ? "私人教練" : "會員";

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const handleLogout = async () => {
        await signOut(auth);
        if (setUser) setUser(null);
        toast.success("您已成功登出！", { duration: 2000 });
        router.push("/");
    };

    return (
        <>
            <div className="relative z-50">
                <div className="flex w-full items-center justify-between border-b border-white/[0.06] bg-zinc-950/92 px-4 py-3 backdrop-blur-xl">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="text-3xl font-bold text-orange-400 cursor-pointer hover:opacity-80 transition"
                    >
                        FitnessWay
                    </Link>

                    {/* 桌機版功能區 */}
                    <div className="hidden items-center gap-2 sm:flex">
                        {authLoading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-orange-400 text-sm">載入中</span>
                            </div>
                        ) : user ? (
                            <>
                                <Link
                                    href="/experience"
                                    className="flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2 text-sm font-semibold text-amber-300 transition hover:border-amber-400/40 hover:bg-amber-400/[0.12]"

                                >
                                    <Sparkles className="h-4 w-4" />體驗課程
                                </Link>

                                <Link
                                    href="/group-classes"
                                    className="flex items-center gap-1.5 rounded-lg border border-orange-400/20 bg-orange-400/[0.07] px-3 py-2 text-sm font-semibold text-orange-300 transition hover:border-orange-400/40 hover:bg-orange-400/[0.12]"
                                >
                                    <CalendarDays className="h-4 w-4" />團體課程
                                </Link>
                                <Link
                                    href="/tdee"
                                    className="flex items-center gap-1.5 rounded-lg border border-sky-400/20 bg-sky-400/[0.07] px-3 py-2 text-sm font-semibold text-sky-300 transition hover:border-sky-400/40 hover:bg-sky-400/[0.12]"
                                >
                                    <Calculator className="h-4 w-4" />TDEE
                                </Link>
                                {showRecordSelector && (
                                    <RecordSelectorModal
                                        onClose={() => setShowRecordSelector(false)}
                                        onSelectWorkout={onAddWorkout}
                                        onSelectMetric={onAddMetric}
                                    />
                                )}

                                <button
                                    onClick={() => setShowRecordSelector(true)}
                                    className="flex items-center gap-1.5 rounded-lg border border-orange-400/20 bg-orange-400/[0.07] px-3 py-2 text-sm font-semibold text-orange-300 transition hover:border-orange-400/40 hover:bg-orange-400/[0.12]"
                                >
                                    <Plus className="h-4 w-4" />記錄
                                </button>

                                <Link
                                    href="/member"
                                    className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3 transition hover:border-white/20 hover:bg-white/[0.08]"
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/15 text-orange-400 transition group-hover:bg-orange-500/25"><UserRound className="h-4 w-4" /></span>
                                    <span className="flex flex-col text-left leading-tight">
                                        <span className="max-w-24 truncate text-sm font-medium text-white">{user.displayName || "訪客"}</span>
                                        <span className="text-[10px] font-medium tracking-wide text-zinc-500">{roleLabel}</span>
                                    </span>
                                </Link>

                                {(role === "admin" || role === "groupCoach" || role === "personalTrainer") && (
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-950/70 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-orange-500/60 hover:bg-orange-500/10 hover:text-orange-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.12)]"
                                    >
                                        <LayoutDashboard className="h-4 w-4" />後台管理
                                    </Link>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 rounded-lg border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-sm font-medium text-red-300 transition hover:border-red-400/30 hover:bg-red-400/10"
                                >
                                    <LogOut className="h-4 w-4" />登出
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onLogin}
                                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-orange-500/40 hover:text-orange-300"
                                >
                                    <LogIn className="h-4 w-4" />登入
                                </button>
                                <button
                                    onClick={onRegister}
                                    className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-400"
                                >
                                    <UserPlus className="h-4 w-4" />註冊
                                </button>
                            </>
                        )}
                    </div>

                    {/* 手機版 Burger Menu */}
                    <div className="sm:hidden">
                        {!authLoading && (
                            <button
                                onClick={toggleMenu}
                                className={`flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full border transition ${menuOpen ? "border-orange-400/50 bg-orange-500/12 text-orange-300 shadow-lg shadow-orange-950/30" : "border-white/10 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08]"}`}
                                aria-label={menuOpen ? "關閉主選單" : "開啟主選單"}
                                aria-expanded={menuOpen}
                                aria-controls="mobile-menu"
                            >
                                <motion.span
                                    className="block h-0.5 w-7 rounded-full bg-current"
                                    animate={menuOpen ? { y: 7, rotate: 45 } : { y: 0, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                                />
                                <motion.span
                                    className="block h-0.5 w-7 rounded-full bg-current"
                                    animate={menuOpen ? { opacity: 0, scaleX: 0.3 } : { opacity: 1, scaleX: 1 }}
                                    transition={{ duration: 0.16 }}
                                />
                                <motion.span
                                    className="block h-0.5 w-7 rounded-full bg-current"
                                    animate={menuOpen ? { y: -7, rotate: -45 } : { y: 0, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                                />
                            </button>
                        )}
                    </div>

                </div>

                {/* MobileMenu 選單浮動顯示 */}
                <AnimatePresence>
                    {menuOpen && !authLoading && (
                        <MobileMenu
                            onAddWorkout={onAddWorkout}
                            onAddMetric={onAddMetric}
                            onLogout={handleLogout}
                            onLogin={onLogin}
                            onRegister={onRegister}
                            user={user}
                            role={role}
                            closeMenu={() => setMenuOpen(false)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
