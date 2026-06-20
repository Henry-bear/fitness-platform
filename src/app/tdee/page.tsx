"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import Navbar from "@/components/Navbar";
import WorkoutForm from "@/components/WorkoutForm";
import BodyMetricModal from "@/components/BodyMetricModal";
import TDEECalculator from "@/components/TDEECalculator";
import AmbientBackground from "@/components/AmbientBackground";
import { useAuth } from "@/components/AuthProvider";
import AuthStateScreen from "@/components/AuthStateScreen";

export default function TDEEPage() {
    const { user, loading: authLoading, error: authError, retry: retryAuth } = useAuth();
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [showMetricModal, setShowMetricModal] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !authError && !user) router.replace("/");
    }, [authError, authLoading, router, user]);

    if (authLoading || roleLoading) return <AuthStateScreen />;
    if (authError) return <AuthStateScreen error={authError} onRetry={retryAuth} />;
    if (!user) return <AuthStateScreen message="正在返回首頁..." />;

    return (
        <div className="relative isolate min-h-screen overflow-hidden bg-[#070809]">
            <AmbientBackground variant="tdee" />
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

            <main className="relative z-10 mx-auto max-w-5xl px-4 py-14">
                <TDEECalculator />
            </main>
        </div>
    );
}
