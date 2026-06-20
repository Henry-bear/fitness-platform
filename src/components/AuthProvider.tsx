"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthContextValue = {
    user: User | null;
    loading: boolean;
    error: string | null;
    retry: () => void;
};

const AUTH_TIMEOUT_MS = 10_000;
const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setLoading(false);
            setError("登入狀態讀取逾時，請檢查網路後重試");
        }, AUTH_TIMEOUT_MS);

        const unsubscribe = onAuthStateChanged(
            auth,
            (firebaseUser) => {
                window.clearTimeout(timeoutId);
                setUser(firebaseUser);
                setError(null);
                setLoading(false);
            },
            () => {
                window.clearTimeout(timeoutId);
                setError("暫時無法確認登入狀態，請稍後重試");
                setLoading(false);
            },
        );

        return () => {
            window.clearTimeout(timeoutId);
            unsubscribe();
        };
    }, []);

    const value = useMemo<AuthContextValue>(() => ({
        user,
        loading,
        error,
        retry: () => window.location.reload(),
    }), [error, loading, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth 必須在 AuthProvider 內使用");
    return context;
}
