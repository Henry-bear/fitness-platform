"use client";

import Navbar from "@/components/Navbar";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import WorkoutForm from "@/components/WorkoutForm";
import BodyMetricModal from "@/components/BodyMetricModal";
import Image from "next/image";
import ExperienceBookingModal from "@/components/ExperienceBookingModal";
import AmbientBackground from "@/components/AmbientBackground";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import AuthStateScreen from "@/components/AuthStateScreen";


export default function ExperiencePage() {
    const { user, loading: authLoading, error: authError, retry: retryAuth } = useAuth();
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [showMetricModal, setShowMetricModal] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showExperienceModal, setShowExperienceModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !authError && !user) router.replace("/");
    }, [authError, authLoading, router, user]);

    if (authLoading || roleLoading) return <AuthStateScreen />;
    if (authError) return <AuthStateScreen error={authError} onRetry={retryAuth} />;
    if (!user) return <AuthStateScreen message="正在返回首頁..." />;

    return (
        <>
            <Navbar
                user={user ? { displayName: user.displayName } : undefined}
                authLoading={authLoading}
                role={role}
                roleLoading={roleLoading}
                onAddWorkout={() => setShowWorkoutModal(true)}
                onAddMetric={() => setShowMetricModal(true)}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
            />

            {showWorkoutModal && user && (
                <WorkoutForm user={user} onClose={() => setShowWorkoutModal(false)} onSaved={() => { }} />
            )}

            {showMetricModal && user?.uid && (
                <BodyMetricModal userId={user.uid} onClose={() => setShowMetricModal(false)} onSaved={() => { }} />
            )}

            <AnimatePresence>
                {showExperienceModal && user && (
                    <ExperienceBookingModal
                        user={user}
                        onClose={() => setShowExperienceModal(false)}
                    />
                )}
            </AnimatePresence>

            <section className="relative isolate h-[560px] w-full overflow-hidden bg-black">
                <Image
                    src="/personalTrainer.png"
                    alt="教練與學員"
                    fill
                    className="object-cover brightness-[.58] scale-[1.03]"
                    priority
                />
                <AmbientBackground variant="experience" />
                <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-24 text-center">
                    <div className="rounded-2xl border border-white/10 bg-black/55 px-6 py-10 shadow-2xl shadow-black/40 backdrop-blur-md">
                        <h1 className="text-3xl font-bold text-orange-400 mb-4">體驗私人教練課程</h1>
                        <p className="text-white leading-relaxed text-base md:text-lg">
                            新會員可免費體驗一次 <span className="text-orange-400 font-bold">一對一私人教練課程</span>，
                            課程內容將依據您的身體狀況與健身目標，由專業教練量身打造。

                            <br className="hidden sm:block" />
                            預約後，教練會主動與您聯繫確認細節，並安排首次體驗時間。
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => setShowExperienceModal(true)}
                                className="rounded bg-orange-500 px-6 py-3 font-bold text-white shadow-lg shadow-orange-950/40 transition hover:-translate-y-0.5 hover:bg-orange-400"
                            >
                                立即體驗
                            </button>

                        </div>
                    </div>
                </div>

            </section>

        </>
    );
}
