"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { getIdToken } from "firebase/auth";

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
            // 更新 Firestore 欄位
            await updateDoc(doc(db, "users", userId), { role: newRole });

            // 拿當前登入者的 token
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("尚未登入");

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

    return (
        <div className="bg-white p-6 rounded shadow-sm">
            <h1 className="text-2xl font-bold text-orange-500 mb-4">會員權限管理</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-gray-800 border border-gray-200 rounded-lg">
                    <thead className="bg-orange-100 text-orange-600">
                        <tr>
                            <th className="px-4 py-2 text-left">姓名</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-center">目前角色</th>
                            <th className="px-4 py-2 text-center">專屬教練</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr
                                key={u.id}
                                className="border-t border-gray-200 hover:bg-orange-50 transition-colors hidden sm:table-row"
                            >
                                <td className="px-4 py-2">{u.name}</td>
                                <td className="px-4 py-2">{u.email}</td>
                                <td className="px-4 py-2 text-center">
                                    <select
                                        value={u.role}
                                        onChange={(e) =>
                                            handleRoleChange(u.id, e.target.value as UserItem["role"])
                                        }
                                        className="bg-white border text-center border-orange-400 text-orange-600 rounded px-2 py-1 focus:outline-orange-400"
                                    >
                                        <option value="member">會員</option>
                                        <option value="groupCoach">團課教練</option>
                                        <option value="personalTrainer">私人教練</option>
                                        <option value="admin" disabled>管理員</option>
                                    </select>
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <select
                                        value={u.assignedTrainerId || ""}
                                        onChange={(e) => handleTrainerAssign(u.id, e.target.value)}
                                        className="bg-white border text-center border-orange-400 text-orange-600 rounded px-2 py-1 focus:outline-orange-400"
                                    >
                                        <option value="">尚未指定</option>
                                        {users
                                            .filter((user) => user.role === "personalTrainer")
                                            .map((trainer) => (
                                                <option key={trainer.id} value={trainer.id}>
                                                    {trainer.name}
                                                </option>
                                            ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                        {/* 📱 手機版卡片 */}
                        {users.map((u) => (
                            <tr key={u.id} className="sm:hidden">
                                <td colSpan={4} className="border-t border-gray-200 p-4">
                                    <div className="space-y-2 text-sm">
                                        <p><span className="font-bold text-orange-600">姓名：</span>{u.name}</p>
                                        <p><span className="font-bold text-orange-600">Email：</span>{u.email}</p>
                                        <div>
                                            <p className="font-bold text-orange-600">目前角色：</p>
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value as UserItem["role"])}
                                                className="bg-white border border-orange-400 text-orange-600 rounded px-2 py-1 mt-1 w-full"
                                            >
                                                <option value="member">會員</option>
                                                <option value="groupCoach">團課教練</option>
                                                <option value="personalTrainer">私人教練</option>
                                                <option value="admin" disabled>管理員</option>
                                            </select>
                                        </div>
                                        <div>
                                            <p className="font-bold text-orange-600">專屬教練：</p>
                                            <select
                                                value={u.assignedTrainerId || ""}
                                                onChange={(e) => handleTrainerAssign(u.id, e.target.value)}
                                                className="bg-white border border-orange-400 text-orange-600 rounded px-2 py-1 mt-1 w-full"
                                            >
                                                <option value="">尚未指定</option>
                                                {users
                                                    .filter((user) => user.role === "personalTrainer")
                                                    .map((trainer) => (
                                                        <option key={trainer.id} value={trainer.id}>
                                                            {trainer.name}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}