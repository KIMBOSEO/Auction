'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 🌟 시스템 설정 또는 localStorage에서 다크모드 상태 로드
    const stored = localStorage.getItem('theme-dark');
    if (stored !== null) {
      setIsDark(stored === 'true');
    } else {
      // 시스템 설정 확인
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  const toggleTheme = () => {
    const newState = !isDark;
    setIsDark(newState);
    localStorage.setItem('theme-dark', String(newState));
    
    // 🌟 DOM에 dark 클래스 추가/제거
    if (newState) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (mounted) {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDark, mounted]);

  // 🌟 항상 Provider로 감싸서 SSR/프리렌더링 중에도 컨텍스트가 유지되도록 함
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  // 🌟 Provider 외부에서 사용 시 에러 대신 안전한 기본값 반환 (빌드 안정성)
  if (!context) {
    return { isDark: false, toggleTheme: () => {} };
  }
  return context;
}
