"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import MobileMenu from "./MobileMenu";
import { Menu } from "lucide-react";
import RecordSelectorModal from "./RecordSelectorModal";


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
    const [isVisible, setIsVisible] = useState(false);
    const [animationClass, setAnimationClass] = useState("");
    const [showRecordSelector, setShowRecordSelector] = useState(false);

    const toggleMenu = () => {
        if (menuOpen) {
            setAnimationClass("animate-slide-up");
            setTimeout(() => {
                setMenuOpen(false);
                setIsVisible(false);
            }, 400); // 動畫結束
        } else {
            setMenuOpen(true);
            setAnimationClass("animate-slide-down");
            setTimeout(() => setIsVisible(true), 100); // 等 menu 滑出再淡入按鈕
        }
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
                <div className="w-full px-4 py-4 bg-zinc-900 flex justify-between items-center">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="text-3xl font-bold text-orange-400 cursor-pointer hover:opacity-80 transition"
                    >
                        FitnessWay
                    </Link>

                    {/* 桌機版功能區 */}
                    <div className="hidden sm:flex items-center gap-4">
                        {authLoading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-orange-400 text-sm">載入中</span>
                            </div>
                        ) : user ? (
                            <>
                                <Link
                                    href="/experience"
                                    className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500 transition font-bold"

                                >
                                    體驗教練課程
                                </Link>

                                <Link
                                    href="/group-classes"
                                    className="px-4 py-2 bg-orange-400 text-white rounded hover:bg-orange-500 transition"
                                >
                                    團體課程
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
                                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 cursor-pointer"
                                >
                                    記錄＋
                                </button>

                                <Link
                                    href="/member"
                                    className="text-white font-medium hover:underline"
                                >
                                    {user.displayName || "訪客"}
                                </Link>

                                {(role === "admin" || role === "groupCoach" || role === "personalTrainer") && (
                                    <Link
                                        href="/dashboard"
                                        className="px-4 py-2 bg-black text-orange-400 border border-orange-400 rounded hover:bg-orange-500 hover:text-white transition"
                                    >
                                        後台管理
                                    </Link>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded cursor-pointer"
                                >
                                    登出
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onLogin}
                                    className="px-4 py-2 border border-orange-400 text-orange-400 hover:bg-orange-500 hover:text-white rounded transition cursor-pointer"
                                >
                                    登入
                                </button>
                                <button
                                    onClick={onRegister}
                                    className="px-4 py-2 border border-transparent bg-orange-500 text-white rounded hover:bg-orange-600 transition cursor-pointer"
                                >
                                    註冊
                                </button>
                            </>
                        )}
                    </div>

                    {/* 手機版 Burger Menu */}
                    <div className="sm:hidden">
                        {!authLoading && (
                            <button
                                onClick={toggleMenu}
                                className="w-12 h-12 flex items-center justify-center text-white transition-transform duration-300 hover:scale-110"
                            >
                                <Menu size={32} />
                            </button>
                        )}
                    </div>

                </div>

                {/* MobileMenu 選單浮動顯示 */}
                {menuOpen && !authLoading && (
                    <MobileMenu
                        className={`transition-all duration-300 ${animationClass}`}
                        onAddWorkout={onAddWorkout}
                        onAddMetric={onAddMetric}
                        onLogout={handleLogout}
                        onLogin={onLogin}
                        onRegister={onRegister}
                        user={user}
                        closeMenu={toggleMenu}
                        isVisible={isVisible}
                        menuOpen={menuOpen}
                    />
                )}
            </div>
        </>
    );
}
