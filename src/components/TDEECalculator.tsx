"use client";

import React, { useState } from "react";

export default function TDEECalculator() {
    const [gender, setGender] = useState("male");
    const [age, setAge] = useState(18);
    const [height, setHeight] = useState(170);
    const [weight, setWeight] = useState(65);
    const [activity, setActivity] = useState(1.2);
    const [tdee, setTdee] = useState<number | null>(null);

    const handleCalculate = () => {
        const bmr =
            gender === "male"
                ? 10 * weight + 6.25 * height - 5 * age + 5
                : 10 * weight + 6.25 * height - 5 * age - 161;
        const total = Math.round(bmr * activity);
        setTdee(total);
    };

    return (
        <div className=" text-white">
            <div className="max-w-xl mx-auto mt-10 border border-orange-500 rounded-2xl shadow-lg p-6">
                <h1 className="text-2xl font-bold text-orange-400 mb-6 text-center">
                    TDEE 計算機
                </h1>
                <div className="space-y-4">
                    <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full text-white border border-orange-400 p-2 rounded"
                    >
                        <option value="male">男性</option>
                        <option value="female">女性</option>
                    </select>
                    <input
                        type="number"
                        placeholder="年齡"
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full bg-zinc-800 text-white border border-orange-400 p-2 rounded"
                    />
                    <input
                        type="number"
                        placeholder="身高 (cm)"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full bg-zinc-800 text-white border border-orange-400 p-2 rounded"
                    />
                    <input
                        type="number"
                        placeholder="體重 (kg)"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full bg-zinc-800 text-white border border-orange-400 p-2 rounded"
                    />
                    <select
                        value={activity}
                        onChange={(e) => setActivity(Number(e.target.value))}
                        className="w-full bg-zinc-800 text-white border border-orange-400 p-2 rounded"
                    >
                        <option value={1.2}>久坐（幾乎沒有運動）</option>
                        <option value={1.375}>輕度活動（每週1–3天）</option>
                        <option value={1.55}>中度活動（每週3–5天）</option>
                        <option value={1.725}>高度活動（每週6–7天）</option>
                        <option value={1.9}>非常高（每天運動+體力勞動）</option>
                    </select>
                    <button
                        onClick={handleCalculate}
                        className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 font-semibold"
                    >
                        計算 TDEE
                    </button>
                </div>

                {tdee && (
                    <div className="mt-6 bg-zinc-800 p-4 rounded text-white border border-orange-500">
                        <p className="font-semibold text-lg text-center text-orange-400">
                            您的每日總消耗熱量 (TDEE) 約為：
                            <span className="font-bold text-orange-300"> {tdee} 大卡</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-center">
                            <div className="p-4 rounded bg-orange-100/10 border border-green-500">
                                <p className="font-semibold text-green-400">減脂建議</p>
                                <p className="text-xl font-bold text-green-200">{tdee - 300} 大卡</p>
                            </div>
                            <div className="p-4 rounded bg-orange-100/10 border border-yellow-500">
                                <p className="font-semibold text-yellow-400">維持體重</p>
                                <p className="text-xl font-bold text-yellow-200">{tdee} 大卡</p>
                            </div>
                            <div className="p-4 rounded bg-orange-100/10 border border-blue-500">
                                <p className="font-semibold text-blue-400">增肌建議</p>
                                <p className="text-xl font-bold text-blue-200">{tdee + 300} 大卡</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
