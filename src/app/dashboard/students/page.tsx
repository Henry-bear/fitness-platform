"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

type Student = {
    id: string;
    name: string;
    email: string;
};

export default function StudentsPage() {
    const [user, loading] = useAuthState(auth);
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);

    useEffect(() => {
        if (!loading && !roleLoading) {
            if (!user || role !== "personalTrainer") {
                router.replace("/");
            }
        }
    }, [user, loading, role, roleLoading, router]);

    useEffect(() => {
        const fetchStudents = async () => {
            if (!user) return;
            const q = query(
                collection(db, "users"),
                where("assignedTrainerId", "==", user.uid)
            );
            const snap = await getDocs(q);
            const result: Student[] = snap.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name || "(無名)",
                email: doc.data().email || "",
            }));
            setStudents(result);
        };

        if (user?.uid && role === "personalTrainer") fetchStudents();
    }, [user, role]);

    if (loading || roleLoading || !user || role !== "personalTrainer") return null;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-orange-500 mb-4">我的學員名單</h1>
            <div className="bg-white text-black rounded shadow p-4 space-y-4">
                {students.length === 0 ? (
                    <p>目前沒有學員</p>
                ) : (
                    <ul>
                        {students.map((s) => (
                            <li key={s.id} className="border-b py-2">
                                <div className="font-semibold">{s.name}</div>
                                <div className="text-sm text-gray-600">{s.email}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}