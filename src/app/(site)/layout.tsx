"use client";
import { usePathname } from "next/navigation";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const withTransition = ["/", "/member"].includes(pathname);

    return (
        <>
            {/* 只有首頁或 member 用動畫 */}
            {withTransition ? (
                <div className="transition-opacity duration-300 animate-fade-in">{children}</div>
            ) : (
                children
            )}
        </>
    );
}
