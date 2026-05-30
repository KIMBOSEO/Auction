'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useTheme } from '@/app/components/ThemeContext';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const getAuthAndProfile = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', currentUser.id)
          .single();
        if (data?.nickname) setNickname(data.nickname);
      }
    };

    getAuthAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setNickname('');
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (confirm('정말 로그아웃하시겠습니까?')) {
      await supabase.auth.signOut();
      setUser(null);
      setNickname('');
      window.location.href = '/';
    }
  };

  return (
    <nav className="border-b bg-white dark:bg-gray-900 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 p-2 rounded-2xl transition-all active:scale-90 active:bg-gray-100 dark:active:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => setMenuOpen(false)}
        >
          <span className="text-xl md:text-2xl text-blue-600 dark:text-blue-400 font-black tracking-tighter">GA-MUL-CHI</span>
        </Link>

        {/* 데스크탑 메뉴 */}
        <div className="hidden md:flex items-center gap-6 font-bold text-gray-600 dark:text-gray-300">
          <Link href="/create" className="hover:text-blue-600 dark:hover:text-blue-400 transition">물건 올리기</Link>
          {user && <NotificationCenter />}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title={isDark ? '라이트모드로' : '다크모드로'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/mypage" className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-5 py-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
                👤 {nickname || '닉네임 미설정'}
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 text-sm font-bold transition"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900 transition">로그인</Link>
          )}
        </div>

        {/* 모바일 우측: 알림 + 다크모드 + 햄버거 */}
        <div className="flex md:hidden items-center gap-2">
          {user && <NotificationCenter />}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="메뉴 열기"
          >
            <div className="w-5 flex flex-col gap-1.5">
              <span className={`block h-0.5 bg-gray-700 dark:bg-gray-300 rounded transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-gray-700 dark:bg-gray-300 rounded transition-all ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-gray-700 dark:bg-gray-300 rounded transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {menuOpen && (
        <div className="md:hidden border-t dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 flex flex-col gap-3 font-bold text-gray-700 dark:text-gray-300">
          <Link
            href="/create"
            onClick={() => setMenuOpen(false)}
            className="py-3 px-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            물건 올리기
          </Link>
          {user ? (
            <>
              <Link
                href="/mypage"
                onClick={() => setMenuOpen(false)}
                className="py-3 px-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              >
                👤 {nickname || '닉네임 미설정'}
              </Link>
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="py-3 px-4 rounded-2xl text-left text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="py-3 px-4 rounded-2xl bg-blue-600 text-white text-center"
            >
              로그인
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
