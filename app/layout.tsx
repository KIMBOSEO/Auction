import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import { ThemeProvider } from "@/app/components/ThemeContext";

// 폰트 설정
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 사이트 정보 설정
export const metadata: Metadata = {
  title: "가물치 경매",
  description: "뿌요님의 멋진 경매 사이트",
};

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
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 transition-colors">
        {/* 1. ThemeProvider가 가장 바깥에서 다크모드를 관리합니다 */}
        <ThemeProvider>
          {/* 2. Providers가 로그인 정보를 관리합니다 */}
          <Providers>
            {/* 3. Navbar가 로그인 정보를 받아와서 적절히 보여줍니다 */}
            <Navbar />
            
            {/* 4. 실제 페이지 내용이 표시되는 곳 */}
            <main className="flex-grow">
              {children}
            </main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}