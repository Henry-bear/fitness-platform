"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import LoginModal from "@/components/LoginModal";
import RegisterModal from "@/components/RegisterModal";
import WorkoutForm from "@/components/WorkoutForm";
import BodyMetricModal from "@/components/BodyMetricModal";
import BodyMetricChart from "@/components/BodyMetricChart";
import LatestBodyMetric from "@/components/LatestBodyMetric";
import { useCustomClaimRole } from "../hooks/useCustomClaimRole";
import BookingBell from "@/components/BookingBell";
import { AnimatePresence, motion } from "framer-motion";
import AmbientBackground from "@/components/AmbientBackground";
import { useAuth } from "@/components/AuthProvider";
import AuthStateScreen from "@/components/AuthStateScreen";
import MemberHero from "@/components/MemberHero";


const motivationalQuotes = [
    "堅持不懈，會讓你看到意想不到的成長。",
    "今天的努力，是明天的進步。",
    "每一次訓練，都是邁向更強的自己。",
    "別急，改變是日積月累的結果。",
    "流的汗不會背叛你。",
    "沒有極限，只有挑戰。",
    "持續記錄，持續進步。",
];

export default function MemberPage() {
    const { user, loading: authLoading, error: authError, retry: retryAuth } = useAuth();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [showMetricModal, setShowMetricModal] = useState(false);
    const [quote, setQuote] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(Date.now());
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<"overview" | "trends">("overview");
    const router = useRouter();

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        setQuote(motivationalQuotes[randomIndex])
    }, []);

    useEffect(() => {
        if (!authLoading && !authError && !user) router.replace("/");
    }, [authError, authLoading, router, user]);


    const handleRefresh = () => {
        setRefreshTrigger(Date.now());
    };

    if (authLoading || roleLoading) return <AuthStateScreen />;
    if (authError) return <AuthStateScreen error={authError} onRetry={retryAuth} />;
    if (!user) return <AuthStateScreen message="正在返回首頁..." />;

    return (
        <>
            {/* 全頁 Modal */}
            {showLogin && (
                <LoginModal
                    onClose={() => setShowLogin(false)}
                    openRegister={() => {
                        setShowLogin(false);      // 先關閉登入
                        setShowRegister(true);    // 再開啟註冊
                    }}
                />
            )}
            {showRegister && (
                <RegisterModal
                    onClose={() => setShowRegister(false)}
                    openLogin={() => {
                        setShowRegister(false);     // 先關閉註冊
                        setShowLogin(true);         // 再開啟登入
                    }}
                />
            )}
            {showWorkoutModal && user && (
                <WorkoutForm user={user} onClose={() => setShowWorkoutModal(false)} onSaved={handleRefresh} />
            )}
            {showMetricModal && user?.uid && (
                <BodyMetricModal userId={user.uid} onClose={() => setShowMetricModal(false)} onSaved={handleRefresh} />
            )}
            {/* 共用導覽列 */}
            <Navbar
                onLogin={() => setShowLogin(true)}
                onRegister={() => setShowRegister(true)}
                onAddMetric={() => setShowMetricModal(true)}
                onAddWorkout={() => setShowWorkoutModal(true)}
                user={user ? { displayName: user.displayName } : undefined}
                authLoading={authLoading}
                role={role}
                roleLoading={roleLoading}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
            />
            <main className="relative isolate min-h-screen overflow-hidden bg-[#07090d] px-4 pb-20 pt-16 text-center text-white">
                <AmbientBackground variant={activeSection} />

                <div className="relative z-10 mx-auto w-full max-w-6xl">
                    <MemberHero name={user.displayName || "會員"} quote={quote} />

                    <div
                        className="mx-auto mb-8 grid w-full max-w-md grid-cols-2 rounded-xl border border-white/10 bg-zinc-950/65 p-1.5 shadow-lg shadow-black/30 backdrop-blur-md"
                        role="tablist"
                        aria-label="會員數據檢視"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeSection === "overview"}
                            onClick={() => setActiveSection("overview")}
                            className={`relative rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${activeSection === "overview"
                                ? "bg-orange-500 text-white shadow-md shadow-orange-950/40"
                                : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            身體儀表板
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeSection === "trends"}
                            onClick={() => setActiveSection("trends")}
                            className={`relative rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${activeSection === "trends"
                                ? "bg-orange-500 text-white shadow-md shadow-orange-950/40"
                                : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            變化趨勢
                        </button>
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                        {user && activeSection === "overview" ? (
                            <motion.section
                                key="overview"
                                role="tabpanel"
                                aria-label="身體儀表板"
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 12 }}
                                transition={{ duration: 0.22 }}
                            >
                                <LatestBodyMetric userId={user.uid} user={user} refreshTrigger={refreshTrigger} />
                            </motion.section>
                        ) : user ? (
                            <motion.section
                                key="trends"
                                role="tabpanel"
                                aria-label="身體數值變化趨勢"
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.22 }}
                            >
                                <BodyMetricChart userId={user.uid} refreshTrigger={refreshTrigger} />
                            </motion.section>
                        ) : null}
                    </AnimatePresence>
                </div>
                {!menuOpen && user && (
                    <div className="fixed bottom-4 right-4 z-50">
                        <BookingBell user={user} />
                    </div>)
                }
            </main>
        </>
    );
}
