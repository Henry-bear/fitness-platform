"use client";

import { CircleAlert } from "lucide-react";
import ModalShell from "./ModalShell";

interface ConfirmDialogProps {
    open: boolean;
    title?: string;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    tone?: "primary" | "danger";
}

export default function ConfirmDialog({
    open,
    title = "確認動作",
    message,
    onCancel,
    onConfirm,
    confirmText = "確定",
    cancelText = "取消",
    tone = "danger",
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <ModalShell open={open} onClose={onCancel} title={title} icon={<CircleAlert className="h-5 w-5" />} titleId="confirm-dialog-title" maxWidth="sm">
                <p className="text-sm leading-6 text-zinc-400">{message}</p>
                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                    <button
                        onClick={onCancel}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${tone === "danger" ? "bg-red-500 hover:bg-red-400" : "bg-orange-500 hover:bg-orange-400"}`}
                    >
                        {confirmText}
                    </button>
                </div>
        </ModalShell>
    );
}
