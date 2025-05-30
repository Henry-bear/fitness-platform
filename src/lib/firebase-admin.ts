import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin 初始化失敗，請確認環境變數");
}

try {
    // 修正換行
    privateKey = privateKey.replace(/\\n/g, "\n");

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
    }
} catch (err) {
    console.error("Firebase Admin 初始化失敗：", err);
    throw err;
}

export default admin;
