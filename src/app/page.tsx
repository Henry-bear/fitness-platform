"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import RegisterModal from "@/components/RegisterModal";
import LoginModal from "@/components/LoginModal";
import BodyMetricModal from "@/components/BodyMetricModal";
import WorkoutForm from "@/components/WorkoutForm";
import { useCustomClaimRole } from "./hooks/useCustomClaimRole";



export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [, setRefreshTrigger] = useState(Date.now());
  const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
    setRefreshTrigger(Date.now());
  };

  return (
    <>
      {/* 註冊 Modal */}
      {showRegister && (
        <RegisterModal onClose={() => setShowRegister(false)} />
      )}
      {/* 登入 Modal */}
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} />
      )}
      {/* BodyMetricModal*/}
      {user && showMetricModal && (
        <BodyMetricModal
          userId={user.uid}
          onClose={() => setShowMetricModal(false)}
          onSaved={handleRefresh}
        />
      )}
      {/* WorkoutModal*/}
      {user && showWorkoutModal && (
        <WorkoutForm
          user={user}
          onClose={() => setShowWorkoutModal(false)}
          onSaved={handleRefresh}
        />
      )}

      <main className="relative min-h-screen bg-black text-white">
        {/* 導覽列 */}
        <Navbar
          user={user ? { displayName: user.displayName } : undefined}
          onLogin={() => setShowLogin(true)}
          onRegister={() => setShowRegister(true)}
          setUser={setUser}
          onAddMetric={() => setShowMetricModal(true)}
          onAddWorkout={() => setShowWorkoutModal(true)}
          role={role}
          roleLoading={roleLoading}
          authLoading={authLoading}
        />

        {/* Hero 背景區塊 */}
        <div
          className="relative min-h-screen bg-cover bg-center"
          style={{
            backgroundImage: "url('/bg-hero.png')",
          }}
        >
          {/* 遮罩層 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent z-0"></div>

          {/* Hero 內文區 */}
          <div className="relative z-10 flex flex-col items-center justify-center h-[80vh] text-center px-6">
            <motion.h2
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl font-bold text-white mb-4"
            >
              找回你的節奏與力量
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-lg text-zinc-300 max-w-md italic animate-pulse"
            >
              FitnessWay 是你的個人健身記錄與訓練夥伴，從今天開始自我提升。
            </motion.p>
          </div>
        </div>
      </main>
    </>
  );
}
