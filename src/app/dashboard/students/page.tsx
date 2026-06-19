"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { BookOpenCheck, Mail, UserRound, Users } from "lucide-react";

type Student = {
    id: string;
    name: string;
    email: string;
    remainingSessions: number;
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
                where("assignedTrainerId", "==", user.uid),
                where("isFormalMember", "==", true)
            );
            const snap = await getDocs(q);
            const result: Student[] = snap.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name || "(無名)",
                email: doc.data().email || "",
                remainingSessions: doc.data().remainingSessions || 0,
            }));
            setStudents(result);
        };

        if (user?.uid && role === "personalTrainer") fetchStudents();
    }, [user, role]);

    if (loading || roleLoading || !user || role !== "personalTrainer") return null;

    return (
        <div className="mx-auto max-w-6xl text-white">
            <div className="mb-6">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-400"><Users className="h-4 w-4" />教練工作台</div>
                <h1 className="text-2xl font-bold">我的正式學員</h1>
                <p className="mt-1 text-sm text-zinc-400">掌握負責學員與剩餘私人教練課堂數</p>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 backdrop-blur-md"><div className="flex items-center gap-2 text-xs text-zinc-500"><Users className="h-4 w-4 text-orange-400" />正式學員</div><p className="mt-2 text-2xl font-bold">{students.length}<span className="ml-1 text-sm font-normal text-zinc-500">位</span></p></div>
                <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 backdrop-blur-md"><div className="flex items-center gap-2 text-xs text-zinc-500"><BookOpenCheck className="h-4 w-4 text-emerald-400" />可用課堂</div><p className="mt-2 text-2xl font-bold">{students.reduce((total, student) => total + student.remainingSessions, 0)}<span className="ml-1 text-sm font-normal text-zinc-500">堂</span></p></div>
            </div>

            {students.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/55 text-center backdrop-blur-md"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-600"><Users className="h-6 w-6" /></div><p className="mt-4 font-medium text-zinc-300">目前沒有正式學員</p><p className="mt-1 text-sm text-zinc-600">指派或購課完成後，學員會顯示在這裡</p></div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {students.map((student) => (
                        <article key={student.id} className="group rounded-2xl border border-white/10 bg-zinc-950/55 p-5 shadow-lg shadow-black/20 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-orange-400/25">
                            <div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400"><UserRound className="h-5 w-5" /></div><span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${student.remainingSessions > 0 ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-red-400/20 bg-red-400/10 text-red-300"}`}>{student.remainingSessions > 0 ? "課程進行中" : "堂數已用完"}</span></div>
                            <h2 className="mt-4 font-semibold text-white">{student.name}</h2>
                            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-zinc-500"><Mail className="h-3.5 w-3.5" />{student.email || "未提供 Email"}</p>
                            <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4"><span className="text-xs text-zinc-500">剩餘堂數</span><span className="text-2xl font-bold text-orange-300">{student.remainingSessions}<small className="ml-1 text-xs font-normal text-zinc-500">堂</small></span></div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
