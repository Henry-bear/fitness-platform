"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { User } from "firebase/auth";

type GroupClass = {
    id: string;
    title: string;
    date: string;
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

            setClasses(result);
        };

        fetchData();
    }, [user]);

    return (
        <div className="space-y-4">
            {classes.map((cls) => (
                <div
                    key={cls.id}
                    className="p-4 rounded border border-orange-300 bg-white text-black shadow"
                >
                    <div className="font-bold text-orange-500">{cls.title}</div>
                    <div className="text-sm">
                        {cls.date} / {cls.startTime} - {cls.endTime}
                    </div>
                    <div className="text-sm text-gray-700">
                        預約人數：{cls.bookingCount} 人
                    </div>
                </div>
            ))}
        </div>
    );
}

