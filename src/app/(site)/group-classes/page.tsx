"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { collection, getDocs, onSnapshot, serverTimestamp, Timestamp, query, where, doc, deleteDoc, setDoc } from "firebase/firestore";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
import Navbar from "@/components/Navbar";
import { useCustomClaimRole } from "../../hooks/useCustomClaimRole";
import WorkoutForm from "@/components/WorkoutForm";
import BodyMetricModal from "@/components/BodyMetricModal";
import { toast } from "sonner";
import AmbientBackground from "@/components/AmbientBackground";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock3, UserRound } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/components/AuthProvider";
import AuthStateScreen from "@/components/AuthStateScreen";

// 類型定義
type GroupClass = {
    id: string;
    title: string;
    coach: string;
    date: string | Timestamp;
    startTime: string;
    endTime: string;
};

const weekDays = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];
const weekdayMap: { [key: string]: string } = {
    Monday: "星期一",
    Tuesday: "星期二",
    Wednesday: "星期三",
    Thursday: "星期四",
    Friday: "星期五",
    Saturday: "星期六",
    Sunday: "星期日",
};

export default function GroupClassesPage() {
    const { user, loading: authLoading, error: authError, retry: retryAuth } = useAuth();
    const [classes, setClasses] = useState<GroupClass[]>([]);
    const router = useRouter();
    const { role, loading: roleLoading } = useCustomClaimRole(user);
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [showMetricModal, setShowMetricModal] = useState(false);
    const [bookedClassIds, setBookedClassIds] = useState<string[]>([]);
    const [selectedDay, setSelectedDay] = useState(() => weekdayMap[dayjs().format("dddd")] || weekDays[0]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [bookingConfirm, setBookingConfirm] = useState<{ item: GroupClass; cancel: boolean } | null>(null);

    const fetchBooking = async (userId: string) => {
        const q = query(
            collection(db, "groupBookings"),
            where("userId", "==", userId)
        );
        const snapshot = await getDocs(q);
        const ids = snapshot.docs.map(doc => doc.data().groupClassId);
        setBookedClassIds(ids);
    };
    // 初始化時載入 查詢預約紀錄
    useEffect(() => {
        if (user) {
            fetchBooking(user.uid)
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading && !authError && !user) router.replace("/");
    }, [authError, authLoading, router, user]);

    // 抓取課表資料
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "groupSchedule"), (snapshot) => {
            const list: GroupClass[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<GroupClass, "id">),
            }));
            setClasses(list);
        });
        return () => unsubscribe();
    }, []);
    // 取消課程函式
    const handleCancelBooking = async (groupClassId: string) => {
        if (!user) return;

        try {
            const q = query(
                collection(db, "groupBookings"),
                where("userId", "==", user.uid),
                where("groupClassId", "==", groupClassId)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                toast.error("無預約紀錄");
                return;
            }
            // 刪除所有符合條件的報名紀錄（保險處理）
            for (const docSnap of snapshot.docs) {
                await deleteDoc(doc(db, "groupBookings", docSnap.id));
            }

            toast.success("已取消預約");
            fetchBooking(user.uid); // ✅ 取消後即時更新狀態
        } catch (err) {
            toast.error("取消失敗：" + (err as Error).message);
        }

    };
    // 報名課程函式
    const handleBooking = async (groupClassId: string) => {
        if (!user) {
            toast.error("請先登入");
            return;
        }

        try {
            await setDoc(doc(db, "groupBookings", `${user.uid}_${groupClassId}`), {
                userId: user.uid,
                groupClassId,
                createdAt: serverTimestamp(),
            });
            toast.success("預約成功")
            fetchBooking(user.uid);
        } catch (err) {
            console.error("預約失敗：", err);
            toast.error("預約失敗，請稍後再試" + (err as Error).message);
        }
    };

    const getDayClasses = (day: string) => {
        const today = dayjs().startOf("day");
        const daysSinceMonday = (today.day() + 6) % 7;
        const startOfWeek = today.subtract(daysSinceMonday, "day");
        const endOfWeek = startOfWeek.add(6, "day").endOf("day");

        const filtered = classes.filter((item) => {
            const rawDate = item.date instanceof Timestamp ? item.date.toDate() : new Date(item.date);
            const classDate = dayjs(rawDate);
            const classDay = classDate.format("dddd");

            const isInThisWeek = classDate.isBetween(startOfWeek, endOfWeek, "day", "[]");
            return weekdayMap[classDay] === day && isInThisWeek;
        });
        return filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const selectedDayClasses = getDayClasses(selectedDay);

    // loading 畫面
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

            {/* Modal 控制區塊 */}
            {showWorkoutModal && user && (
                <WorkoutForm user={user} onClose={() => setShowWorkoutModal(false)} onSaved={() => { }} />
            )}
            {showMetricModal && user?.uid && (
                <BodyMetricModal userId={user.uid} onClose={() => setShowMetricModal(false)} onSaved={() => { }} />
            )}

            <main className="relative isolate min-h-screen overflow-hidden bg-[#070809] px-4 pb-20 pt-20 text-white">
                <AmbientBackground variant="classes" />
                <div className="relative z-10 mx-auto max-w-6xl">
                <div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400"><CalendarDays className="h-6 w-6" /></div><h1 className="text-3xl font-bold text-white">本週團體課程</h1><p className="mt-2 text-sm text-zinc-400">選擇星期，查看適合你的訓練時段</p></div>

                <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/55 p-2 backdrop-blur-lg">
                    {weekDays.map((day) => {
                        const count = getDayClasses(day).length;
                        return <button key={day} type="button" onClick={() => setSelectedDay(day)} className={`min-w-[86px] flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${selectedDay === day ? "bg-orange-500 text-white shadow-lg shadow-orange-950/30" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}><span className="block">{day.replace("星期", "週")}</span><span className={`mt-0.5 block text-[10px] ${selectedDay === day ? "text-orange-100" : "text-zinc-600"}`}>{count ? `${count} 堂` : "暫無"}</span></button>;
                    })}
                </div>

                <AnimatePresence mode="wait">
                    <motion.section key={selectedDay} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="min-h-[300px] rounded-3xl border border-white/10 bg-zinc-950/58 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
                        <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-orange-400">Selected day</p><h2 className="mt-1 text-2xl font-bold text-white">{selectedDay}</h2></div><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400">{selectedDayClasses.length} 堂課</span></div>
                        {selectedDayClasses.length === 0 ? (
                            <div className="flex min-h-[200px] flex-col items-center justify-center text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-600"><CalendarDays className="h-6 w-6" /></div><p className="mt-4 font-medium text-zinc-300">這天還沒有安排課程</p><p className="mt-1 text-sm text-zinc-600">切換其他星期看看吧</p></div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {selectedDayClasses.map((item) => {
                                    const isBooked = bookedClassIds.includes(item.id);
                                    return <article key={item.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-orange-500/40 hover:bg-orange-500/[0.04]"><div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-60" /><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold text-white">{item.title}</h3>{isBooked && <span className="shrink-0 rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-400">已預約</span>}</div><div className="mt-4 space-y-2 text-sm text-zinc-400"><p className="flex items-center gap-2"><UserRound className="h-4 w-4 text-orange-400" />{item.coach} 教練</p><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-orange-400" />{dayjs(item.date instanceof Timestamp ? item.date.toDate() : item.date).format("YYYY/MM/DD")}</p><p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-orange-400" />{item.startTime} - {item.endTime}</p></div><button type="button" onClick={() => setBookingConfirm({ item, cancel: isBooked })} className={`mt-5 w-full rounded-xl py-2.5 text-sm font-semibold transition ${isBooked ? "border border-white/10 bg-white/5 text-zinc-300 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300" : "bg-orange-500 text-white hover:bg-orange-400"}`}>{isBooked ? "取消預約" : "預約這堂課"}</button></article>;
                                })}
                            </div>
                        )}
                    </motion.section>
                </AnimatePresence>
                </div>
            </main>
            <ConfirmDialog
                open={Boolean(bookingConfirm)}
                title={bookingConfirm?.cancel ? "取消團體課程" : "確認團體課程預約"}
                message={bookingConfirm ? `${bookingConfirm.item.title} · ${dayjs(bookingConfirm.item.date instanceof Timestamp ? bookingConfirm.item.date.toDate() : bookingConfirm.item.date).format("MM/DD")} ${bookingConfirm.item.startTime} - ${bookingConfirm.item.endTime}` : ""}
                confirmText={bookingConfirm?.cancel ? "確認取消" : "確認預約"}
                tone={bookingConfirm?.cancel ? "danger" : "primary"}
                onCancel={() => setBookingConfirm(null)}
                onConfirm={async () => {
                    if (!bookingConfirm) return;
                    if (bookingConfirm.cancel) await handleCancelBooking(bookingConfirm.item.id);
                    else await handleBooking(bookingConfirm.item.id);
                    setBookingConfirm(null);
                }}
            />
        </>
    );
}
