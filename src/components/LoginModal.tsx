"use client";

import LoginForm from "./LoginForm";
import ModalShell from "./ModalShell";
import { LogIn } from "lucide-react";

export default function LoginModal({
    onClose,
    openRegister, }: {
        onClose: () => void;
        openRegister: () => void;
    }) {
    return (
        <ModalShell open onClose={onClose} title="會員登入" description="登入後繼續追蹤訓練與身體數據" icon={<LogIn className="h-5 w-5" />} titleId="login-title">
                <LoginForm />
                <p className="mt-5 text-center text-sm text-zinc-400">
                    還沒有帳號嗎？
                    <button
                        onClick={() => {
                            onClose();
                            window.setTimeout(openRegister, 180);
                        }}
                        className="ml-1 font-medium text-orange-400 transition hover:text-orange-300"
                    >
                        點此註冊
                    </button>
                </p>
        </ModalShell>
    );
}
