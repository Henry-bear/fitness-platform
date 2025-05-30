"use client";

import { ReactNode } from "react";

interface ConfirmDialogProps {
    open: boolean;
    title?: string;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmDialog({
    open,
    title = "確認動作",
    message,
    onCancel,
    onConfirm,
    confirmText = "確定",
    cancelText = "取消",
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                <h2 className="text-lg font-semibold mb-3 text-zinc-800">{title}</h2>
                <p className="text-sm text-zinc-700 mb-5">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-1 rounded text-sm bg-zinc-300 text-zinc-700 hover:bg-zinc-400 cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-1 rounded text-sm bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
