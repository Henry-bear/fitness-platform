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
    plugins,
    scales,
    Ticks,
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
}

export default function BodyMetricChart({ userId }: Props) {
    const [dataPoints, setDataPoints] = useState<
        { date: string; height: number; weight: number; bodyFat: number }[]
    >([]);
    //  state 控制各個 dataset 顯示
    const [showHeight, setShowHeight] = useState(true);
    const [showWeight, setShowWeight] = useState(true);
    const [showBodyFat, setShowBodyFat] = useState(true);

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
            setDataPoints(points);
        }
        fetchData();
    }, [userId]);


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