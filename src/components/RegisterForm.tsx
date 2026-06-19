"use client";

import { useState } from "react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase"; // 引入 Auth 與 Firestore 初始化
import {
    createUserWithEmailAndPassword,
    UserCredential,
    updateProfile
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore"; // 寫入 Firestore

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
    // 狀態管理 （使用者輸入） 加上 TypeScript 型別
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    // 狀態管理（UI 顯示）
    const [loading, setLoading] = useState<boolean>(false);

    // 表單處理函式
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 建立 Firebase 使用者帳號 （Auth）
            const userCredential: UserCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            // 更新 Firebase 使用者的 displayName
            await updateProfile(user, { displayName: name });
            // 將資料寫入 Firestore 的 users/{uid}
            await setDoc(doc(db, "users", user.uid), {
                name,
                email,
                role: "member",
                isFormalMember: false, // 體驗會員
                remainingSessions: 0,  // 初始堂數為 0
                createdAt: serverTimestamp(),
            });

            toast.success(`註冊成功，歡迎你 ${name}！`);
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            }
        } catch (err: unknown) {
            const error = err as { code?: string };
            // 錯誤處理
            if (error.code === "auth/email-already-in-use") {
                toast.error("這個 Email 已經被註冊");
            } else if (error.code === "auth/invalid-email") {
                toast.error("Email 格式錯誤");
            } else if (error.code === "auth/weak-password") {
                toast.error("密碼至少 6 個字元");
            } else {
                toast.error("註冊失敗，請稍後再試");
                console.error("Firebase error:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-white">

            <div>
                <label htmlFor="register-name" className="mb-2 block text-sm font-medium text-zinc-300">姓名</label>
                <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15"
                    required />
            </div>
            <div>
                <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-zinc-300">Email</label>
                <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15"
                    required
                />
            </div>

            <div>
                <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-zinc-300">密碼</label>
                <input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15"
                    required
                />
            </div>

            <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-950/40 transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:translate-y-0 disabled:opacity-50"
                disabled={loading}
            >
                {loading ? "註冊中..." : "註冊"}
            </button>
        </form>
    );
}
