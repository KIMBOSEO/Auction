'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useTheme } from '@/app/components/ThemeContext';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState<string>('');
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
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 p-2 rounded-2xl transition-all active:scale-90 active:bg-gray-100 dark:active:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 group"
        >
          <span className="text-2xl text-blue-600 dark:text-blue-400 font-black tracking-tighter">GA-MUL-CHI</span>
        </Link>

        <div className="flex items-center gap-6 font-bold text-gray-600 dark:text-gray-300">
          <Link href="/create" className="hover:text-blue-600 dark:hover:text-blue-400 transition">물건 올리기</Link>
          
          {/* 🌟 알림 센터 */}
          {user && <NotificationCenter />}
          
          {/* 🌟 다크모드 토글 버튼 */}
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
                title="로그아웃"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900 transition">로그인</Link>
          )}
        </div>
      </div>
    </nav>
  );
}