"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { View, Calendar, momentLocalizer, Event as RBCEvent } from "react-big-calendar";
import { addDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/styles/calendar.css";
import BookingModal from "@/app/dashboard/trainer/BookingModal";
import { auth, db } from "@/lib/firebase";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import ConfirmDialog from "@/components/ConfirmDialog";
import { SlotInfo } from "react-big-calendar";

// 型別：事件格式
type TrainerEvent = RBCEvent & {
    id: string;
    allDay: boolean;
};

const localizer = momentLocalizer(moment);

export default function TrainerDashboardPage() {
    const [user, loading] = useAuthState(auth);
    const { role, loading: roleLoading } = useCustomClaimRole(user ?? null);
    const router = useRouter();
    const [events, setEvents] = useState<TrainerEvent[]>([]);
    const [currentView, setCurrentView] = useState<View>("week");
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<TrainerEvent | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // 權限檢查
    useEffect(() => {
        if (!loading && !roleLoading) {
            if (!user || role !== "personalTrainer") {
                router.replace("/");
            }
        }
    }, [user, loading, role, roleLoading, router]);

    // 載入專屬教練的學生清單
    useEffect(() => {
        const fetchStudents = async () => {
            const snap = await getDocs(collection(db, "users"));
            const filtered = snap.docs
                .filter(doc => doc.data().assignedTrainerId === user?.uid)
                .map(doc => ({
                    id: doc.id,
                    name: doc.data().name || "未命名",
                }));
            setStudents(filtered);
        };

        if (user?.uid && role === "personalTrainer") fetchStudents();
    }, [user, role]);

    // 載入課表資料
    useEffect(() => {
        const fetchEvents = async () => {
            if (!user || role !== "personalTrainer") return;

            try {
                const snap = await getDocs(collection(db, "users", user.uid, "privateSchedule"));

                const eventsData: TrainerEvent[] = await Promise.all(
                    snap.docs.map(async (docSnap) => {
                        const data = docSnap.data();
                        let studentName = data.studentId;

                        try {
                            const studentDoc = await getDoc(doc(db, "users", data.studentId));
                            if (studentDoc.exists()) {
                                const studentData = studentDoc.data();
                                studentName = studentData.name || data.studentId;
                            }
                        } catch (e) {
                            console.warn("讀取學生資料失敗", e);
                        }

                        return {
                            id: docSnap.id,
                            title: `學生 ${studentName}`,
                            start: new Date(`${data.date}T${data.startTime}`),
                            end: new Date(`${data.date}T${data.endTime}`),
                            allDay: false,
                        };
                    })
                );

                setEvents(eventsData);
            } catch (error) {
                console.error("讀取排課失敗", error);
            }
        };

        fetchEvents();
    }, [user, role]);


    // 預約教練課函式
    const handleConfirmBooking = async (studentId: string) => {
        if (!user || !selectedSlot) return;

        const start = new Date(selectedSlot.start);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 小時

        const dateStr = start.toISOString().split("T")[0];
        const startTime = start.toTimeString().slice(0, 5);
        const endTime = end.toTimeString().slice(0, 5);

        try {
            await addDoc(collection(db, "users", user.uid, "privateSchedule"), {
                studentId,
                date: dateStr,
                startTime,
                endTime,
            });

            toast.success("預約成功！");
            setShowModal(false);
            setSelectedSlot(null);

            // 重新載入資料
            const updatedSnap = await getDocs(collection(db, "users", user.uid, "privateSchedule"));
            const eventsData: TrainerEvent[] = await Promise.all(
                updatedSnap.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    let studentName = data.studentId;
                    try {
                        const studentDoc = await getDoc(doc(db, "users", data.studentId));
                        if (studentDoc.exists()) {
                            studentName = studentDoc.data().name || data.studentId;
                        }
                    } catch { }
                    return {
                        id: docSnap.id,
                        title: `學生 ${studentName}`,
                        start: new Date(`${data.date}T${data.startTime}`),
                        end: new Date(`${data.date}T${data.endTime}`),
                        allDay: false,
                    };
                })
            );
            setEvents(eventsData);
        } catch (error) {
            toast.error("建立預約失敗");
            console.error(error);
        }
    };

    // 刪除預約函式
    const handleDeleteBooking = async () => {
        if (!user || !selectedEvent) return;

        try {
            await deleteDoc(doc(db, "users", user.uid, "privateSchedule", selectedEvent.id));
            toast.success("預約已取消");

            // 更新事件列表
            const updatedSnap = await getDocs(collection(db, "users", user.uid, "privateSchedule"));
            const eventsData = await Promise.all(updatedSnap.docs.map(async (docSnap) => {
                const data = docSnap.data();
                let studentName = data.studentId;
                try {
                    const studentDoc = await getDoc(doc(db, "users", data.studentId));
                    if (studentDoc.exists()) {
                        studentName = studentDoc.data().name || data.studentId;
                    }
                } catch (err) {
                    console.error(err);
                }
                return {
                    id: docSnap.id,
                    title: `學生 ${studentName}`,
                    start: new Date(`${data.date}T${data.startTime}`),
                    end: new Date(`${data.date}T${data.endTime}`),
                    allDay: false,
                };
            }));
            setEvents(eventsData);
            setShowConfirmDialog(false);
            setSelectedEvent(null);
        } catch {
            toast.error("取消失敗");
        }
    };

    // loading 中先不渲染
    if (loading || roleLoading || !user || role !== "personalTrainer") return null;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-orange-500 mb-4">我的教練課表</h1>

            <div className="bg-white p-4 rounded shadow border border-orange-300">
                <Calendar
                    key={events.length}
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    view={currentView}
                    onView={(view) => setCurrentView(view)}
                    date={currentDate}
                    onNavigate={(date) => setCurrentDate(date)}
                    views={["week", "day"]}
                    style={{ height: 600 }}
                    toolbar={true}
                    min={new Date(1970, 0, 1, 8, 0)}
                    max={new Date(1970, 0, 1, 23, 0)}
                    messages={{
                        week: "本週課表",
                        today: "今天",
                        previous: "←",
                        next: "→",
                        day: "日",
                    }}
                    step={60}         // 一格 60 分鐘
                    timeslots={1}     // step 只切 1 次
                    slotPropGetter={() => ({
                        style: {
                            minHeight: "70px", // 增加格子高度
                        },
                    })}
                    selectable
                    onSelectSlot={(slotInfo) => {
                        setSelectedSlot(slotInfo);
                        setShowModal(true);
                    }}
                    onSelectEvent={(event) => {
                        setSelectedEvent(event);
                        setShowConfirmDialog(true);
                    }}
                />
                <BookingModal
                    open={showModal}
                    onClose={() => setShowModal(false)}
                    onConfirm={handleConfirmBooking}
                    students={students}
                    slotInfo={selectedSlot}
                />
                <ConfirmDialog
                    open={showConfirmDialog}
                    title="取消預約"
                    message={`確定要取消 ${selectedEvent?.title} 的課程嗎？`}
                    onCancel={() => setShowConfirmDialog(false)}
                    onConfirm={handleDeleteBooking}
                />
            </div>
        </div>
    );
}