"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { User } from "firebase/auth";
import dayjs from "dayjs";
import { Timestamp } from "firebase/firestore";
import { CalendarDays, Clock3, Users } from "lucide-react";

type GroupClass = {
    id: string;
    title: string;
    date: string | Timestamp;
    startTime: string;
    endTime: string;
}

export default function CoachSchedule({ user }: { user: User }) {
    const [classes, setClasses] = useState<
        (GroupClass & { bookingCount: number })[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const q = query(
                collection(db, "groupSchedule"),
                where("coach", "==", user.displayName) // 假設教練名稱與 displayName 相同
            );
            const classSnapshot = await getDocs(q);

            const result = await Promise.all(
                classSnapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data() as GroupClass;
                    const bookingQ = query(
                        collection(db, "groupBookings"),
                        where("groupClassId", "==", docSnap.id)
                    );
                    const bookingSnap = await getDocs(bookingQ);

                    return {
                        ...data,
                        id: docSnap.id,
                        bookingCount: bookingSnap.size,
                    };
                })
            );

            setClasses(result.sort((a, b) => {
                const aDate = a.date instanceof Timestamp ? a.date.toMillis() : dayjs(a.date).valueOf();
                const bDate = b.date instanceof Timestamp ? b.date.toMillis() : dayjs(b.date).valueOf();
                return aDate - bDate;
            }));
        };

        fetchData();
    }, [user]);

    return (
        <div>
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-400">
                <CalendarDays className="h-5 w-5 text-orange-400" />
                <span>共 {classes.length} 堂授課</span>
                <span className="ml-auto text-xs">依日期排序</span>
            </div>
            {classes.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/55 text-center backdrop-blur-md">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-600"><CalendarDays className="h-6 w-6" /></div>
                    <p className="mt-4 font-medium text-zinc-300">目前沒有排定課程</p>
                    <p className="mt-1 text-sm text-zinc-600">管理員排課後會顯示在這裡</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {classes.map((cls) => (
                        <article key={cls.id} className="grid gap-4 rounded-2xl border border-white/10 bg-zinc-950/55 p-4 shadow-lg shadow-black/20 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-orange-400/25 lg:grid-cols-[1.3fr_1fr_1fr_0.7fr] lg:items-center">
                            <div>
                                <p className="font-semibold text-white">{cls.title}</p>
                                <p className="mt-1 text-xs text-zinc-500">團體課程</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-400"><CalendarDays className="h-4 w-4 text-orange-400" />{dayjs(cls.date instanceof Timestamp ? cls.date.toDate() : cls.date).format("YYYY/MM/DD")}</div>
                            <div className="flex items-center gap-2 text-sm text-zinc-400"><Clock3 className="h-4 w-4 text-orange-400" />{cls.startTime} - {cls.endTime}</div>
                            <div className="flex items-center gap-2 text-sm text-zinc-400"><Users className="h-4 w-4 text-orange-400" />{cls.bookingCount} 人</div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
