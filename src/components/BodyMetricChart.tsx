"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    ChartOptions,
    ChartData
} from "chart.js";


ChartJS.register(
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend
);

type Props = {
    userId: string;
    refreshTrigger: number;
}

export default function BodyMetricChart({ userId, refreshTrigger }: Props) {
    const [dataPoints, setDataPoints] = useState<
        { date: string; height: number; weight: number; bodyFat: number }[]
    >([]);
    //  state 控制各個 dataset 顯示
    const [showHeight, setShowHeight] = useState(true);
    const [showWeight, setShowWeight] = useState(true);
    const [showBodyFat, setShowBodyFat] = useState(true);
    const [maxPoints, setMaxPoints] = useState(7)  //預設顯示 7 筆資料（一週）

    useEffect(() => {
        async function fetchData() {
            const snapshot = await getDocs(collection(db, "users", userId, "bodyMetrics"));
            const points = snapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    date: d.createdAt?.toDate().toLocaleDateString() || "未知",
                    height: Number(d.height),
                    weight: Number(d.weight),
                    bodyFat: Number(d.bodyFat),
                };
            });
            const sorted = points.sort((a, b) => (a.date > b.date ? 1 : -1)); // 舊>新
            const limited = sorted.slice(-maxPoints);
            setDataPoints(limited);
        }
        fetchData();
    }, [userId, maxPoints, refreshTrigger]);


    // 過濾後的 datasets（避免 TS 錯誤）
    const datasets = [
        showHeight
            ? {
                label: "身高(cm)",
                data: dataPoints.map(p => p.height),
                borderColor: "#FFA042",
                backgroundColor: "#FFA042",
            }
            : null,
        showWeight
            ? {
                label: "體重(kg)",
                data: dataPoints.map(p => p.weight),
                borderColor: "#f97316",
                backgroundColor: "#f97316",
            }
            : null,
        showBodyFat
            ? {
                label: "體脂(%)",
                data: dataPoints.map(p => p.bodyFat),
                borderColor: "#eab308",
                backgroundColor: "#eab308",
            }
            : null,
    ].filter((d): d is NonNullable<typeof d> => d !== null); // 類型保護

    //  ChartData 型別
    const chartData: ChartData<"line"> = {
        labels: dataPoints.map(p => p.date),
        datasets,
    };

    const options: ChartOptions<"line"> = {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: "#fff"
                }
            }
        },
        scales: {
            x: {
                ticks: { color: "#fff" }
            },
            y: {
                ticks: { color: "#fff" }
            }
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">

            {/* Chart 區塊 */}
            <div className="bg-zinc-900 p-6 rounded-lg shadow border border-orange-500 w-full">
                <h3 className="text-white text-lg font-bold mb-4">身體數值變化圖表</h3>
                <div className="text-right text-white mb-2">
                    <label className="mr-2">顯示資料筆數：</label>
                    <select
                        value={maxPoints}
                        onChange={(e) => setMaxPoints(Number(e.target.value))}
                        className="bg-zinc-800 text-white px-2 py-1 rounded"
                    >
                        <option value={7}>7 筆</option>
                        <option value={14}>14 筆</option>
                        <option value={21}>21 筆</option>
                        <option value={28}>28 筆</option>
                    </select>
                </div>
                <Line data={chartData} options={options} />

                {/* Checkbox 控制 */}
                <div className="flex flex-wrap justify-end items-center gap-4 text-sm text-white mt-2 mb-3">
                    <label className="flex items-center space-x-1 hover:text-orange-400 transition">
                        <input
                            type="checkbox"
                            checked={showHeight}
                            onChange={() => setShowHeight(!showHeight)}
                            className="accent-orange-500"
                        />
                        <span>身高</span>
                    </label>
                    <label className="flex items-center space-x-1 hover:text-orange-400 transition">
                        <input
                            type="checkbox"
                            checked={showWeight}
                            onChange={() => setShowWeight(!showWeight)}
                            className="accent-orange-500"
                        />
                        <span>體重</span>
                    </label>
                    <label className="flex items-center space-x-1 hover:text-orange-400 transition">
                        <input
                            type="checkbox"
                            checked={showBodyFat}
                            onChange={() => setShowBodyFat(!showBodyFat)}
                            className="accent-orange-500"
                        />
                        <span>體脂</span>
                    </label>
                </div>
            </div>
        </div>
    );
}