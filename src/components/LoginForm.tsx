"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { browserLocalPersistence, setPersistence } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

export default function LoginForm() {
    const router = useRouter();

    // 使用者輸入欄位
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // UI 狀態
    const [loading, setLoading] = useState(false);

    // 表單處理函式
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const cleanEmail = normalizeEmail(email);
        if (!isValidEmail(cleanEmail)) {
            toast.error("請輸入有效的 Email");
            return;
        }
        setLoading(true);

        try {
            // 呼叫 firebase 登入方法 (setPersistence 保留 session)
            await setPersistence(auth, browserLocalPersistence);
            const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
            const profile = await getDoc(doc(db, "users", credential.user.uid));
            if (profile.data()?.requiresEmailVerification && !credential.user.emailVerified) {
                await signOut(auth);
                toast.error("請先至信箱完成 Email 驗證後再登入");
                return;
            }

            // 成功後顯示歡迎訊息
            toast.success("登入成功！")
            router.push("/member");

        } catch (error: unknown) {
            const authError = error as { code?: string };
            if (authError.code === "auth/invalid-credential") {
                toast.error("帳號或密碼錯誤，請重新確認");
            } else {
                toast.error("登入失敗，請稍後再試");
            }
        } finally {
            setLoading(false); // 登入成功or失敗都要恢復按鈕可點狀態
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-white">
            {/* Email 欄位 */}
            <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-zinc-300">Email</label>
                <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15"
                    required
                />
            </div>

            {/* 密碼欄位 */}
            <div>
                <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-zinc-300">密碼</label>
                <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15"
                    required
                />
            </div>

            {/* 登入按鈕 */}
            <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-950/40 transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:translate-y-0 disabled:opacity-50"
                disabled={loading}
            >
                {loading ? "登入中..." : "登入"}
            </button>
        </form>
    );
}
