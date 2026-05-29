import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "next-themes"; // 🌟 다크모드 라이브러리 공급원

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "가물치 경매장 | GA-MUL-CHI",
  description: "실시간 희귀카드 및 보물 경매 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 🌟 lang 설정을 고정하고 hydration 매칭 오류를 방지하기 위해 suppressHydrationWarning 추가
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200`}>
        {/* 
          🌟 [해결의 열쇠] 
          attribute="class" 설정을 주어 Tailwind의 dark: 접두사가 브라우저 테마와 완벽하게 연동되게 합니다.
          body 태그의 '가장 최상단'에서 children을 감싸주어야 404 페이지(_not-found)도 튕기지 않고 흡수됩니다.
        */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}