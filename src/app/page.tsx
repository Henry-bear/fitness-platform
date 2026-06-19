"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import Link from "next/link";
import { Activity, ArrowRight, CalendarDays, Dumbbell } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);

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
        <RegisterModal
          onClose={() => setShowRegister(false)}
          openLogin={() => {
            setShowRegister(false);   // 關閉註冊
            setShowLogin(true);       // 開啟登入
          }}
        />
      )}
      {/* 登入 Modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          openRegister={() => {
            setShowLogin(false);       // 關閉登入
            setShowRegister(true);     // 開啟註冊
          }}
        />
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

      <main className="relative min-h-screen overflow-hidden bg-[#070809] text-white">
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
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />

        <section className="relative min-h-screen overflow-hidden pt-24">
          <div className="absolute inset-0">
            <motion.div
              initial={{ scale: 1.06, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0 bg-cover bg-[62%_center] md:bg-center"
              style={{ backgroundImage: "url('/bg-hero.png')" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,7,0.98)_0%,rgba(5,6,7,0.82)_42%,rgba(5,6,7,0.28)_76%,rgba(5,6,7,0.72)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070809] via-transparent to-[#070809]/80" />
            <motion.div
              aria-hidden="true"
              animate={{ x: [0, 45, 0], y: [0, -24, 0], opacity: [0.28, 0.5, 0.28] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-orange-500/25 blur-[110px]"
            />
          </div>

          <div className="relative z-10 mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-orange-300 backdrop-blur-md"
              >
                <Activity className="h-3.5 w-3.5" /> TRAIN WITH PURPOSE
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.08, ease: "easeOut" }}
                className="text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
              >
                不只是訓練，<br />
                <span className="bg-gradient-to-r from-orange-300 via-orange-500 to-amber-300 bg-clip-text text-transparent">讓每次進步都有跡可循。</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.2 }}
                className="mt-6 max-w-xl text-base leading-8 text-zinc-300 sm:text-lg"
              >
                從身體數據、訓練紀錄到教練課程，FitnessWay 把你的每一步整合成清楚、可持續的訓練節奏。
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.3 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link href={user ? "/member" : "/experience"} className="group inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold shadow-xl shadow-orange-950/40 transition hover:-translate-y-0.5 hover:bg-orange-400">
                  {user ? "查看我的進度" : "預約體驗課程"}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
                <Link href="/group-classes" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 font-semibold text-zinc-200 backdrop-blur-md transition hover:border-orange-400/35 hover:bg-orange-400/10 hover:text-white">
                  探索團體課程
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.85, delay: 0.25, ease: "easeOut" }}
              className="grid gap-3 self-end pb-5 sm:grid-cols-2 lg:self-center"
            >
              {[
                { icon: Dumbbell, eyebrow: "TRAINING", title: "每組訓練完整記錄", text: "重量、次數與部位變化一眼掌握" },
                { icon: Activity, eyebrow: "BODY DATA", title: "看見身體真實趨勢", text: "用數據調整下一步，而不是憑感覺猜測" },
                { icon: CalendarDays, eyebrow: "COACHING", title: "課程與教練無縫接軌", text: "團課、私人教練與體驗預約集中管理" },
              ].map((item, index) => (
                <motion.article
                  key={item.eyebrow}
                  animate={{ y: index === 1 ? [-4, 4, -4] : [3, -3, 3] }}
                  transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
                  className={`rounded-2xl border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:border-orange-400/30 hover:bg-black/60 ${index === 2 ? "sm:col-span-2 sm:ml-12" : ""}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300"><item.icon className="h-5 w-5" /></div>
                  <p className="mt-5 text-[10px] font-bold tracking-[0.2em] text-orange-400">{item.eyebrow}</p>
                  <h2 className="mt-1.5 font-semibold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
