"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { View, Calendar, momentLocalizer, Event as RBCEvent } from "react-big-calendar";
import { addDoc, deleteDoc, query, where } from "firebase/firestore";
import { toast } from "sonner";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/styles/calendar.css";
import BookingModal from "@/app/dashboard/trainer/BookingModal";
import { auth, db } from "@/lib/firebase";
import { useCustomClaimRole } from "@/app/hooks/useCustomClaimRole";
import { collection, getDocs, getDoc, doc, updateDoc } from "firebase/firestore";
import ConfirmDialog from "@/components/ConfirmDialog";
import AttendanceDialog from "@/components/AttendanceDialog";
import { SlotInfo } from "react-big-calendar";
import { CalendarDays, CheckCircle2, MousePointerClick, Users } from "lucide-react";

// 型別：事件格式
type TrainerEvent = RBCEvent & {
    id: string;
    allDay: boolean;
    studentType: "experience" | "normal";
    studentId: string;
    isAttended: boolean;
};

type Student = {
    id: string;
    name: string;
    type: "experience" | "normal";
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
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<TrainerEvent | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // 判斷視窗大小 顯示 day or week
    useEffect(() => {
        if (typeof window !== "undefined") {
            const handleResize = () => setIsMobile(window.innerWidth < 640);
            handleResize(); // 初始檢查一次
            window.addEventListener("resize", handleResize);
            return () => window.removeEventListener("resize", handleResize);
        }
    }, []);

    useEffect(() => {
        setCurrentView(isMobile ? "day" : "week");
    }, [isMobile]);

    // 權限檢查
    useEffect(() => {
        if (!loading && !roleLoading) {
            if (!user || role !== "personalTrainer") {
                router.replace("/");
            }
        }
    }, [user, loading, role, roleLoading, router]);

    // 讀取學生姓名函式
    const getStudentName = async (studentId: string, studentType: "normal" | "experience"): Promise<string> => {
        try {
            const userDoc = await getDoc(doc(db, "users", studentId));
            const fallback = studentType === "experience" ? "體驗學生" : "學生";
            return userDoc.exists() ? userDoc.data().name || fallback : fallback;
        } catch (err) {
            console.warn("取得學生名稱失敗", err);
            return "未知學生";
        }
    };

    // 載入會員名單
    useEffect(() => {
        const fetchStudents = async () => {
            if (!user?.uid) return;

            if (role !== "personalTrainer") return;

            const userSnap = await getDocs(query(
                collection(db, "users"),
                where("assignedTrainerId", "==", user.uid),
                where("isFormalMember", "==", true)
            ));
            const bookingSnap = await getDocs(query(
                collection(db, "experienceBookings"),
                where("assignedTrainerId", "==", user.uid)
            ));

            const normal = userSnap.docs
                .map(doc => ({
                    id: doc.id,
                    name: doc.data().name || "未命名",
                    type: "normal" as const,
                }));

            // 正式會員 id 存放
            const formalIds = new Set(normal.map(s => s.id));

            const experience = bookingSnap.docs
                .filter(doc =>
                    ["assigned", "contacted", "attended"].includes(doc.data().status) &&
                    !formalIds.has(doc.data().userId) // 過濾已升級的
                )
                .map(doc => ({
                    id: doc.data().userId,
                    name: doc.data().userName || "體驗學生",
                    type: "experience" as const,
                }));

            setStudents([...normal, ...experience]);
        };

        fetchStudents();
    }, [user, role]);

    // 載入課表資料
    useEffect(() => {
        const fetchEvents = async () => {
            if (!user || role !== "personalTrainer") return;

            try {
                const snap = await getDocs(query(
                    collection(db, "privateSchedule"),
                    where("trainerId", "==", user.uid)
                ));

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
                        const typePrefix = data.studentType === "experience" ? "體驗" : "學生";

                        return {
                            id: docSnap.id,
                            title: `${typePrefix} ${studentName}`,
                            start: new Date(`${data.date}T${data.startTime}`),
                            end: new Date(`${data.date}T${data.endTime}`),
                            allDay: false,
                            studentType: data.studentType === "experience" ? "experience" : "normal",
                            studentId: data.studentId,
                            isAttended: data.isAttended,
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

    // 扣堂數 + 簽到函式
    const handleMarkAsAttended = async (event: TrainerEvent | null) => {
        if (!event || !user) return;

        try {
            // 更新 privateSchedule 的 isAttended 為 true
            await updateDoc(doc(db, "privateSchedule", event.id), {
                isAttended: true,
            });

            // 4️⃣ 若是正式會員 → 查詢其剩餘堂數並扣 1
            if (event.studentType === "normal") {
                const studentRef = doc(db, "users", event.studentId);
                const studentSnap = await getDoc(studentRef);
                const remaining = studentSnap.data()?.remainingSessions ?? 0;

                if (remaining > 0) {
                    await updateDoc(studentRef, {
                        remainingSessions: remaining - 1,
                    });
                }
            }

            toast.success("已標記為上課並更新剩餘堂數");
            setShowAttendanceDialog(false);
            setSelectedEvent(null);

            // 重新讀取課表資料（刷新 events）
            const updatedSnap = await getDocs(query(
                collection(db, "privateSchedule"),
                where("trainerId", "==", user.uid)
            ));

            const eventsData: TrainerEvent[] = await Promise.all(
                updatedSnap.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    const studentName = await getStudentName(data.studentId, data.studentType);
                    const typePrefix = data.studentType === "experience" ? "體驗" : "學生";

                    return {
                        id: docSnap.id,
                        title: `${typePrefix} ${studentName}`,
                        start: new Date(`${data.date}T${data.startTime}`),
                        end: new Date(`${data.date}T${data.endTime}`),
                        allDay: false,
                        studentType: data.studentType,
                        studentId: data.studentId,
                        isAttended: data.isAttended,
                    };
                })
            );

            setEvents(eventsData);
        } catch (err) {
            console.error("標記為已上課失敗", err);
            toast.error("標記失敗");
        }
    };


    // 預約課程函式
    const handleConfirmBooking = async (studentId: string, studentType: "normal" | "experience") => {
        if (!user || !selectedSlot) return;

        const start = new Date(selectedSlot.start);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 小時

        // Calendar slots are local time. Converting to ISO first would shift
        // early-morning selections to the previous UTC date in Asia/Taipei.
        const dateStr = moment(start).format("YYYY-MM-DD");
        const startTime = start.toTimeString().slice(0, 5);
        const endTime = end.toTimeString().slice(0, 5);

        try {
            // 預先檢查堂數是否足夠
            if (studentType === "normal") {
                const studentRef = doc(db, "users", studentId);
                const studentSnap = await getDoc(studentRef);
                const remaining = studentSnap.data()?.remainingSessions ?? 0;

                if (remaining <= 0) {
                    toast.error("堂數不足，無法預約");
                    return;
                }
            }

            await addDoc(collection(db, "privateSchedule"), {
                trainerId: user.uid,
                studentId,
                studentType,
                date: dateStr,
                startTime,
                endTime,
                isAttended: false,
            });

            toast.success("預約成功！");
            setShowModal(false);
            setSelectedSlot(null);

            // 重新載入資料
            const updatedSnap = await getDocs(query(
                collection(db, "privateSchedule"),
                where("trainerId", "==", user.uid)
            ));
            const eventsData: TrainerEvent[] = await Promise.all(
                updatedSnap.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    const studentName = await getStudentName(data.studentId, data.studentType);
                    const typePrefix = data.studentType === "experience" ? "體驗" : "學生";

                    return {
                        id: docSnap.id,
                        title: `${typePrefix} ${studentName}`,
                        start: new Date(`${data.date}T${data.startTime}`),
                        end: new Date(`${data.date}T${data.endTime}`),
                        allDay: false,
                        studentType: data.studentType,
                        studentId: data.studentId,
                        isAttended: data.isAttended,
                    };
                })
            );
            setEvents(eventsData);
        } catch (error) {
            toast.error("建立預約失敗");
            console.error(error);
        }
    };

    // 刪除預約課程函式
    const handleDeleteBooking = async () => {
        if (!user || !selectedEvent) return;

        try {
            await deleteDoc(doc(db, "privateSchedule", selectedEvent.id));
            toast.success("預約已取消");

            // 重新載入事件
            const updatedSnap = await getDocs(query(
                collection(db, "privateSchedule"),
                where("trainerId", "==", user.uid)
            ));

            const eventsData = await Promise.all(updatedSnap.docs.map(async (docSnap) => {
                const data = docSnap.data();
                const studentName = await getStudentName(data.studentId, data.studentType);
                const typePrefix = data.studentType === "experience" ? "體驗" : "學生";

                return {
                    id: docSnap.id,
                    title: `${typePrefix} ${studentName}`,
                    start: new Date(`${data.date}T${data.startTime}`),
                    end: new Date(`${data.date}T${data.endTime}`),
                    allDay: false,
                    studentType: data.studentType,
                    studentId: data.studentId,
                    isAttended: data.isAttended,
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

    const upcomingCount = events.filter((event) => event.start && event.start >= new Date()).length;
    const attendedCount = events.filter((event) => event.isAttended).length;

    return (
        <div className="mx-auto max-w-7xl text-white">
            <div className="mb-6">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-400"><CalendarDays className="h-4 w-4" />教練工作台</div>
                <h1 className="text-2xl font-bold">私人教練課表</h1>
                <p className="mt-1 text-sm text-zinc-400">安排學生時段、完成簽到並追蹤授課進度</p>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 backdrop-blur-md"><div className="flex items-center gap-2 text-xs text-zinc-500"><CalendarDays className="h-4 w-4 text-orange-400" />待授課</div><p className="mt-2 text-2xl font-bold">{upcomingCount}<span className="ml-1 text-sm font-normal text-zinc-500">堂</span></p></div>
                <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 backdrop-blur-md"><div className="flex items-center gap-2 text-xs text-zinc-500"><CheckCircle2 className="h-4 w-4 text-emerald-400" />已完成</div><p className="mt-2 text-2xl font-bold">{attendedCount}<span className="ml-1 text-sm font-normal text-zinc-500">堂</span></p></div>
                <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 backdrop-blur-md"><div className="flex items-center gap-2 text-xs text-zinc-500"><Users className="h-4 w-4 text-blue-400" />可排課學生</div><p className="mt-2 text-2xl font-bold">{students.length}<span className="ml-1 text-sm font-normal text-zinc-500">位</span></p></div>
            </div>

            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-400">
                <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                <span>點選空白時段建立預約；點選既有課程可進行簽到或取消。</span>
            </div>

            <div className="trainer-calendar overflow-x-auto rounded-3xl border border-white/10 bg-zinc-950/65 p-3 shadow-2xl shadow-black/25 backdrop-blur-md sm:p-5">
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
                    style={{ height: 650 }}
                    toolbar={true}
                    popup={true}
                    longPressThreshold={100}
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
                        if (slotInfo.start < new Date()) {
                            toast.error("無法預約過期日期");
                            return;
                        }
                        setSelectedSlot(slotInfo);
                        setShowModal(true);
                    }}
                    onSelectEvent={(event) => {
                        if (event.isAttended) {
                            toast.error("此課程已簽到，無法取消！");
                            return;
                        }
                        setShowAttendanceDialog(true);   // 未簽到 → 出現簽到選項
                        setSelectedEvent(event);
                    }}
                    eventPropGetter={(event: TrainerEvent) => {
                        let className = "event-normal";

                        if (event.studentType === "experience") {
                            className = "event-experience";
                        }

                        if (event.isAttended) {
                            className += " attended";
                        }

                        return { className };
                    }}
                />
                {showModal && selectedSlot && (
                    <BookingModal
                        open={showModal}
                        onClose={() => setShowModal(false)}
                        onConfirm={handleConfirmBooking}
                        students={students}
                        slotInfo={selectedSlot}
                    />
                )}
                <ConfirmDialog
                    open={showConfirmDialog}
                    title="取消預約"
                    message={`確定要取消 ${selectedEvent?.title} 的課程嗎？`}
                    onCancel={() => setShowConfirmDialog(false)}
                    onConfirm={handleDeleteBooking}
                />
                <AttendanceDialog
                    open={showAttendanceDialog}
                    event={
                        selectedEvent
                            ? {
                                id: selectedEvent.id,
                                title: typeof selectedEvent.title === "string"
                                    ? selectedEvent.title
                                    : String(selectedEvent.title),
                                start: selectedEvent.start!,
                                end: selectedEvent.end!,
                                studentType: selectedEvent.studentType,
                                studentId: selectedEvent.studentId,
                            }
                            : null
                    }
                    onClose={() => setShowAttendanceDialog(false)}
                    onConfirm={() => handleMarkAsAttended(selectedEvent)}
                    onCancelBooking={() => handleDeleteBooking()}
                />
            </div>
        </div>
    );
}
