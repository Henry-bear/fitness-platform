"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { getIdToken } from "firebase/auth";
import PrivacyUnlockDialog from "@/components/PrivacyUnlockDialog";
import { Eye, EyeOff, Mail, ShieldCheck, UserRound, Users } from "lucide-react";

type UserItem = {
    id: string;
    name: string;
    email: string;
    role: "member" | "groupCoach" | "personalTrainer" | "admin";
    assignedTrainerId?: string;
};

export default function AdminUsersPage() {
    const [user, authLoading] = useAuthState(auth);
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const router = useRouter();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [emailVisible, setEmailVisible] = useState(false);
    const [showPrivacyUnlock, setShowPrivacyUnlock] = useState(false);

    useEffect(() => {
        if (!emailVisible) return;
        const timer = window.setTimeout(() => setEmailVisible(false), 5 * 60 * 1000);
        return () => window.clearTimeout(timer);
    }, [emailVisible]);

    useEffect(() => {
        if (authLoading || roleLoading) return;
        if (!user) {
            router.replace("/");
            return;
        }
        if (role === null) return;
        if (role !== "admin") {
            toast.error("只有管理員可以進入此頁面");
            router.replace("/");
            return;
        }

        const fetchUsers = async () => {
            const snapshot = await getDocs(collection(db, "users"));
            const list: UserItem[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    name: data.name || "",
                    email: data.email || "",
                    role: data.role || "member",
                    assignedTrainerId: data.assignedTrainerId || "",
                };
            });
            setUsers(list);
        };

        fetchUsers();
    }, [authLoading, roleLoading, user, role, router]);


    // 指派教練
    const handleTrainerAssign = async (userId: string, trainerId: string) => {
        try {
            await updateDoc(doc(db, "users", userId), {
                assignedTrainerId: trainerId || null,
            });

            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userId ? { ...u, assignedTrainerId: trainerId } : u
                )
            );

            toast.success("已更新專屬教練");
        } catch (err) {
            toast.error("更新失敗");
            console.error(err);
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserItem["role"]) => {
        try {

            // 拿當前登入者的 token
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("尚未登入");

            // 防止更改自己的角色
            if (userId === currentUser.uid) {
                toast.error("無法更改自己的權限");
                return;
            }

            // 找到該使用者
            const targetUser = users.find((u) => u.id === userId);
            if (!targetUser) {
                toast.error("找不到該使用者");
                return;
            }

            // 防止降級其他 admin
            if (targetUser.role === "admin") {
                toast.error("無法更改其他管理員的權限");
                return;
            }
            const token = await getIdToken(currentUser);

            // 呼叫後端 API
            const res = await fetch("/api/setRole", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, //  傳 token 給後端驗證
                },
                body: JSON.stringify({ uid: userId, role: newRole }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "未知錯誤");

            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
            );
            toast.success("使用者權限已更新");
        } catch {
            toast.error("權限更新失敗");
        }
    };

    if (authLoading || roleLoading || role === null) {
        return <p className="text-center text-orange-500 mt-10">權限驗證中...</p>;
    }

    if (!user || role !== "admin") return null;

    const maskEmail = (email: string) => {
        if (!email) return "未提供";
        const [name = "", domain = ""] = email.split("@");
        const domainSuffix = domain.includes(".") ? `.${domain.split(".").pop()}` : "";
        return `${name.slice(0, 2) || "••"}${"•".repeat(Math.min(Math.max(name.length - 2, 4), 8))}@••••${domainSuffix}`;
    };

    const roleNames: Record<UserItem["role"], string> = {
        member: "會員",
        groupCoach: "團課教練",
        personalTrainer: "私人教練",
        admin: "管理員",
    };

    return (
        <div className="mx-auto max-w-6xl text-white">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-400"><ShieldCheck className="h-4 w-4" />管理員專區</div>
                    <h1 className="text-2xl font-bold">會員與權限</h1>
                    <p className="mt-1 text-sm text-zinc-400">管理角色、專屬教練與敏感聯絡資訊</p>
                </div>
                <button type="button" onClick={() => emailVisible ? setEmailVisible(false) : setShowPrivacyUnlock(true)} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${emailVisible ? "border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/15" : "border-white/10 bg-white/5 text-zinc-300 hover:border-orange-500/40 hover:text-orange-300"}`}>
                    {emailVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{emailVisible ? "立即遮蔽 Email" : "驗證後顯示 Email"}
                </button>
            </div>

            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-400">
                <Users className="h-5 w-5 text-orange-400" /><span>共 {users.length} 位使用者</span><span className="ml-auto text-xs">Email 預設受保護</span>
            </div>

            <div className="grid gap-3">
                {users.map((u) => (
                    <article key={u.id} className="grid gap-4 rounded-2xl border border-white/10 bg-zinc-950/55 p-4 shadow-lg shadow-black/20 backdrop-blur-md transition hover:border-white/20 lg:grid-cols-[1.2fr_1.4fr_1fr_1fr] lg:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400"><UserRound className="h-5 w-5" /></div>
                            <div className="min-w-0"><p className="truncate font-semibold text-white">{u.name || "未命名使用者"}</p><p className="text-xs text-zinc-500">{roleNames[u.role]}</p></div>
                        </div>
                        <div className="flex min-w-0 items-center gap-2 rounded-xl bg-white/[0.035] px-3 py-2.5"><Mail className="h-4 w-4 shrink-0 text-zinc-500" /><span className={`truncate text-sm ${emailVisible ? "text-zinc-200" : "font-mono text-zinc-500"}`}>{emailVisible ? u.email || "未提供" : maskEmail(u.email)}</span></div>
                        <label className="text-xs font-medium text-zinc-500">角色
                            <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value as UserItem["role"])} className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-orange-500/60">
                                <option value="member">會員</option><option value="groupCoach">團課教練</option><option value="personalTrainer">私人教練</option><option value="admin" disabled>管理員</option>
                            </select>
                        </label>
                        <label className="text-xs font-medium text-zinc-500">專屬教練
                            <select value={u.assignedTrainerId || ""} onChange={(e) => handleTrainerAssign(u.id, e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-orange-500/60">
                                <option value="">尚未指定</option>
                                {users.filter((candidate) => candidate.role === "personalTrainer").map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.name}</option>)}
                            </select>
                        </label>
                    </article>
                ))}
            </div>

            <PrivacyUnlockDialog open={showPrivacyUnlock} onClose={() => setShowPrivacyUnlock(false)} onVerified={() => setEmailVisible(true)} />
        </div>
    );
}
