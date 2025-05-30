"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { addDoc, collection, getDocs, serverTimestamp, Timestamp, query, where, doc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import dayjs from "dayjs";
import Navbar from "@/components/Navbar";
import { useCustomClaimRole } from "../../hooks/useCustomClaimRole";
import WorkoutForm from "@/components/WorkoutForm";
import BodyMetricModal from "@/components/BodyMetricModal";
import { toast } from "sonner";

// 類型定義
type GroupClass = {
    id: string;
    title: string;
    coach: string;
    date: string | Timestamp;
    startTime: string;
    endTime: string;
};

const weekDays = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];
const weekdayMap: { [key: string]: string } = {
    Monday: "星期一",
    Tuesday: "星期二",
    Wednesday: "星期三",
    Thursday: "星期四",
    Friday: "星期五",
    Saturday: "星期六",
    Sunday: "星期日",
};

export default function GroupClassesPage() {
    const [user, setUser] = useState<User | null>(null);
    const [classes, setClasses] = useState<GroupClass[]>([]);
    const [authLoading, setAuthLoading] = useState(true);
    const router = useRouter();
    const { role, loading: roleLoading } = useCustomClaimRole(user);
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [showMetricModal, setShowMetricModal] = useState(false);
    const [, setSelectedClassId] = useState<string | null>(null);
    const [bookedClassIds, setBookedClassIds] = useState<string[]>([]);


    const fetchBooking = async (userId: string) => {
        const q = query(
            collection(db, "groupBookings"),
            where("userId", "==", userId)
        );
        const snapshot = await getDocs(q);
        const ids = snapshot.docs.map(doc => doc.data().groupClassId);
        setBookedClassIds(ids);
    };
    // 初始化時載入 查詢預約紀錄
    useEffect(() => {
        if (user) {
            fetchBooking(user.uid)
        }
    }, [user]);

    // 登入驗證
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (!firebaseUser) {
                router.push("/") // 導回首頁
                return;
            }
            setUser(firebaseUser);
            setAuthLoading(false); // 登入成功設定 loading false
        });

        return () => unsubscribe();
    }, [router]);

    // 抓取課表資料
    useEffect(() => {
        const fetchData = async () => {
            const snapshot = await getDocs(collection(db, "groupSchedule"));
            const list: GroupClass[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<GroupClass, "id">),
            }));
            setClasses(list);
        };
        fetchData();
    }, []);
    // 取消課程函式
    const handleCancelBooking = async (groupClassId: string) => {
        if (!user) return;

        try {
            const q = query(
                collection(db, "groupBookings"),
                where("userId", "==", user.uid),
                where("groupClassId", "==", groupClassId)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                toast.error("無預約紀錄");
                return;
            }
            // 刪除所有符合條件的報名紀錄（保險處理）
            for (const docSnap of snapshot.docs) {
                await deleteDoc(doc(db, "groupBookings", docSnap.id));
            }

            toast.success("已取消預約");
            fetchBooking(user.uid); // ✅ 取消後即時更新狀態
        } catch (err) {
            toast.error("取消失敗：" + (err as Error).message);
        }

    };
    // 報名課程函式
    const handleBooking = async (groupClassId: string) => {
        if (!user) {
            toast.error("請先登入");
            return;
        }

        try {
            await addDoc(collection(db, "groupBookings"), {
                userId: user.uid,
                groupClassId,
                createdAt: serverTimestamp(),
            });
            toast.success("預約成功")
            setSelectedClassId(null); // 報名後關閉展開
            fetchBooking(user.uid);
        } catch (err) {
            console.error("預約失敗：", err);
            toast.error("預約失敗，請稍後再試" + (err as Error).message);
        }
    };

    const getDayClasses = (day: string) => {
        const filtered = classes.filter((item) => {
            const rawDate = item.date instanceof Timestamp ? item.date.toDate() : new Date(item.date);
            const classDay = dayjs(rawDate).format("dddd");
            return weekdayMap[classDay] === day;
        });
        return filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    // loading 畫面
    if (authLoading || roleLoading) {
        return (
            <div className="min-h-screen bg-black text-orange-400 flex justify-center items-center">
                <div className="animate-spin w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-lg">驗證中...</span>
            </div>
        );
    }

    return (
        <>
            <Navbar
                user={user ? { displayName: user.displayName } : undefined}
                setUser={setUser}
                authLoading={authLoading}
                role={role}
                roleLoading={roleLoading}
                onAddWorkout={() => setShowWorkoutModal(true)}
                onAddMetric={() => setShowMetricModal(true)}
            />

            {/* Modal 控制區塊 */}
            {showWorkoutModal && user && (
                <WorkoutForm user={user} onClose={() => setShowWorkoutModal(false)} onSaved={() => { }} />
            )}
            {showMetricModal && user?.uid && (
                <BodyMetricModal userId={user.uid} onClose={() => setShowMetricModal(false)} onSaved={() => { }} />
            )}

            <main className="min-h-screen bg-black text-white px-4 pt-20">
                <h1 className="text-3xl font-bold text-orange-400 mb-8 text-center">團體課程</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {weekDays.map((day) => (
                        <div key={day} className="bg-zinc-900 p-4 rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold text-orange-400 mb-4 text-center">{day}</h2>
                            <div className="space-y-4">
                                {getDayClasses(day).length === 0 && (
                                    <p className="text-zinc-500 text-sm text-center">當天沒有課程</p>
                                )}
                                {getDayClasses(day).map((item) => {
                                    const isBooked = bookedClassIds.includes(item.id);

                                    return (
                                        <div
                                            key={item.id}
                                            className="group relative bg-orange-500 text-white rounded-lg p-3 shadow hover:shadow-lg transition duration-200"
                                        >
                                            <div className="space-y-1">
                                                <div className="font-bold text-base">{item.title}</div>
                                                <div className="text-sm">{item.coach} 教練</div>
                                                <div className="text-sm">{item.startTime} - {item.endTime}</div>
                                            </div>

                                            <div
                                                className="absolute bottom-0 left-0 w-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto translate-y-4 group-hover:translate-y-0 bg-white text-orange-500 rounded-b-lg px-4 py-3 flex flex-col items-center transition-all duration-300 ease-in-out z-10"
                                            >
                                                {isBooked ? (
                                                    <>
                                                        <p className="text-sm mb-2">你已預約課程</p>
                                                        <button
                                                            onClick={() => handleCancelBooking(item.id)}
                                                            className="px-4 py-1 bg-white text-orange-500 font-semibold rounded border border-orange-500 hover:bg-orange-50 cursor-pointer"
                                                        >
                                                            取消預約
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-sm mb-2">確定要預約這堂課嗎？</p>
                                                        <button
                                                            onClick={() => handleBooking(item.id)}
                                                            className="px-4 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 cursor-pointer"
                                                        >
                                                            我要預約
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </>
    );
}