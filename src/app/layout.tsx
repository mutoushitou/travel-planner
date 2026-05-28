import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/auth/Providers";

export const metadata: Metadata = {
  title: "智能旅游规划",
  description: "AI 驱动的智能旅游规划平台，一键生成个性化行程",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
