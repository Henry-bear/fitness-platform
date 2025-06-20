"use client";

import React from "react";

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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 shadow-lg w-[90%] max-w-md">
                <h2 className="text-xl font-bold text-orange-500 mb-4">課程管理</h2>

                <div className="text-gray-700 mb-4">
                    <p><strong>學生：</strong>{event.title}</p>
                    <p><strong>日期：</strong>{formattedDate}</p>
                    <p><strong>時間：</strong>{formattedTime}</p>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancelBooking}
                        className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                    >
                        取消預約
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
                    >
                        確認已上課
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
}
