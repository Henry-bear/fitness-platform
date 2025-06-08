"use client";

import Navbar from "@/components/Navbar";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import WorkoutForm from "@/components/WorkoutForm";
import BodyMetricModal from "@/components/BodyMetricModal";
import Image from "next/image";
import ExperienceBookingModal from "@/components/ExperienceBookingModal";


export default function ExperiencePage() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [showMetricModal, setShowMetricModal] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showExperienceModal, setShowExperienceModal] = useState(false);
    const router = useRouter();

    // 登入驗證
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (!firebaseUser) {
                router.push("/"); // 未登入導回首頁
                return;
            }
            setUser(firebaseUser);
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (authLoading || roleLoading) {
        return (
            <div className="min-h-screen bg-black text-orange-400 flex justify-center items-center">
                <div className="animate-spin w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-lg">驗證中...</span>
            </div>
        );
    }

    return (
        <>
            <Navbar
                user={user ? { displayName: user.displayName } : undefined}
                setUser={setUser}
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

            {showExperienceModal && user && (
                <ExperienceBookingModal
                    user={user}
                    onClose={() => setShowExperienceModal(false)}
                />
            )}

            <section className="relative w-full h-[500px] bg-black overflow-hidden">
                <Image
                    src="/personalTrainer.png"
                    alt="教練與學員"
                    fill
                    className="object-cover brightness-[.6] blur-[2px]"
                    priority
                />
                <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-24 text-center">
                    <div className="bg-black/60 backdrop-blur-sm rounded-xl px-6 py-10">
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
                                className="px-6 py-3 rounded bg-orange-500 text-white hover:bg-orange-600 transition font-bold"
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
