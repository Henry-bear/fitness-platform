"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { toast } from "sonner";
import { increment, orderBy, limit } from "firebase/firestore";

type Props = {
    open: boolean;
    onClose: () => void;
    student: {
        id: string;
        userId: string;
        userName: string;
        email: string;
    };
};

declare global {
    interface Window {
        TPDirect: {
            setupSDK: (
                appId: number,
                appKey: string,
                env: "sandbox" | "production"
            ) => void;
            card: {
                setup: (config: {
                    fields: {
                        number: { element: string; placeholder: string };
                        expirationDate: { element: string; placeholder: string };
                        ccv: { element: string; placeholder: string };
                    };
                    styles: Record<string, Record<string, string>>;
                }) => void;
                getTappayFieldsStatus: () => {
                    canGetPrime: boolean;
                };
                getPrime: (
                    callback: (result: {
                        status: number;
                        card: { prime: string };
                    }) => void
                ) => void;
            };
        };
        __tappayCardSetupDone?: boolean;
    }
}

interface PackOption {
    sessions: number;
    price: number;
}

export default function PurchaseModal({ open, onClose, student }: Props) {
    // 課程方案設定
    const packOptions: Record<"1" | "5" | "10", PackOption> = useMemo(() => ({
        "1": { sessions: 1, price: 2000 },
        "5": { sessions: 5, price: 9000 },
        "10": { sessions: 10, price: 16000 },
    }), []);
    const [selectedPack, setSelectedPack] = useState<"1" | "5" | "10">("10");
    const selectedPackData = packOptions[selectedPack];
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"select" | "payment">("select");
    const [orderId, setOrderId] = useState<string | null>(null);
    const hasRunRef = useRef(false);
    const toastShownRef = useRef(false); // 控制 toast 顯示

    // 檢查是否已有未付款訂單，若有直接跳轉付款步驟
    useEffect(() => {
        const checkExistingUnpaidOrder = async () => {
            if (!open || !student?.userId || hasRunRef.current) return;
            hasRunRef.current = true;

            try {
                const q = query(
                    collection(db, "orders"),
                    where("userId", "==", student.userId),
                    where("status", "==", "unpaid"),
                    orderBy("createdAt", "desc"),
                    limit(1)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const existingOrder = snap.docs[0];
                    const data = existingOrder.data();

                    setOrderId(existingOrder.id);
                    setStep("payment");

                    const matchedPack = Object.entries(packOptions).find(
                        ([, value]) => value.sessions === data.sessions
                    );
                    if (matchedPack) {
                        setSelectedPack(matchedPack[0] as "1" | "5" | "10");
                    }

                    if (!toastShownRef.current) {
                        toast.info("已載入未付款訂單，請繼續付款");
                        toastShownRef.current = true;
                    }
                } else {
                    setStep("select");
                }
            } catch (err) {
                console.error("檢查訂單錯誤", err);
            }
        };

        checkExistingUnpaidOrder();

        return () => {
            hasRunRef.current = false;
            toastShownRef.current = false;
        };
    }, [open, student?.userId, packOptions]);


    // TapPay 欄位初始化
    useEffect(() => {
        if (!open || step !== "payment") return;

        const waitForTPAndDOM = setInterval(() => {
            const cardNumber = document.getElementById("card-number");
            const expirationDate = document.getElementById("card-expiration-date");
            const ccv = document.getElementById("card-ccv");

            if (window.TPDirect && cardNumber && expirationDate && ccv && !window.__tappayCardSetupDone) {
                window.TPDirect.setupSDK(
                    159788,
                    "app_SzOeCRSskGQL7JrQKm3k904dN5pL0wJ9qLCAXfJY92UhroWNwn0Pg5fM82ej",
                    "sandbox"
                );

                window.TPDirect.card.setup({
                    fields: {
                        number: { element: "#card-number", placeholder: "**** **** **** ****" },
                        expirationDate: { element: "#card-expiration-date", placeholder: "MM / YY" },
                        ccv: { element: "#card-ccv", placeholder: "CCV" },
                    },
                    styles: {
                        input: { color: "black", "font-size": "14px" },
                        ".valid": { color: "green" },
                        ".invalid": { color: "red" },
                    },
                });

                window.__tappayCardSetupDone = true;
                clearInterval(waitForTPAndDOM);
            }
        }, 200);

        return () => {
            clearInterval(waitForTPAndDOM);
            window.__tappayCardSetupDone = false;
            ["card-number", "card-expiration-date", "card-ccv"].forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = "";
            });
        };
    }, [open, step]);

    // 建立訂單（狀態為 unpaid）
    const handleCreateOrder = async () => {
        try {
            setLoading(true);
            const orderRef = await addDoc(collection(db, "orders"), {
                userId: student.userId,
                userName: student.userName,
                sessions: selectedPackData.sessions,
                price: selectedPackData.price,
                status: "unpaid",
                createdAt: serverTimestamp(),
                assignedTrainerId: auth.currentUser?.uid,
            });

            setOrderId(orderRef.id);
            setStep("payment");
            toast.success("訂單建立成功，請繼續付款");
        } catch (error) {
            console.error("建立訂單失敗", error);
            toast.error("建立訂單失敗");
        } finally {
            setLoading(false);
        }
    };

    // 付款完成後更新訂單狀態 + 升級學生會員
    const handlePurchase = async () => {
        if (!window.TPDirect) {
            toast.error("尚未載入付款系統");
            return;
        }

        const tappayStatus = window.TPDirect.card.getTappayFieldsStatus();
        if (!tappayStatus.canGetPrime) {
            toast.error("請完整填寫卡號資訊");
            return;
        }

        setLoading(true);

        window.TPDirect.card.getPrime(async (result: { status: number; card: { prime: string } }) => {
            if (result.status !== 0) {
                toast.error("付款失敗，請檢查卡號");
                setLoading(false);
                return;
            }

            const prime = result.card.prime;

            try {
                // 1. 更新訂單狀態為已付款
                if (orderId) {
                    await updateDoc(doc(db, "orders", orderId), {
                        status: "paid",
                        tappayPrime: prime,
                        paidAt: serverTimestamp(),
                    });
                }

                // 2. 升級學生資訊
                await updateDoc(doc(db, "users", student.userId), {
                    isFormalMember: true,
                    assignedTrainerId: auth.currentUser?.uid,
                    remainingSessions: increment(selectedPackData.sessions),
                    totalPurchasedSessions: increment(selectedPackData.sessions),
                });

                toast.success(`${student.userName} 付款成功。`);
                handleClose();
            } catch (err) {
                console.error("付款過程錯誤", err);
                toast.error("付款成功但更新資料失敗");
            } finally {
                setLoading(false);
            }
        });
    };

    // 關閉 modal 並重置狀態
    const handleClose = () => {
        setStep("select");
        setOrderId(null);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg">
                <h2 className="text-xl font-bold text-orange-500 mb-4">
                    購買課程：{student.userName}
                </h2>
                <p className="text-sm text-gray-700 mb-2">Email：{student.email}</p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        選擇課程方案
                    </label>
                    <select
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
                        value={selectedPack}
                        onChange={(e) => setSelectedPack(e.target.value as "1" | "5" | "10")}
                    >
                        <option value="1">1 堂 - $2000</option>
                        <option value="5">5 堂 - $9000</option>
                        <option value="10">10 堂 - $16000</option>
                    </select>
                </div>

                {/* TapPay 欄位 */}
                {step === "payment" && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">卡號</label>
                            <div id="card-number" className="h-[44px] rounded border border-gray-300 bg-white"></div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">到期日</label>
                            <div id="card-expiration-date" className="h-[44px] rounded border border-gray-300 bg-white"></div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">CCV</label>
                            <div id="card-ccv" className="h-[44px] rounded border border-gray-300 bg-white"></div>
                        </div>
                    </>
                )}

                <div className="flex justify-end space-x-2 mt-4">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded"
                        disabled={loading}
                    >
                        取消
                    </button>

                    {step === "select" ? (
                        <button
                            onClick={handleCreateOrder}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                            disabled={loading}
                        >
                            {loading ? "建立中..." : "建立訂單"}
                        </button>
                    ) : (
                        <button
                            onClick={handlePurchase}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                            disabled={loading}
                        >
                            {loading ? "處理中..." : "立即付款"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
