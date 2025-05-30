"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import LoginModal from "@/components/LoginModal";
import RegisterModal from "@/components/RegisterModal";
import WorkoutForm from "@/components/WorkoutForm";
import BodyMetricModal from "@/components/BodyMetricModal";
import BodyMetricChart from "@/components/BodyMetricChart";
import GlowWaveText from "@/components/GlowWaveText";
import LatestBodyMetric from "@/components/LatestBodyMetric";
import { useCustomClaimRole } from "../../hooks/useCustomClaimRole";
import BookingBell from "@/components/BookingBell";

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
    const [user, setUser] = useState<User | null>(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [showMetricModal, setShowMetricModal] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [quote, setQuote] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(Date.now());
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setAuthLoading(false);
            } else {
                router.push("/"); // 未登入導向首頁
            }

        });
        // quote
        const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        setQuote(motivationalQuotes[randomIndex])

        return () => unsubscribe();
    }, [router]);


    const handleRefresh = () => {
        setRefreshTrigger(Date.now());
    };

    return (
        <>
            {/* 全頁 Modal */}
            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
            {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
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
                setUser={setUser}
                onAddMetric={() => setShowMetricModal(true)}
                onAddWorkout={() => setShowWorkoutModal(true)}
                user={user ? { displayName: user.displayName } : undefined}
                authLoading={authLoading}
                role={role}
                roleLoading={roleLoading}
            />
            <main className="min-h-screen bg-black text-white px-4 pt-16 text-center">
                {/* 歡迎區塊 */}
                <h1 className="text-2xl font-bold text-orange-500 welcome-animate mb-2">
                    {user ? `歡迎你，${user.displayName || "訪客"}！` : "載入中..."}
                </h1>
                <GlowWaveText
                    text={quote}
                    colorMode="white"
                    className="text-lg italic mb-6"
                />
                {user && <LatestBodyMetric userId={user.uid} user={user} refreshTrigger={refreshTrigger} />}

                {/* 歷史紀錄區 */}

                {user && <BodyMetricChart userId={user.uid} refreshTrigger={refreshTrigger} />}

                <div className="fixed bottom-4 right-4 z-50">
                    {user && <BookingBell user={user} />}
                </div>
            </main>
        </>
    );
}
