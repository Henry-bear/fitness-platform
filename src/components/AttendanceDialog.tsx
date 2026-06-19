"use client";

import React from "react";
import { CalendarCheck2, CalendarDays, Clock3, UserRound } from "lucide-react";
import ModalShell from "./ModalShell";

type AttendanceDialogProps = {
    open: boolean;
    event: {
        id: string;
        title: React.ReactNode;
        start: Date;
        end: Date;
        studentType: "experience" | "normal";
        studentId: string;
    } | null;
    onClose: () => void;
    onConfirm: () => void; // 確認已上課
    onCancelBooking: () => void; // 取消預約
};

export default function AttendanceDialog({
    open,
    event,
    onClose,
    onConfirm,
    onCancelBooking
}: AttendanceDialogProps) {
    if (!open || !event) return null;

    const formattedDate = event.start.toLocaleDateString();
    const formattedTime = `${event.start.toLocaleTimeString()} - ${event.end.toLocaleTimeString()}`;

    return (
        <ModalShell open={open} onClose={onClose} title="課程管理" description="確認學生出席狀態或取消這筆預約" icon={<CalendarCheck2 className="h-5 w-5" />} titleId="attendance-title">
                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
                    <p className="flex items-center gap-2"><UserRound className="h-4 w-4 text-orange-400" /><span className="text-zinc-500">學生</span>{event.title}</p>
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-orange-400" /><span className="text-zinc-500">日期</span>{formattedDate}</p>
                    <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-orange-400" /><span className="text-zinc-500">時間</span>{formattedTime}</p>
                </div>

                <div className="mt-6 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
                    <button
                        onClick={onCancelBooking}
                        className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-3 text-sm font-medium text-red-300 transition hover:bg-red-400/15"
                    >
                        取消預約
                    </button>
                    <button
                        onClick={onConfirm}
                        className="rounded-xl bg-emerald-500 px-3 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
                    >
                        確認已上課
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10"
                    >
                        關閉
                    </button>
                </div>
        </ModalShell>
    );
}
