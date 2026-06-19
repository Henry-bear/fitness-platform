"use client";

import { useEffect, useState } from "react";
import { SlotInfo } from "react-big-calendar";
import { CalendarPlus, Clock3 } from "lucide-react";
import ModalShell from "@/components/ModalShell";

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
        <ModalShell open={open} onClose={onClose} title="建立私人教練預約" description="選擇這個時段要安排的學生" icon={<CalendarPlus className="h-5 w-5" />} titleId="trainer-booking-title">
                <p className="mb-5 flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-zinc-300"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />{formattedTime}</p>

                {students.length === 0 ? (
                    <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">目前尚無可預約的學生</p>
                ) : (
                    <select
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className="mb-4 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15"
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

                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
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
                        className="rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:opacity-50"
                        disabled={students.length === 0}
                    >
                        確認預約
                    </button>
                </div>
        </ModalShell>
    );
}
