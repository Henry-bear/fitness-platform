"use client";

import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AnimatePresence, motion } from "framer-motion";
import { LockKeyhole, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
    open: boolean;
    onClose: () => void;
    onVerified: () => void;
};

export default function PrivacyUnlockDialog({ open, onClose, onVerified }: Props) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleVerify = async (event: React.FormEvent) => {
        event.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser?.email) {
            toast.error("無法確認目前管理員帳號");
            return;
        }

        setLoading(true);
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, password);
            await reauthenticateWithCredential(currentUser, credential);
            onVerified();
            setPassword("");
            toast.success("身分驗證成功，Email 將顯示 5 分鐘");
            onClose();
        } catch {
            toast.error("密碼錯誤，無法顯示 Email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="privacy-unlock-title"
                >
                    <motion.form
                        onSubmit={handleVerify}
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 340, damping: 28 }}
                        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl shadow-black/60"
                    >
                        <button type="button" onClick={onClose} aria-label="關閉身分驗證" className="absolute right-4 top-4 rounded-full p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400"><ShieldCheck className="h-6 w-6" /></div>
                        <h2 id="privacy-unlock-title" className="text-xl font-bold">驗證管理員身分</h2>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">會員 Email 屬於敏感資料。請再次輸入目前管理員密碼，解鎖後會在 5 分鐘後自動遮蔽。</p>
                        <label htmlFor="privacy-password" className="mt-5 block text-sm font-medium text-zinc-300">管理員密碼</label>
                        <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 focus-within:border-orange-500/70 focus-within:ring-2 focus-within:ring-orange-500/15">
                            <LockKeyhole className="h-4 w-4 text-zinc-500" />
                            <input id="privacy-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 text-white outline-none placeholder:text-zinc-700" placeholder="輸入密碼" required />
                        </div>
                        <button type="submit" disabled={loading} className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-400 disabled:opacity-50">{loading ? "驗證中..." : "驗證並顯示 Email"}</button>
                    </motion.form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
