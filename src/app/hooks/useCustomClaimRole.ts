import { useEffect, useState } from "react";
import { User } from "firebase/auth";

type Role = "member" | "groupCoach" | "personalTrainer" | "admin";

export function useCustomClaimRole(user: User | null) {
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setRole(null)
            setLoading(false);
            return;
        }

        const fetchRole = async () => {
            try {
                const token = await user.getIdTokenResult(true); // 刷新 token
                const customRole = token.claims.role;
                if (
                    customRole === "admin" ||
                    customRole === "member" ||
                    customRole === "groupCoach" ||
                    customRole === "personalTrainer"
                ) {
                    setRole(customRole);
                } else {
                    setRole("member"); // fallback 預設
                }
            } catch (err) {
                console.error("無法取得 custom claim role:", err);
                setRole(null);
            } finally {
                setLoading(false);
            }
        };
        fetchRole();
    }, [user]);
    return { role, loading };
}