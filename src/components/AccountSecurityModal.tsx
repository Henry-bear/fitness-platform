"use client";

import { FormEvent, useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword, User } from "firebase/auth";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { isStrongPassword } from "@/lib/validation";
import ModalShell from "./ModalShell";

export default function AccountSecurityModal({ user, onClose }: { user: User; onClose: () => void }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user.email) {
            toast.error("目前帳號沒有可用的 Email");
            return;
        }
        if (!isStrongPassword(newPassword)) {
            toast.error("新密碼需為 8–72 字元，並包含英文字母與數字");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("兩次輸入的新密碼不一致");
            return;
        }
        if (currentPassword === newPassword) {
            toast.error("新密碼不可與目前密碼相同");
            return;
        }

        setLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            await signOut(auth);
            onClose();
            toast.success("密碼已更新，請使用新密碼重新登入");
        } catch (error: unknown) {
            const code = (error as { code?: string }).code;
            if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
                toast.error("目前密碼不正確");
            } else if (code === "auth/too-many-requests") {
                toast.error("嘗試次數過多，請稍後再試");
            } else {
                toast.error("密碼更新失敗，請稍後再試");
            }
        } finally {
            setLoading(false);
        }
    };

    const inputType = showPasswords ? "text" : "password";

    return (
        <ModalShell open onClose={onClose} title="帳密管理" description="修改密碼前，先確認是你本人操作" icon={<KeyRound className="h-5 w-5" />} titleId="account-security-title">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="current-password" className="mb-2 block text-sm font-medium text-zinc-300">目前密碼</label>
                    <input id="current-password" type={inputType} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15" required />
                </div>
                <div>
                    <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-zinc-300">新密碼</label>
                    <input id="new-password" type={inputType} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} maxLength={72} autoComplete="new-password" className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15" required />
                </div>
                <div>
                    <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-zinc-300">再次輸入新密碼</label>
                    <input id="confirm-password" type={inputType} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} maxLength={72} autoComplete="new-password" className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15" required />
                </div>
                <button type="button" onClick={() => setShowPasswords((visible) => !visible)} className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 transition hover:text-white">
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showPasswords ? "隱藏密碼" : "顯示密碼"}
                </button>
                <p className="text-xs leading-5 text-zinc-500">新密碼至少 8 個字元，需同時包含英文字母與數字。更新後會自動登出。</p>
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-400 disabled:opacity-50">
                    {loading ? "更新中..." : "更新密碼"}
                </button>
            </form>
        </ModalShell>
    );
}
