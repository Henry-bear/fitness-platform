"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { browserLocalPersistence, setPersistence } from "firebase/auth";

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
        setLoading(true);

        try {
            // 呼叫 firebase 登入方法 (setPersistence 保留 session)
            await setPersistence(auth, browserLocalPersistence);
            await signInWithEmailAndPassword(auth, email, password);

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
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-12 p-6 bg-zinc-900 rounded shadow text-white">
            <h2 className="text-2xl font-bold mb-6 text-center text-orange-500">會員登入</h2>
            {/* Email 欄位 */}
            <div className="mb-4">
                <label className="block text-sm mb-1">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
                    required
                />
            </div>

            {/* 密碼欄位 */}
            <div className="mb-6">
                <label className="block text-sm mb-1">密碼</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
                    required
                />
            </div>

            {/* 登入按鈕 */}
            <button
                type="submit"
                className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition disabled:opacity-50 cursor-pointer"
                disabled={loading}
            >
                {loading ? "登入中..." : "登入"}
            </button>
        </form>
    );
}