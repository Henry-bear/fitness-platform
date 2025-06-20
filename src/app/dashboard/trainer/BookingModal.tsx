"use client";

import { useEffect, useState } from "react";
import { SlotInfo } from "react-big-calendar";

// Props mode: "experience" | "normal"
type Student = {
    id: string;
    name: string;
    type: "experience" | "normal";
};

type Props = {
    open: boolean;
    onClose: () => void;
    onConfirm: (studentId: string, type: "normal" | "experience") => void;
    students: Student[];
    slotInfo: SlotInfo;
};

export default function BookingModal({ open, onClose, onConfirm, students, slotInfo }: Props) {
    const [selectedStudent, setSelectedStudent] = useState("");

    useEffect(() => {
        if (students.length > 0) {
            setSelectedStudent(students[0].id);
        }
    }, [students]);

    if (!open || !slotInfo) return null;

    const formattedTime = `${slotInfo.start.toLocaleDateString()} ${slotInfo.start.toLocaleTimeString()} - ${slotInfo.end.toLocaleTimeString()}`;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-md w-[90%] max-w-md">
                <h2 className="text-xl font-bold text-orange-500 mb-4">
                    建立預約
                </h2>

                <p className="mb-2 text-gray-800">預約時間：{formattedTime}</p>

                {students.length === 0 ? (
                    <p className="text-red-600">目前尚無可預約的學生</p>
                ) : (
                    <select
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded mb-4 text-black"
                    >
                        <optgroup label="正式學員">
                            {students.filter(s => s.type === "normal").map((s) => (
                                <option key={`normal-${s.id}`} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </optgroup>
                        <optgroup label="體驗課會員">
                            {students.filter(s => s.type === "experience").map((s) => (
                                <option key={`exp-${s.id}`} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                )}

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
                    >
                        取消
                    </button>
                    <button
                        onClick={() => {
                            const student = students.find((s) => s.id === selectedStudent)
                            if (student) {
                                onConfirm(student.id, student.type)
                            };
                        }}
                        className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600"
                        disabled={students.length === 0}
                    >
                        確認預約
                    </button>
                </div>
            </div>
        </div>
    );
}