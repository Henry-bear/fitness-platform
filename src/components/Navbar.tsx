import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = {
    onLogin?: () => void;
    onRegister?: () => void;
    onLogout?: () => void;
    onAddMetric?: () => void;
    onAddWorkout?: () => void;
    user?: { displayName: string | null };
    setUser?: (user: null) => void; //讓 Navbar 可以清空使用者狀態
    authLoading?: boolean;
};

export default function Navbar({ onLogin, onRegister, onAddWorkout, onAddMetric, user, setUser, authLoading }: Props) {
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        if (setUser) setUser(null);
        toast.success("您已成功登出！");
        router.push("/");
    }
    return (
        <div className="relative z-10 flex justify-between items-center px-6 py-4">
            {/* 左側 Logo */}
            <Link href="/" className="text-3xl font-bold text-orange-400 cursor-pointer hover:opacity-80 transition">
                FitnessWay
            </Link>

            {/* 右側功能區 */}
            <div className="flex items-center space-x-6">
                {authLoading ? (
                    <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-orange-400 text-sm">載入中</span>
                    </div>
                ) : user ? (
                    <>
                        {/* 操作按鈕 */}
                        <button
                            onClick={onAddWorkout}
                            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 cursor-pointer"
                        >
                            訓練記錄
                        </button>

                        <button
                            onClick={onAddMetric}
                            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer"
                        >
                            數值記錄
                        </button>

                        {/* 使用者資訊區 */}
                        <div className="flex items-center space-x-2">
                            <Link
                                href="/member"
                                className="text-white font-medium hover:underline"
                            >
                                {user.displayName || "訪客"}
                            </Link>
                            {/* <img src="/avatar.png" className="w-6 h-6 rounded-full" alt="頭像" /> */}
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded cursor-pointer"
                            >
                                登出
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onLogin}
                                className="px-4 py-2 border border-orange-400 text-orange-400 hover:bg-orange-500 hover:text-white rounded transition"
                            >
                                登入
                            </button>
                            <button
                                onClick={onRegister}
                                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
                            >
                                註冊
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
