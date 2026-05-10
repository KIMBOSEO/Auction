import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

// 1. 폰트 설정 (기본 제공)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. 메타데이터 설정 (사이트 이름 등을 정해요)
export const metadata: Metadata = {
  title: "가물치 경매",
  description: "세상에서 가장 신선한 경매 사이트",
};

// 3. 진짜 대장 RootLayout (하나로 합치기!)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* 모든 페이지 상단에 나타날 네비게이션 바 */}
        <Navbar />
        
        {/* 실제 페이지 내용들이 들어갈 공간 */}
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}