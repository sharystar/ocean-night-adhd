import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ocean-night-adhd.chanshunlamedu.chatgpt.site"),
  title: "海洋馆奇妙夜 V3.1｜把混在一起的今天，说给海洋听",
  description: "一次说完任务、沟通、研究和情绪负担。海洋收件箱会把它们分成不同鱼卵，由你决定真实需要的时间。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "海洋馆奇妙夜 V3.1 · 手绘深海",
    description: "把混在一起的今天一次说完，海洋会替你分开。",
    images: [{ url: "/og.png", width: 1200, height: 683, alt: "一颗装着混乱思绪的大泡泡分成四枚海洋伙伴鱼卵" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "海洋馆奇妙夜 V3.1 · 手绘深海",
    description: "把混在一起的今天一次说完，海洋会替你分开。",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
