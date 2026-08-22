git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
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
  title: "海洋馆奇妙夜 V2｜会因事而变的 ADHD 潜水路线",
  description: "把突然出现的研究任务交给海洋。潜水向导会辨认事项类型、拆成真正具体的小步子，并在太大或方向不对时重新规划。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "海洋馆奇妙夜 V2",
    description: "今天不用征服整片海洋，只需要跟一条鱼游一小段。",
    images: [{ url: "/og-v2.png", width: 1731, height: 909, alt: "夜光海洋里的小丑鱼沿着气泡浮标向前游" }],
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
