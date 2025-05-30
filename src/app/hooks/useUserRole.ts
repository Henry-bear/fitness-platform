import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { User } from "firebase/auth";

type Role = "member" | "groupCoach" | "personalTrainer" | "admin";

export function useUserRole(user: User | null) {
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            if (!user) {
                console.log("hook: user is null");
                setRole(null);
                setLoading(false);
                return;
            }

            try {
                console.log("hook: user.uid", user.uid);
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    console.log("hook: docSnap 不存在");
                    setRole("member");
                    setLoading(false);
                    return;
                }

                const data = docSnap.data();
                console.log("hook: docSnap.data()", data);

                let fetchedRole = data?.role;
                console.log("hook: fetchedRole", fetchedRole);

                const validRoles: Role[] = ["member", "groupCoach", "personalTrainer", "admin"];
                if (fetchedRole === undefined) {
                    await updateDoc(docRef, { role: "member" });
                    fetchedRole = "member";
                } else if (!validRoles.includes(fetchedRole)) {
                    console.warn("hook: Firestore role 欄位內容異常:", fetchedRole);
                    // fetchedRole = "member";
                }
                setRole(fetchedRole);
                console.log("hook: setRole", fetchedRole);
            } catch (err) {
                console.error("hook: 讀取使用者角色失敗", err);
                setRole("member");
            } finally {
                setLoading(false);
            }
        };

        fetchRole();
    }, [user]);

    return { role, loading };
}
