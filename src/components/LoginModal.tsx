"use client";

import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";

export default function LoginModal({
    onClose,
    openRegister, }: {
        onClose: () => void;
        openRegister: () => void;
    }) {
    const [isVisible, setIsVisible] = useState(false);

    // 控制進場動畫
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // 點擊關閉時：先動畫，再關閉元件
    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(), 300);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[999] flex justify-center items-center">
            <div
                className={`
          bg-zinc-900 text-white rounded-lg shadow-lg w-full max-w-md p-6 relative
          transform transition-all duration-300
          ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
            >
                {/* 關閉按鈕 */}
                <button
                    onClick={handleClose}
                    className="absolute top-2 right-3 text-zinc-400 hover:text-white text-xl cursor-pointer"
                    aria-label="關閉登入視窗"
                >
                    &times;
                </button>

                {/* 傳入 onSuccess，登入成功後自動關閉 */}
                <LoginForm />
                <p className="text-sm text-center text-zinc-400 mt-4">
                    還沒有帳號嗎？
                    <button
                        onClick={() => {
                            handleClose(); // 關閉 LoginModal
                            setTimeout(() => {
                                openRegister();    // 再開啟註冊 Modal（延遲執行避免重疊動畫）
                            }, 300);             // 與關閉動畫時間一致
                        }}
                        className="text-orange-500 hover:underline ml-1"
                    >
                        點此註冊
                    </button>
                </p>
            </div>
        </div>
    );
}
