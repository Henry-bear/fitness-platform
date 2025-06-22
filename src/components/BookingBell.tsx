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
import { CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Timestamp } from "firebase/firestore";
import dayjs from "dayjs";

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

type ExperienceBooking = {
    id: string;
    preferredTime: string;
    status: "pending" | "assigned" | "contacted";
    assignedTrainerId?: string;
    trainerName?: string;
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

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-zinc-900 text-white rounded-lg p-6 max-w-md w-full"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-orange-500">已預約課程</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-zinc-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* 私人教練課程區塊 */}
                            <div className="mb-6 border border-orange-500 bg-zinc-800 rounded-lg p-4">
                                <h3 className="text-md font-bold text-orange-500 mb-3">私人教練課程</h3>

                                {/* 堂數顯示獨立區塊 */}
                                <div className="border border-orange-400 rounded p-3 bg-zinc-900 mb-5 shadow-sm">
                                    {remainingSessions !== null ? (
                                        <p className="text-sm text-zinc-200">
                                            您的教練課堂數：
                                            <span className="text-orange-400 font-bold ml-1">{remainingSessions}</span> 堂
                                        </p>
                                    ) : (
                                        <p className="text-sm text-zinc-400">無法取得堂數資料</p>
                                    )}
                                </div>

                                {privateBookings.length > 0 ? (
                                    <ul className="space-y-3">
                                        {privateBookings.map((item) => (
                                            <li
                                                key={item.id}
                                                className="border border-orange-500 rounded p-3 bg-zinc-900 shadow-sm"
                                            >
                                                <div className="font-semibold text-orange-400">一對一課程
                                                    {item.studentType === "experience" && <span className="ml-2 text-sm text-orange-300">(體驗)</span>}
                                                </div>
                                                <div className="text-sm text-zinc-300">教練：{item.trainerName}</div>
                                                <div className="text-sm text-zinc-400">
                                                    {dayjs(item.date).format("YYYY/MM/DD")} | {item.startTime} - {item.endTime}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-zinc-400">目前沒有私人教練預約</p>
                                )}
                            </div>

                            {/* 團體課程區塊 */}
                            <div className="border border-orange-500 bg-zinc-800 rounded-lg p-4">
                                <h3 className="text-md font-bold text-orange-500 mb-3">團體課程</h3>
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
                                                    className="border border-orange-500 rounded p-3 bg-zinc-900 shadow-sm overflow-hidden"
                                                >
                                                    <div className="font-semibold text-orange-400">{item.title}</div>
                                                    <div className="text-sm text-zinc-300">{item.coach} 教練</div>
                                                    <div className="text-sm text-zinc-400">
                                                        {dayjs(
                                                            item.date instanceof Timestamp ? item.date.toDate() : item.date
                                                        ).format("YYYY/MM/DD")}{" "}
                                                        | {item.startTime} - {item.endTime}
                                                    </div>
                                                    <button
                                                        onClick={() => handleCancel(item.id)}
                                                        className="mt-2 text-sm text-red-400 border border-red-400 px-2 py-1 rounded hover:bg-red-600 hover:text-white transition"
                                                    >
                                                        取消預約
                                                    </button>
                                                </motion.li>
                                            ))}
                                        </AnimatePresence>
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}