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

export default function BookingBell({ user }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [bookings, setBookings] = useState<(GroupClass & { isRemoving?: boolean })[]>([]);
    const [bounceOnce, setBounceOnce] = useState(true);
    // 載入預約
    useEffect(() => {
        if (!user) return;
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
                    className={"bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"}
                >
                    <CalendarCheck className="w-5 h-5" />
                    {/* 只在桌機版顯示文字 */}
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
                            className="bg-white rounded-lg p-6 max-w-md w-full text-black"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-orange-500">已預約課程</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-zinc-500 hover:text-zinc-800"
                                >
                                    ✕
                                </button>
                            </div>
                            {bookings.length === 0 ? (
                                <p className="text-zinc-500">目前沒有預約課程</p>
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
                                                className="border rounded p-3 shadow-sm overflow-hidden"
                                            >
                                                <div className="font-semibold text-orange-600">{item.title}</div>
                                                <div className="text-sm text-zinc-700">{item.coach} 教練</div>
                                                <div className="text-sm text-zinc-500">
                                                    {dayjs(item.date instanceof Timestamp ? item.date.toDate() : item.date).format("YYYY/MM/DD")}
                                                    {" "} | {item.startTime} - {item.endTime}
                                                </div>
                                                <button
                                                    onClick={() => handleCancel(item.id)}
                                                    className="mt-2 text-sm text-red-500 border border-red-300 px-2 py-1 rounded hover:bg-red-100 transition"
                                                >
                                                    取消預約
                                                </button>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
