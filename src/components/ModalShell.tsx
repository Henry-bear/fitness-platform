"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import ModalPortal from "./ModalPortal";

type Props = {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    icon?: ReactNode;
    children: ReactNode;
    titleId?: string;
    maxWidth?: "sm" | "md" | "lg";
};

const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
};

export default function ModalShell({ open, onClose, title, description, icon, children, titleId = "modal-title", maxWidth = "md" }: Props) {
    if (!open) return null;

    return (
        <ModalPortal>
            <motion.div
                className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onMouseDown={(event) => event.target === event.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 340, damping: 28 }}
                    className={`relative my-auto w-full ${widthClasses[maxWidth]} overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 p-6 text-white shadow-2xl shadow-black/60`}
                >
                    <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
                    <button type="button" onClick={onClose} aria-label={`關閉${title}`} className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
                    <header className="relative mb-6 flex items-start gap-3 pr-10">
                        {icon && <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">{icon}</div>}
                        <div><h2 id={titleId} className="text-xl font-bold text-white">{title}</h2>{description && <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>}</div>
                    </header>
                    <div className="relative">{children}</div>
                </motion.div>
            </motion.div>
        </ModalPortal>
    );
}
