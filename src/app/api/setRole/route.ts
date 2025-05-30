import { NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { uid, role } = body;

        if (!uid || !role) {
            return NextResponse.json({ error: "缺少 uid 或 role" }, { status: 400 });
        }

        // 從 headers 拿 token
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.split(" ")[1];

        if (!token) {
            return NextResponse.json({ error: "缺少身份驗證資訊" }, { status: 401 });
        }

        // 驗證 token 並檢查 role
        const decoded = await admin.auth().verifyIdToken(token);

        if (decoded.role !== "admin") {
            return NextResponse.json({ error: "沒有權限執行此操作" }, { status: 403 });
        }

        // 寫入 custom claims
        await admin.auth().setCustomUserClaims(uid, { role });

        return NextResponse.json({ message: "Role 設定成功" });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
