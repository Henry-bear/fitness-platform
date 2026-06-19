"use client";

import RegisterForm from "./RegisterForm";
import ModalShell from "./ModalShell";
import { UserPlus } from "lucide-react";

export default function RegisterModal({
    onClose,
    openLogin,
}: {
    onClose: () => void;
    openLogin: () => void;
}) {
    return (
        <ModalShell open onClose={onClose} title="建立會員帳號" description="開始記錄你的訓練進度與身體變化" icon={<UserPlus className="h-5 w-5" />} titleId="register-title">
                <RegisterForm onSuccess={onClose} />

                <p className="text-sm text-center text-zinc-400 mt-4">
                    已經有帳號了嗎？
                    <button
                        onClick={() => {
                            onClose();
                            window.setTimeout(openLogin, 180);
                        }}
                        className="ml-1 font-medium text-orange-400 transition hover:text-orange-300"
                    >
                        點此登入
                    </button>
                </p>
        </ModalShell>
    );
}
