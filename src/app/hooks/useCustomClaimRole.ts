import { useEffect, useState } from "react";
import { User } from "firebase/auth";

type Role = "member" | "groupCoach" | "personalTrainer" | "admin";

export function useCustomClaimRole(user: User | null) {
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);
    const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        if (!user) {
            setRole(null);
            setResolvedUserId(null);
            setLoading(false);
            return () => {
                isActive = false;
            };
        }

        setLoading(true);

        const fetchRole = async () => {
            try {
                const token = await user.getIdTokenResult();
                const customRole = token.claims.role;
                if (!isActive) return;

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
                if (isActive) setRole(null);
            } finally {
                if (isActive) {
                    setResolvedUserId(user.uid);
                    setLoading(false);
                }
            }
        };
        fetchRole();

        return () => {
            isActive = false;
        };
    }, [user]);
    const currentUserId = user?.uid ?? null;
    return { role, loading: loading || resolvedUserId !== currentUserId };
}
