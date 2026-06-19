"use client";

import { useState } from "react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase"; // 引入 Auth 與 Firestore 初始化
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    UserCredential,
    updateProfile
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore"; // 寫入 Firestore
import { isStrongPassword, isValidDisplayName, isValidEmail, normalizeEmail } from "@/lib/validation";

const REGISTER_COOLDOWN_MS = 60_000;

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
    // 狀態管理 （使用者輸入） 加上 TypeScript 型別
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [website, setWebsite] = useState("");

    // 狀態管理（UI 顯示）
    const [loading, setLoading] = useState<boolean>(false);

    // 表單處理函式
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const cleanName = name.trim();
        const cleanEmail = normalizeEmail(email);

        if (website) return;
        if (!isValidDisplayName(cleanName)) {
            toast.error("姓名請輸入 2–40 個正常字元");
            return;
        }
        if (!isValidEmail(cleanEmail)) {
            toast.error("請輸入有效的 Email，例如 name@example.com");
            return;
        }
        if (!isStrongPassword(password)) {
            toast.error("密碼需為 8–72 字元，並同時包含英文字母與數字");
            return;
        }
        const lastAttempt = Number(window.localStorage.getItem("fitnessway-register-attempt") || 0);
        if (Date.now() - lastAttempt < REGISTER_COOLDOWN_MS) {
            toast.error("註冊操作過於頻繁，請稍後再試");
            return;
        }
        window.localStorage.setItem("fitnessway-register-attempt", String(Date.now()));
        setLoading(true);

        try {
            // 建立 Firebase 使用者帳號 （Auth）
            const userCredential: UserCredential = await createUserWithEmailAndPassword(
                auth,
                cleanEmail,
                password
            );
            const user = userCredential.user;

            // 更新 Firebase 使用者的 displayName
            await updateProfile(user, { displayName: cleanName });
            // 將資料寫入 Firestore 的 users/{uid}
            await setDoc(doc(db, "users", user.uid), {
                name: cleanName,
                email: cleanEmail,
                role: "member",
                isFormalMember: false, // 體驗會員
                remainingSessions: 0,  // 初始堂數為 0
                requiresEmailVerification: true,
                createdAt: serverTimestamp(),
            });

            await sendEmailVerification(user);
            await signOut(auth);
            toast.success("驗證信已寄出，完成 Email 驗證後即可登入");
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            }
        } catch (err: unknown) {
            if (auth.currentUser) await signOut(auth);
            const error = err as { code?: string };
            // 錯誤處理
            if (error.code === "auth/email-already-in-use") {
                toast.error("這個 Email 已經被註冊");
            } else if (error.code === "auth/invalid-email") {
                toast.error("Email 格式錯誤");
            } else if (error.code === "auth/weak-password") {
                toast.error("密碼強度不足");
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

            <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="register-website">Website</label>
                <input id="register-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
            </div>

            <div>
                <label htmlFor="register-name" className="mb-2 block text-sm font-medium text-zinc-300">姓名</label>
                <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    minLength={2}
                    maxLength={40}
                    autoComplete="name"
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
                    maxLength={254}
                    autoComplete="email"
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
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15"
                    required
                />
            </div>

            <p className="text-xs leading-5 text-zinc-500">密碼至少 8 個字元，需包含英文字母與數字。註冊後請先完成 Email 驗證。</p>

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
