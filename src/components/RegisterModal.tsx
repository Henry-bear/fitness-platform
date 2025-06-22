"use client";

import { useEffect, useState } from "react";
import RegisterForm from "./RegisterForm";

export default function RegisterModal({
    onClose,
    openLogin,
}: {
    onClose: () => void;
    openLogin: () => void;
}) {
    const [isVisible, setIsVisible] = useState(false);

    // 開啟動畫：component mount 後 50ms 開啟動畫
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // 點擊關閉時：先跑動畫，再觸發 onClose
    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300); // 等動畫結束
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
                    aria-label="關閉註冊視窗"
                >
                    &times;
                </button>

                {/* 傳入 onSuccess 給 RegisterForm */}
                <RegisterForm onSuccess={handleClose} />

                <p className="text-sm text-center text-zinc-400 mt-4">
                    已經有帳號了嗎？
                    <button
                        onClick={() => {
                            handleClose(); // 執行動畫
                            setTimeout(() => {
                                openLogin(); // 等動畫完成後再開啟登入 Modal
                            }, 300);
                        }}
                        className="text-orange-500 hover:underline ml-1"
                    >
                        點此登入
                    </button>
                </p>
            </div>
        </div>
    );
}
