import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const validRoles = ["member", "groupCoach", "personalTrainer", "admin"] as const;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { uid, role } = body;

        if (!uid || !role) {
            return NextResponse.json({ error: "缺少 uid 或 role" }, { status: 400 });
        }

        if (
            typeof uid !== "string" ||
            typeof role !== "string" ||
            !validRoles.includes(role as (typeof validRoles)[number])
        ) {
            return NextResponse.json({ error: "uid 或 role 格式不合法" }, { status: 400 });
        }

        // 從 headers 拿 token
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.split(" ")[1];

        if (!token) {
            return NextResponse.json({ error: "缺少身份驗證資訊" }, { status: 401 });
        }

        // 驗證 token 並檢查 role
        const decoded = await adminAuth.verifyIdToken(token);

        if (decoded.role !== "admin") {
            return NextResponse.json({ error: "沒有權限執行此操作" }, { status: 403 });
        }


        if (decoded.uid === uid) {
            return NextResponse.json({ error: "不能變更自己的角色" }, { status: 400 });
        }

        const targetUser = await adminAuth.getUser(uid);
        const existingClaims = targetUser.customClaims ?? {};

        if (existingClaims.role === "admin") {
            return NextResponse.json({ error: "不能變更其他管理員的角色" }, { status: 400 });
        }

        const updatedClaims = { ...existingClaims, role };
        await adminAuth.setCustomUserClaims(uid, updatedClaims);

        try {
            await adminDb.doc(`users/${uid}`).update({ role });
        } catch (error) {
            await adminAuth.setCustomUserClaims(uid, existingClaims);
            throw error;
        }

        return NextResponse.json({ message: "Role 設定成功" });
    } catch (err) {
        console.error("更新使用者角色失敗", err);
        return NextResponse.json({ error: "更新角色失敗" }, { status: 500 });
    }
}
