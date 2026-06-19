"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { toast } from "sonner";
import { increment } from "firebase/firestore";
import Script from "next/script";
import { CreditCard, ReceiptText, UserRound } from "lucide-react";
import ModalShell from "./ModalShell";

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
                    where("assignedTrainerId", "==", auth.currentUser?.uid)
                );
                const snap = await getDocs(q);
                const existingOrder = snap.docs
                    .filter((order) => {
                        const data = order.data();
                        return data.userId === student.userId && data.status === "unpaid";
                    })
                    .sort((a, b) => (b.data().createdAt?.toMillis?.() ?? 0) - (a.data().createdAt?.toMillis?.() ?? 0))[0];

                if (existingOrder) {
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
                        input: { color: "white", "font-size": "14px" },
                        ".valid": { color: "#86efac" },
                        ".invalid": { color: "#fca5a5" },
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

            try {
                // 1. 更新訂單狀態為已付款
                if (orderId) {
                    await updateDoc(doc(db, "orders", orderId), {
                        status: "paid",
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
        <>
            <Script
                src="https://js.tappaysdk.com/tpdirect/v5.1.0"
                strategy="afterInteractive"
            />
            <ModalShell open={open} onClose={handleClose} title={`購買課程 · ${student.userName}`} description="選擇課程堂數並完成付款" icon={<CreditCard className="h-5 w-5" />} titleId="purchase-title">
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-400"><UserRound className="h-4 w-4" /></div><div className="min-w-0"><p className="text-xs text-zinc-500">購課學員</p><p className="truncate text-sm text-zinc-300">{student.email}</p></div></div>

                <div className="mb-4">
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300"><ReceiptText className="h-4 w-4 text-orange-400" />
                        選擇課程方案
                    </label>
                    <select
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm text-white outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/15"
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
                            <label className="mb-2 block text-sm font-medium text-zinc-300">卡號</label>
                            <div id="card-number" className="h-[46px] rounded-xl border border-white/10 bg-zinc-900 px-3"></div>
                        </div>

                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-zinc-300">到期日</label>
                            <div id="card-expiration-date" className="h-[46px] rounded-xl border border-white/10 bg-zinc-900 px-3"></div>
                        </div>

                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-zinc-300">CCV</label>
                            <div id="card-ccv" className="h-[46px] rounded-xl border border-white/10 bg-zinc-900 px-3"></div>
                        </div>
                    </>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                    <button
                        onClick={handleClose}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                        disabled={loading}
                    >
                        取消
                    </button>

                    {step === "select" ? (
                        <button
                            onClick={handleCreateOrder}
                            className="rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "建立中..." : "建立訂單"}
                        </button>
                    ) : (
                        <button
                            onClick={handlePurchase}
                            className="rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "處理中..." : "立即付款"}
                        </button>
                    )}
                </div>
            </ModalShell>
        </>
    );
}
