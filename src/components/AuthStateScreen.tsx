"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function AuthStateScreen({
    error,
    onRetry,
    message = "正在確認登入狀態...",
}: {
    error?: string | null;
    onRetry?: () => void;
    message?: string;
}) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#070809] px-5 text-white">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950/80 p-7 text-center shadow-2xl shadow-black/40 backdrop-blur-xl">
                {error ? (
                    <AlertCircle className="mx-auto h-9 w-9 text-amber-400" />
                ) : (
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                )}
                <p className="mt-4 font-medium text-zinc-200">{error || message}</p>
                {error && onRetry && (
                    <button type="button" onClick={onRetry} className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-orange-400">
                        <RefreshCw className="h-4 w-4" />重新載入
                    </button>
                )}
            </div>
        </main>
    );
}
