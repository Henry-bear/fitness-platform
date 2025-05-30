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
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-12 p-6 bg-zinc-900 rounded shadow text-white">
            <h2 className="text-2xl font-bold mb-6 text-center text-orange-500">註冊帳號</h2>

            <div className="mb-4">
                <label className="block text-sm mb-1">姓名</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                    required />
            </div>
            <div className="mb-4">
                <label className="block text-sm mb-1">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                    required
                />
            </div>

            <div className="mb-6">
                <label className="block text-sm mb-1">密碼</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                    required
                />
            </div>

            <button
                type="submit"
                className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
                disabled={loading}
            >
                {loading ? "註冊中..." : "註冊"}
            </button>
        </form>
    );
}
