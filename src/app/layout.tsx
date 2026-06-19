import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "FitnessWay 健身平台",
    template: "%s | FitnessWay",
  },
  description: "記錄體態、預約課程，打造個人專屬訓練路線",
  openGraph: {
    title: "FitnessWay 健身平台",
    description: "記錄體態、預約課程，打造個人專屬訓練路線",
    type: "website",
    locale: "zh_TW",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-black font-sans text-white antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1f1f1f",
              color: "#ffa500",
              fontWeight: 600,
              border: "1px solid #ffa500",
              borderRadius: "8px",
            },
          }}
        />
        <Footer />
      </body>
    </html>
  );
}
