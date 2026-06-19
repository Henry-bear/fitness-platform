"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    deleteDoc,
} from "firebase/firestore";
import { CalendarCheck, CalendarDays, Clock3, Dumbbell, Users } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Timestamp } from "firebase/firestore";
import dayjs from "dayjs";
import ModalShell from "./ModalShell";

type Props = {
    user: User;
};

type GroupClass = {
    id: string;
    title: string;
    coach: string;
    date: Timestamp | Date;
    startTime: string;
    endTime: string;
};

type PrivateSession = {
    id: string;
    trainerId: string;
    studentId: string;
    studentType: "experience" | "normal";
    trainerName: string;
    date: string; // "2025-06-20"
    startTime: string; // "10:00"
    endTime: string; // "11:00"
    isAttended: boolean;
};


export default function BookingBell({ user }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [bookings, setBookings] = useState<
        (GroupClass & { isRemoving?: boolean })[]
    >([]);
    const [bounceOnce, setBounceOnce] = useState(true);
    const [remainingSessions, setRemainingSessions] = useState<number | null>(
        null
    );
    const [privateBookings, setPrivateBookings] = useState<PrivateSession[]>([]);

    useEffect(() => {
        if (!user) return;

        // 抓取私人教練課預約日期
        const fetchPrivateBookings = async () => {
            const now = dayjs();

            try {
                const snap = await getDocs(
                    query(
                        collection(db, "privateSchedule"),
                        where("studentId", "==", user.uid),
                        where("isAttended", "==", false)
                    )
                );

                const filtered = await Promise.all(
                    snap.docs
                        .map(async (docSnap): Promise<PrivateSession | null> => {
                            const data = docSnap.data();
                            const sessionDateTime = dayjs(`${data.date} ${data.endTime}`);
                            if (!sessionDateTime.isAfter(now)) return null;

                            const trainerDoc = await getDoc(doc(db, "users", data.trainerId));
                            const trainerName = trainerDoc.exists()
                                ? trainerDoc.data().name ?? "未知教練"
                                : "未知教練";

                            return {
                                id: docSnap.id,
                                trainerId: data.trainerId,
                                trainerName,
                                studentId: data.studentId,
                                studentType: data.studentType,
                                date: data.date,
                                startTime: data.startTime,
                                endTime: data.endTime,
                                isAttended: data.isAttended,
                            };
                        })
                );

                // 移除 null 項目（已過期的）
                setPrivateBookings(filtered.filter((item): item is PrivateSession => item !== null));
            } catch (error) {
                console.error("載入私人教練課失敗", error);
            }
        };

        // 抓取私人教練課堂數
        const fetchUserSessions = async () => {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setRemainingSessions(data.remainingSessions ?? 0);
                }
            } catch (error) {
                console.error("載入堂數失敗", error);
            }
        };

        const fetchBookings = async () => {
            const bookingSnap = await getDocs(
                query(collection(db, "groupBookings"), where("userId", "==", user.uid))
            );
            const classIds = bookingSnap.docs.map((doc) => doc.data().groupClassId);

            const classSnap = await getDocs(collection(db, "groupSchedule"));
            const classList: GroupClass[] = classSnap.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<GroupClass, "id">),
            }));

            const filtered = classList.filter((item) => classIds.includes(item.id));
            setBookings(filtered);
        };


        fetchPrivateBookings();
        fetchUserSessions();
        fetchBookings();
    }, [user]);

    const handleCancel = async (classId: string) => {
        setBookings((prev) =>
            prev.map((b) => (b.id === classId ? { ...b, isRemoving: true } : b))
        );

        setTimeout(async () => {
            try {
                const q = query(
                    collection(db, "groupBookings"),
                    where("userId", "==", user.uid),
                    where("groupClassId", "==", classId)
                );
                const snapshot = await getDocs(q);
                for (const docSnap of snapshot.docs) {
                    await deleteDoc(doc(db, "groupBookings", docSnap.id));
                }
                toast.success("已取消預約");
                setBookings((prev) => prev.filter((b) => b.id !== classId));
            } catch (err) {
                toast.error("取消失敗：" + (err as Error).message);
            }
        }, 300);
    };

    return (
        <div className="fixed z-50 right-4 sm:bottom-4 bottom-auto top-[5.5rem] sm:top-auto">
            <motion.div
                initial={{ y: 0 }}
                animate={bounceOnce ? { y: [0, -10, 0] } : undefined}
                transition={{ duration: 0.6 }}
                onAnimationComplete={() => setBounceOnce(false)}
            >
                <button
                    onClick={() => setShowModal(true)}
                    className={
                        "bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
                    }
                >
                    <CalendarCheck className="w-5 h-5" />
                    <span className="hidden sm:inline">我的預約課程</span>
                </button>
            </motion.div>

            <ModalShell open={showModal} onClose={() => setShowModal(false)} title="我的預約課程" description="查看私人教練與團體課程安排" icon={<CalendarCheck className="h-5 w-5" />} titleId="my-bookings-title" maxWidth="lg">
                        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">

                            {/* 私人教練課程區塊 */}
                            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                                <h3 className="mb-3 flex items-center gap-2 font-semibold text-white"><Dumbbell className="h-4 w-4 text-orange-400" />私人教練課程</h3>

                                {/* 堂數顯示獨立區塊 */}
                                <div className="mb-4 flex items-center justify-between rounded-xl border border-orange-400/15 bg-orange-400/[0.06] p-3">
                                    {remainingSessions !== null ? (
                                        <p className="flex w-full items-center justify-between text-sm text-zinc-400">
                                            可用教練課堂數
                                            <span className="text-xl font-bold text-orange-300">{remainingSessions}<small className="ml-1 text-xs font-normal text-zinc-500">堂</small></span>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-zinc-400">無法取得堂數資料</p>
                                    )}
                                </div>

                                {privateBookings.length > 0 ? (
                                    <ul className="space-y-2">
                                        {privateBookings.map((item) => (
                                            <li
                                                key={item.id}
                                                className="rounded-xl border border-white/10 bg-black/20 p-3"
                                            >
                                                <div className="flex items-center justify-between font-medium text-white">一對一課程
                                                    {item.studentType === "experience" && <span className="rounded-full bg-orange-400/10 px-2 py-0.5 text-[10px] text-orange-300">體驗</span>}
                                                </div>
                                                <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400"><Users className="h-3.5 w-3.5 text-orange-400" />{item.trainerName} 教練</div>
                                                <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500"><Clock3 className="h-3.5 w-3.5 text-orange-400" />
                                                    {dayjs(item.date).format("YYYY/MM/DD")} | {item.startTime} - {item.endTime}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-zinc-400">目前沒有私人教練預約</p>
                                )}
                            </section>

                            {/* 團體課程區塊 */}
                            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                                <h3 className="mb-3 flex items-center gap-2 font-semibold text-white"><CalendarDays className="h-4 w-4 text-orange-400" />團體課程</h3>
                                {bookings.length === 0 ? (
                                    <p className="text-sm text-zinc-400">目前沒有預約團體課程</p>
                                ) : (
                                    <ul className="space-y-3">
                                        <AnimatePresence>
                                            {bookings.map((item) => (
                                                <motion.li
                                                    key={item.id}
                                                    initial={{ opacity: 1, height: "auto" }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="overflow-hidden rounded-xl border border-white/10 bg-black/20 p-3"
                                                >
                                                    <div className="font-semibold text-white">{item.title}</div>
                                                    <div className="mt-1 text-sm text-zinc-400">{item.coach} 教練</div>
                                                    <div className="mt-1 text-sm text-zinc-500">
                                                        {dayjs(
                                                            item.date instanceof Timestamp ? item.date.toDate() : item.date
                                                        ).format("YYYY/MM/DD")}{" "}
                                                        | {item.startTime} - {item.endTime}
                                                    </div>
                                                    <button
                                                        onClick={() => handleCancel(item.id)}
                                                        className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-400/10"
                                                    >
                                                        取消預約
                                                    </button>
                                                </motion.li>
                                            ))}
                                        </AnimatePresence>
                                    </ul>
                                )}
                            </section>
                        </div>
            </ModalShell>
        </div>
    );
}
