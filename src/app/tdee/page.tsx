"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import Navbar from "@/components/Navbar";
import WorkoutForm from "@/components/WorkoutForm";
import BodyMetricModal from "@/components/BodyMetricModal";
import TDEECalculator from "@/components/TDEECalculator";

export default function TDEEPage() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [showMetricModal, setShowMetricModal] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (!firebaseUser) {
                router.push("/");
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
        <div className="min-h-screen bg-black">
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

            <main className="max-w-3xl mx-auto px-4 py-10">
                <div className="bg-zinc-900 rounded-lg shadow-md p-6 text-white">
                    <TDEECalculator />
                </div>
            </main>
        </div>
    );
}
